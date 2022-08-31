from collections.abc import Mapping
import importlib
import json
from json import JSONDecodeError
from logging import Logger
import os
import platform
import time

from typing import List, Optional
from urllib import parse
import uuid

from readme_metrics import ResponseInfoWrapper


class PayloadBuilder:
    """
    Internal builder class that handles the construction of the request and response
    portions of the payload sent to the ReadMe API.

    Attributes:
        denylist (List[str]): Cached denylist for current PayloadBuilder instance
        allowlist (List[str]): Cached allowlist for current PayloadBuilder instance
        development_mode (bool): Cached development mode parameter for current
            PayloadBuilder instance
        grouping_function ([type]): Cached grouping function for current PayloadBuilder
            instance
    """

    def __init__(
        self,
        denylist: List[str],
        allowlist: List[str],
        development_mode: bool,
        grouping_function,
        logger: Logger,
    ):
        """Creates a PayloadBuilder instance with the supplied configuration

        Args:
            denylist (List[str]): Header/JSON body denylist
            allowlist (List[str]): Header/JSON body allowlist
            development_mode (bool): Development mode flag passed to ReadMe
            grouping_function ([type]): Grouping function to generate an identity
                payload
            logger (Logger): Logging
        """
        self.denylist = denylist
        self.allowlist = allowlist
        self.development_mode = development_mode
        self.grouping_function = grouping_function
        self.logger = logger

    def __call__(self, request, response: ResponseInfoWrapper) -> dict:
        """Builds a HAR payload encompassing the request & response data

        Args:
            request: Request information to use, either a `werkzeug.Request`
                or a `django.core.handlers.wsgi.WSGIRequest`.
            response (ResponseInfoWrapper): Response information to use

        Returns:
            dict: Payload object (ready to be serialized and sent to ReadMe)
        """
        group = self.grouping_function(request)
        group = self._validate_group(group)
        if group is None:
            return None

        payload = {
            "_id": str(uuid.uuid4()),
            "group": group,
            "clientIPAddress": request.environ.get("REMOTE_ADDR"),
            "development": self.development_mode,
            "request": {
                "log": {
                    "creator": {
                        "name": "readme-metrics (python)",
                        "version": importlib.import_module(__package__).__version__,
                        "comment": self._get_har_creator_comment(),
                    },
                    "entries": [
                        {
                            "pageref": self._build_base_url(request),
                            "startedDateTime": request.rm_start_dt,
                            "time": int(time.time() * 1000) - request.rm_start_ts,
                            "request": self._build_request_payload(request),
                            "response": self._build_response_payload(response),
                        }
                    ],
                }
            },
        }

        return payload

    def _get_har_creator_comment(self):
        # arm64-darwin21.3.0/3.8.9
        return (
            platform.machine()
            + "-"
            + platform.system().lower()
            + os.uname().release
            + "/"
            + platform.python_version()
        )

    def _validate_group(self, group: Optional[dict]):
        if group is None:
            return None
        if not isinstance(group, dict):
            self.logger.error(
                "Grouping function returned %s but should return a dict; not logging this request",
                type(group).__name__,
            )
            return None

        if "api_key" in group:
            # The public API for the grouping function now asks users to return
            # an "api_key", but our Metrics API expects an "id" field. Quietly
            # update it to "id".
            group["id"] = group["api_key"]
            del group["api_key"]
        elif "id" not in group:
            self.logger.error(
                "Grouping function response missing 'api_key' field; not logging this request"
            )
            return None

        for field in ["email", "label"]:
            if field not in group:
                self.logger.warning(
                    "Grouping function response missing %s field; logging request anyway",
                    field,
                )
        extra_fields = set(group.keys()).difference(["id", "email", "label"])
        if extra_fields:
            # pylint: disable=C0301
            self.logger.warning(
                "Grouping function included unexpected field(s) in response: %s; discarding those fields and logging request anyway",
                extra_fields,
            )
            for field in extra_fields:
                del group[field]

        return group

    def _get_content_type(self, headers):
        return headers.get("content-type", "text/plain")

    def _build_request_payload(self, request) -> dict:
        """Wraps the request portion of the payload

        Args:
            request (Request): Request object containing the request information, either
                a `werkzeug.Request` or a `django.core.handlers.wsgi.WSGIRequest`.

        Returns:
            dict: Wrapped request payload
        """
        headers = self.redact_dict(request.headers)
        queryString = parse.parse_qsl(self._get_query_string(request))

        content_type = self._get_content_type(headers)
        post_data = False
        if getattr(request, "content_length", None) or getattr(
            request, "rm_content_length", None
        ):
            if content_type == "application/x-www-form-urlencoded":
                # Flask creates `request.form` but Django puts that data in `request.body`, and
                # then our `request.rm_body` store, instead.
                if hasattr(request, "form"):
                    params = [
                        # Reason this is not mixed in with the `rm_body` parsing if we don't have
                        # `request.form` is that if we attempt to do `str(var, 'utf-8)` on data
                        # coming out of `request.form.items()` an "decoding str is not supported"
                        # exception will be raised as they're already strings.
                        {"name": k, "value": v}
                        for (k, v) in request.form.items()
                    ]
                else:
                    params = [
                        # `request.form.items` will give us already decoded UTF-8 data but
                        # `parse_qsl` gives us bytes. If we don't do this we'll be creating an
                        # invalid JSON payload.
                        {
                            "name": str(k, "utf-8"),
                            "value": str(v, "utf-8"),
                        }
                        for (k, v) in parse.parse_qsl(request.rm_body)
                    ]

                post_data = {
                    "mimeType": content_type,
                    "params": params,
                }
            else:
                post_data = self._process_body(content_type, request.rm_body)

        payload = {
            "method": request.method,
            "url": self._build_base_url(request),
            "httpVersion": request.environ["SERVER_PROTOCOL"],
            "headers": [{"name": k, "value": v} for (k, v) in headers.items()],
            "queryString": [{"name": k, "value": v} for (k, v) in queryString],
        }

        if not post_data is False:
            payload["postData"] = post_data

        return payload

    def _build_response_payload(self, response: ResponseInfoWrapper) -> dict:
        """Wraps the response portion of the payload

        Args:
            response (ResponseInfoWrapper): containing the response information

        Returns:
            dict: Wrapped response payload
        """
        headers = self.redact_dict(response.headers)
        content_type = self._get_content_type(response.headers)
        body = self._process_body(content_type, response.body).get("text")

        headers = [{"name": k, "value": v} for (k, v) in headers.items()]

        status_string = str(response.status)
        status_code = int(status_string.split(" ")[0])
        status_text = status_string.replace(str(status_code) + " ", "")

        return {
            "status": status_code,
            "statusText": status_text or "",
            "headers": headers,
            "content": {
                "text": body,
                "size": int(response.content_length),
                "mimeType": response.content_type,
            },
        }

    def _get_query_string(self, request):
        """Helper function to get the query string for a request, translating fields from
        either a Werkzeug Request object or a Django WSGIRequest object.

        Args:
            request (Request): Request object containing the request information, either
                a `werkzeug.Request` or a `django.core.handlers.wsgi.WSGIRequest`.

        Returns:
            str: Query string, for example "field1=value1&field2=value2"
        """
        if hasattr(request, "query_string"):
            # works for Werkzeug request objects only
            result = request.query_string
        elif "QUERY_STRING" in request.environ:
            # works for Django, and possibly other request objects too
            result = request.environ["QUERY_STRING"]
        else:
            raise Exception(
                "Don't know how to retrieve query string from this type of request"
            )

        if isinstance(result, bytes):
            result = result.decode("utf-8")

        return result

    def _build_base_url(self, request):
        """Helper function to get the base URL for a request (full URL excluding the
        query string), translating fields from either a Werkzeug Request object or a
        Django WSGIRequest object.

        Args:
            request (Request): Request object containing the request information, either
                a `werkzeug.Request` or a `django.core.handlers.wsgi.WSGIRequest`.

        Returns:
            str: Query string, for example "https://api.example.local:8080/v1/userinfo"
        """
        query_string = self._get_query_string(request)
        if hasattr(request, "base_url"):
            # Werkzeug request objects already have exactly what we need
            base_url = request.base_url
            if len(query_string) > 0:
                base_url += f"?{query_string}"
            return base_url

        scheme, host, path = None, None, None

        if "wsgi.url_scheme" in request.environ:
            scheme = request.environ["wsgi.url_scheme"]

        # pylint: disable=protected-access
        if hasattr(request, "_get_raw_host"):
            # Django request objects already have a properly formatted host field
            host = request._get_raw_host()
        elif "HTTP_HOST" in request.environ:
            host = request.environ["HTTP_HOST"]

        if "PATH_INFO" in request.environ:
            path = request.environ["PATH_INFO"]

        if scheme and path and host:
            if len(query_string) > 0:
                return f"{scheme}://{host}{path}?{query_string}"
            return f"{scheme}://{host}{path}"

        raise Exception("Don't know how to build URL from this type of request")

    # always returns a dict with some of these fields: text, mimeType, params
    def _process_body(self, content_type, body):
        if isinstance(body, bytes):
            # Non-unicode bytes cannot be directly serialized as a JSON
            # payload to send to the ReadMe API, so we need to convert this to a
            # unicode string first. But we don't know what encoding it might be
            # using, if any (it could also just be raw bytes, like an image).
            # We're going to assume that if it's possible to decode at all, then
            # it's most likely UTF-8. If we can't decode it, just send an error
            # with the JSON payload.
            try:
                body = body.decode("utf-8")
            except UnicodeDecodeError:
                return {"mimeType": content_type, "text": "[NOT VALID UTF-8]"}

        if not isinstance(body, str):
            # We don't know how to process this body. If it's safe to encode as
            # JSON, return it unchanged; otherwise return an error.
            try:
                json.dumps(body)
                return {"mimeType": content_type, "text": body}
            except TypeError:
                return {"mimeType": content_type, "text": "[ERROR: NOT SERIALIZABLE]"}

        try:
            body_data = json.loads(body)
        except JSONDecodeError:
            return {"mimeType": content_type, "text": body}

        if (self.denylist or self.allowlist) and isinstance(body_data, dict):
            redacted_data = self.redact_dict(body_data)
            body = json.dumps(redacted_data)

        return {"mimeType": content_type, "text": body}

    def redact_dict(self, mapping: Mapping):
        def _redact_value(val):
            if isinstance(val, str):
                return f"[REDACTED {len(val)}]"

            return "[REDACTED]"

        # Short-circuit this function if there's no allowlist or denylist
        if not (self.allowlist or self.denylist):
            return mapping

        result = {}
        for (key, value) in mapping.items():
            if self.denylist and key in self.denylist:
                result[key] = _redact_value(value)
            elif self.allowlist and key not in self.allowlist:
                result[key] = _redact_value(value)
            else:
                result[key] = value
        return result
