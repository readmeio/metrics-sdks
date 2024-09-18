import json
import uuid

from readme_metrics import MetricsApiConfig
from readme_metrics import MetricsMiddleware
from readme_metrics.PayloadBuilder import PayloadBuilder
from readme_metrics.util import mask
from .fixtures import Environ


class MetricsCoreMock:
    def process(self, req, res):
        self.req = req
        self.res = res


class MockApplication:
    def __init__(self, res):
        self.res = res

    def __call__(self, environ, start_response):
        self.environ = environ
        self.start_response = start_response
        return [self.res.encode("utf-8")]

    def mockStartResponse(self, status, headers):
        self.status = status
        self.headers = headers


class TestUtils:
    def testMask(self):
        # pylint: disable=line-too-long
        assert (
            mask("deadbeef")
            == "sha512-ETo7x4PYUfwDcyFLGep76fo95UHsuf4CbVLGA+jqGcF0zA6XBfi5DTEiEsDDpthFPd+z4xQUCc9L7cjvAzWQtA==?beef"
        )


class TestPayloadBuilder:
    """
    Unit Tests for Payload Builder to make sure the created payloads are created
    correctly to the json request.

    Requests data can either be grabbed from an actual request, or maybe fake some JSON
    data that's similar in datatype as the one PayloadBuilder receives.

    Basic pattern is create payload, get data, compare, then assert.
    """

    def createPayload(self, config):
        # use this to test different blacklist/whitelist/devmode/groupfunc
        # return the payload from the custom config
        return PayloadBuilder(
            config.DENYLIST,
            config.ALLOWLIST,
            config.IS_DEVELOPMENT_MODE,
            config.GROUPING_FUNCTION,
            config.LOGGER,
        )

    def getMetricData(self):
        # function on getting the metric data
        res = None
        return res

    def compareRequests(self):
        # Compare the two contents and check if they are similar(?)
        return True

    def mockMiddlewareConfig(self, **kwargs):
        return MetricsApiConfig(
            "README_API_KEY",
            kwargs.get(
                "grouping_function",
                lambda req: {
                    "api_key": "123",
                    "label": "testuser",
                    "email": "user@email.com",
                },
            ),
            buffer_length=1,
            development_mode=kwargs.get("development_mode"),
            denylist=kwargs.get("denylist", []),
            allowlist=kwargs.get("allowlist", []),
            blacklist=kwargs.get("blacklist", []),
            whitelist=kwargs.get("whitelist", []),
        )

    def test_denylist(self):
        config = self.mockMiddlewareConfig(denylist=["password"])

        req = json.dumps({"ok": 123, "password": 456}).encode()
        environ = Environ.MockEnviron().getEnvironForRequest(req, "POST")
        app = MockApplication("{ 'responseObject': 'value' }")

        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, config)
        middleware.metrics_core = metrics

        next(middleware(environ, app.mockStartResponse))

        payload = self.createPayload(config)
        data = payload(metrics.req, metrics.res, str(uuid.uuid4()))
        text = data["request"]["log"]["entries"][0]["request"]["postData"]["text"]

        assert text == '{"ok": 123, "password": "[REDACTED]"}'

    def test_allowlist(self):
        config = self.mockMiddlewareConfig(allowlist=["ok"])

        req = json.dumps({"ok": 123, "password": 456}).encode()
        environ = Environ.MockEnviron().getEnvironForRequest(req, "POST")
        app = MockApplication("{ 'responseObject': 'value' }")

        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, config)
        middleware.metrics_core = metrics

        next(middleware(environ, app.mockStartResponse))

        payload = self.createPayload(config)
        data = payload(metrics.req, metrics.res, str(uuid.uuid4()))
        text = data["request"]["log"]["entries"][0]["request"]["postData"]["text"]

        assert text == '{"ok": 123, "password": "[REDACTED]"}'

    def test_deprecated_blacklist(self):
        config = self.mockMiddlewareConfig(blacklist=["password"])

        req = json.dumps({"ok": 123, "password": 456}).encode()
        environ = Environ.MockEnviron().getEnvironForRequest(req, "POST")
        app = MockApplication("{ 'responseObject': 'value' }")

        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, config)
        middleware.metrics_core = metrics

        next(middleware(environ, app.mockStartResponse))

        payload = self.createPayload(config)
        data = payload(metrics.req, metrics.res, str(uuid.uuid4()))
        text = data["request"]["log"]["entries"][0]["request"]["postData"]["text"]

        assert "ok" in text
        assert "123" in text
        assert "password" in text
        assert "456" not in text
        assert "[REDACTED]" in text

    def test_deprecated_whitelist(self):
        config = self.mockMiddlewareConfig(whitelist=["ok"])

        req = json.dumps({"ok": 123, "password": 456}).encode()
        environ = Environ.MockEnviron().getEnvironForRequest(req, "POST")
        app = MockApplication("{ 'responseObject': 'value' }")

        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, config)
        middleware.metrics_core = metrics

        next(middleware(environ, app.mockStartResponse))

        payload = self.createPayload(config)
        data = payload(metrics.req, metrics.res, str(uuid.uuid4()))
        text = data["request"]["log"]["entries"][0]["request"]["postData"]["text"]

        assert "ok" in text
        assert "123" in text
        assert "password" in text
        assert "456" not in text
        assert "[REDACTED]" in text

    def test_grouping_function(self):
        config = self.mockMiddlewareConfig(
            grouping_function=lambda req: {
                "api_key": "spam",
                "email": "flavor@spam.musubi",
                "label": "Spam Musubi",
            }
        )

        environ = Environ.MockEnviron().getEnvironForRequest(b"", "POST")
        app = MockApplication("{ 'responseObject': 'value' }")

        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, config)
        middleware.metrics_core = metrics

        next(middleware(environ, app.mockStartResponse))

        payload = self.createPayload(config)
        data = payload(metrics.req, metrics.res, str(uuid.uuid4()))
        group = data["group"]

        assert group["id"] == mask("spam")
        assert group["email"] == "flavor@spam.musubi"
        assert group["label"] == "Spam Musubi"

    def test_mask_matches_node(self):
        config = self.mockMiddlewareConfig(
            grouping_function=lambda req: {
                "api_key": "Bearer: a-random-api-key",
                "email": "flavor@spam.musubi",
                "label": "Spam Musubi",
            }
        )

        environ = Environ.MockEnviron().getEnvironForRequest(b"", "POST")
        app = MockApplication("{ 'responseObject': 'value' }")

        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, config)
        middleware.metrics_core = metrics

        next(middleware(environ, app.mockStartResponse))

        payload = self.createPayload(config)
        data = payload(metrics.req, metrics.res, str(uuid.uuid4()))
        group = data["group"]

        assert (
            group["id"]
            == "sha512-7S+L0vUE8Fn6HI3836rtz4b6fVf6H4JFur6SGkOnL3b"
            + "FpC856+OSZkpIHphZ0ipNO+kUw1ePb5df2iYrNQCpXw==?-key"
        )
        assert group["email"] == "flavor@spam.musubi"
        assert group["label"] == "Spam Musubi"

    # `PayloadBuilder`` should return None if the `grouping_function`` returns
    # `None` (which means not to log the request).
    def test_grouping_function_that_returns_none(self):
        config = self.mockMiddlewareConfig(grouping_function=lambda req: None)

        environ = Environ.MockEnviron().getEnvironForRequest(b"", "POST")
        app = MockApplication("{ 'responseObject': 'value' }")

        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, config)
        middleware.metrics_core = metrics

        next(middleware(environ, app.mockStartResponse))

        payload_builder = self.createPayload(config)
        payload = payload_builder(metrics.req, metrics.res, str(uuid.uuid4()))

        assert payload is None

    def test_deprecated_id_grouping(self):
        config = self.mockMiddlewareConfig(
            grouping_function=lambda req: {
                "id": "spam",
                "email": "flavor@spam.musubi",
                "label": "Spam Musubi",
            }
        )

        environ = Environ.MockEnviron().getEnvironForRequest(b"", "POST")
        app = MockApplication("{ 'responseObject': 'value' }")

        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, config)
        middleware.metrics_core = metrics

        next(middleware(environ, app.mockStartResponse))

        payload = self.createPayload(config)
        data = payload(metrics.req, metrics.res, str(uuid.uuid4()))
        group = data["group"]

        assert group["id"] == mask("spam")
        assert group["email"] == "flavor@spam.musubi"
        assert group["label"] == "Spam Musubi"

    def test_grouping_function_validation_when_missing_id(self):
        config = self.mockMiddlewareConfig(
            grouping_function=lambda req: {
                "email": "flavor@spam.musubi",
                "label": "Spam Musubi",
            }
        )

        environ = Environ.MockEnviron().getEnvironForRequest(b"", "POST")
        app = MockApplication("{ 'responseObject': 'value' }")

        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, config)
        middleware.metrics_core = metrics

        next(middleware(environ, app.mockStartResponse))

        payload = self.createPayload(config)
        data = payload(metrics.req, metrics.res, str(uuid.uuid4()))

        # When the `id` and `api_key` fields are both missing, the payload should be `None`
        assert data is None

    # Extra fields included in the grouping function response should be stripped from the payload.
    def test_grouping_function_validation_when_extra_fields_present(self):
        config = self.mockMiddlewareConfig(
            grouping_function=lambda req: {
                "id": "spam",
                "email": "flavor@spam.musubi",
                "label": "Spam Musubi",
                "telephone": "(939) 555-0113",
            }
        )

        response = "{ 'responseObject': 'value' }"
        environ = Environ.MockEnviron().getEnvironForRequest(b"", "POST")
        app = MockApplication(response)

        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, config)
        middleware.metrics_core = metrics

        next(middleware(environ, app.mockStartResponse))

        payload = self.createPayload(config)
        data = payload(metrics.req, metrics.res, str(uuid.uuid4()))

        assert isinstance(data, dict)
        assert "group" in data
        assert data["group"] == {
            "id": mask("spam"),
            "email": "flavor@spam.musubi",
            "label": "Spam Musubi",
        }

    def test_production_mode(self):
        config = self.mockMiddlewareConfig(development_mode=False)
        payload = self.createPayload(config)
        assert payload.development_mode is False

    def test_development_mode(self):
        config = self.mockMiddlewareConfig(development_mode=True)
        payload = self.createPayload(config)
        assert payload.development_mode is True

    def test_uuid_generation(self):
        config = self.mockMiddlewareConfig(development_mode=True)
        environ = Environ.MockEnviron().getEnvironForRequest(b"", "POST")
        app = MockApplication("{ 'responseObject': 'value' }")

        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, config)
        middleware.metrics_core = metrics

        next(middleware(environ, app.mockStartResponse))

        payload = self.createPayload(config)
        data = payload(metrics.req, metrics.res, str(uuid.uuid4()))

        print(data["_id"])

        assert data["_id"] == str(uuid.UUID(data["_id"], version=4))

    def test_har_creator(self):
        config = self.mockMiddlewareConfig(development_mode=True)
        req = json.dumps({"ok": 123, "password": 456}).encode()
        environ = Environ.MockEnviron().getEnvironForRequest(req, "POST")
        app = MockApplication("{ 'responseObject': 'value' }")

        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, config)
        middleware.metrics_core = metrics

        next(middleware(environ, app.mockStartResponse))

        payload = self.createPayload(config)
        data = payload(metrics.req, metrics.res, str(uuid.uuid4()))
        creator = data["request"]["log"]["creator"]

        assert creator["name"] == "readme-metrics (python)"
        assert isinstance(creator["version"], str)
        assert isinstance(creator["comment"], str)

        post_data = data["request"]["log"]["entries"][0]["request"]["postData"]

        assert post_data["text"] == json.dumps({"ok": 123, "password": 456})
        assert post_data["mimeType"] == "text/plain"

    def test_auth_header_masked(self):
        config = self.mockMiddlewareConfig(development_mode=True)
        environ = Environ.MockEnviron().getEnvironForRequest(b"", "GET")
        app = MockApplication("{ 'responseObject': 'value' }")

        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, config)
        middleware.metrics_core = metrics

        next(middleware(environ, app.mockStartResponse))

        payload = self.createPayload(config)
        data = payload(metrics.req, metrics.res, str(uuid.uuid4()))

        auth_header = None

        # Pull out the auth header
        for header in data["request"]["log"]["entries"][0]["request"]["headers"]:
            if header["name"] == "Authorization":
                auth_header = header["value"]

        assert auth_header and auth_header == mask(environ["HTTP_AUTHORIZATION"])
