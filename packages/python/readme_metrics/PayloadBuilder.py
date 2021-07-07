from collections.abc import Mapping
import json
from json import JSONDecodeError
import sys
import time
import importlib
from typing import List
from urllib import parse

import requests
from readme_metrics import ResponseInfoWrapper
from werkzeug import Request


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
    ):
        """Creates a PayloadBuilder instance with the supplied configuration

        Args:
            denylist (List[str]): Header/JSON body denylist
            allowlist (List[str]): Header/JSON body allowlist
            development_mode (bool): Development mode flag passed to ReadMe
            grouping_function ([type]): Grouping function to generate an identity
                payload
        """
        self.denylist = denylist
        self.allowlist = allowlist
        self.development_mode = "true" if development_mode else "false"
        self.grouping_function = grouping_function

    def __call__(self, request: Request, response: ResponseInfoWrapper) -> dict:
        """Builds a HAR payload encompassing the request & response data

        Args:
            request (Request): Request information to use
            response (ResponseInfoWrapper): Response information to use

        Returns:
            dict: Payload object (ready to be serialized and sent to ReadMe)
        """
        group = self.grouping_function(request)
        if "api_key" in group:
            group["id"] = group["api_key"]
            del group["api_key"]

        payload = {
            "group": group,
            "clientIPAddress": request.remote_addr,
            "development": self.development_mode,
            "request": {
                "log": {
                    "creator": {
                        "name": __name__,
                        "version": importlib.import_module(__package__).__version__,
                        "comment": sys.version,
                    },
                    "entries": [
                        {
                            "pageref": request.base_url,
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

    def _build_request_payload(self, request: Request) -> dict:
        """Wraps the request portion of the payload

        Args:
            request (Request): Request object containing the response information

        Returns:
            dict: Wrapped request payload
        """
        headers = self._redact_dict(request.headers)
        params = parse.parse_qsl(request.query_string.decode("utf-8"))

        if request.content_length:
            post_data = self._process_body(request.rm_body)
        else:
            post_data = {}

        return {
            "method": request.method,
            "url": request.base_url,
            "httpVersion": request.environ["SERVER_PROTOCOL"],
            "headers": [{"name": k, "value": v} for (k, v) in headers.items()],
            "queryString": [{"name": k, "value": v} for (k, v) in params],
            **post_data,
        }

    def _build_response_payload(self, response: ResponseInfoWrapper) -> dict:
        """Wraps the response portion of the payload

        Args:
            response (ResponseInfoWrapper): containing the response information

        Returns:
            dict: Wrapped response payload
        """
        headers = self._redact_dict(response.headers)
        body = self._process_body(response.body).get("text")

        headers = [{"name": k, "value": v} for (k, v) in headers.items()]

        status_string = str(response.status)
        status_code = int(status_string.split(" ")[0])
        status_text = status_string.replace(str(status_code) + " ", "")

        return {
            "status": status_code,
            "statusText": status_text or "",
            "headers": headers,  # headers.items(),
            "content": {
                "text": body,
                "size": response.content_length,
                "mimeType": response.content_type,
            },
        }

    # always returns a dict with some of these fields: text, mimeType, params}
    def _process_body(self, body):
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
                return {"text": "[ERROR: NOT VALID UTF-8]"}

        if not isinstance(body, str):
            # We don't know how to process this body. If it's safe to encode as
            # JSON, return it unchanged; otherwise return an error.
            try:
                json.dumps(body)
                return {"text": body}
            except TypeError:
                return {"text": "[ERROR: NOT SERIALIZABLE]"}

        try:
            body_data = json.loads(body)
        except JSONDecodeError:
            params = parse.parse_qsl(body)
            if params:
                return {
                    "text": body,
                    "mimeType": "multipart/form-data",
                    "params": [{"name": k, "value": v} for (k, v) in params],
                }
            else:
                return {"text": body}

        if (self.denylist or self.allowlist) and isinstance(body_data, dict):
            redacted_data = self._redact_dict(body_data)
            body = json.dumps(redacted_data)

        return {"text": body, "mimeType": "application/json"}

    def _redact_dict(self, mapping: Mapping):
        def _redact_value(v):
            if isinstance(v, str):
                return f"[REDACTED {len(v)}]"
            else:
                return "[REDACTED]"

        # Short-circuit this function if there's no allowlist or denylist
        if not (self.allowlist or self.denylist):
            return mapping

        result = dict()
        for (key, value) in mapping.items():
            if self.denylist and key in self.denylist:
                result[key] = _redact_value(value)
            elif self.allowlist and key not in self.allowlist:
                result[key] = _redact_value(value)
            else:
                result[key] = value
        return result
