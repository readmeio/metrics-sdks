import json
import uuid

import requests
import pytest

from readme_metrics import MetricsApiConfig
from readme_metrics import MetricsMiddleware
from readme_metrics.PayloadBuilder import PayloadBuilder
from .fixtures import Environ


# fetch json requests
class DataFetcher:
    def getJSON(self, url):
        res = requests.get(url)
        return res.json()

    def postJSON(self, url, param):
        res = requests.post(url, data=json.dumps(dict(param)))
        return res.json()

    def putJSON(self, url, param):
        res = requests.put(url, data=json.dumps(dict(param)))
        return res.json()


class MetricsCoreMock:
    def process(self, req, res):
        self.req = req
        self.res = res


class MockApplication:
    def __init__(self, responseObjectString):
        self.responseObjectString = responseObjectString

    def __call__(self, environ, start_response):
        self.environ = environ
        self.start_response = start_response
        return [self.responseObjectString.encode("utf-8")]

    def mockStartResponse(self, status, headers):
        self.status = status
        self.headers = headers


class TestPayloadBuilder:
    """
    Unit Tests for Payload Builder to make sure the created payloads are created
    correctly to the json request.

    Requests data can either be grabbed from an actual request, or maybe fake some JSON
    data that's similar in datatype as the one PayloadBuilder receives.

    Basic pattern is create payload, get data, compare, then assert.
    """

    def setUp(self):
        self.data_fetcher = DataFetcher()

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

    def testDenylist(self):

        # Tests when the website is blacklisted
        config = self.mockMiddlewareConfig(denylist=["password"])

        jsonString = json.dumps({"ok": 123, "password": 456}).encode()
        responseObjectString = "{ 'responseObject': 'value' }"
        environ = Environ.MockEnviron().getEnvironForRequest(jsonString, "POST")
        app = MockApplication(responseObjectString)
        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, config)
        middleware.metrics_core = metrics
        next(middleware(environ, app.mockStartResponse))
        payload = self.createPayload(config)
        data = payload(metrics.req, metrics.res)
        text = data["request"]["log"]["entries"][0]["request"]["text"]

        assert "ok" in text
        assert "123" in text
        assert "password" in text
        assert "456" not in text
        assert "[REDACTED]" in text

    def testAllowlist(self):
        config = self.mockMiddlewareConfig(allowlist=["ok"])

        jsonString = json.dumps({"ok": 123, "password": 456}).encode()
        responseObjectString = "{ 'responseObject': 'value' }"
        environ = Environ.MockEnviron().getEnvironForRequest(jsonString, "POST")
        app = MockApplication(responseObjectString)
        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, config)
        middleware.metrics_core = metrics
        next(middleware(environ, app.mockStartResponse))
        payload = self.createPayload(config)
        data = payload(metrics.req, metrics.res)
        text = data["request"]["log"]["entries"][0]["request"]["text"]

        assert "ok" in text
        assert "123" in text
        assert "password" in text
        assert "456" not in text
        assert "[REDACTED]" in text

    def testDeprecatedBlackListed(self):

        # Tests when the website is blacklisted
        config = self.mockMiddlewareConfig(blacklist=["password"])

        jsonString = json.dumps({"ok": 123, "password": 456}).encode()
        responseObjectString = "{ 'responseObject': 'value' }"
        environ = Environ.MockEnviron().getEnvironForRequest(jsonString, "POST")
        app = MockApplication(responseObjectString)
        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, config)
        middleware.metrics_core = metrics
        next(middleware(environ, app.mockStartResponse))
        payload = self.createPayload(config)
        data = payload(metrics.req, metrics.res)
        text = data["request"]["log"]["entries"][0]["request"]["text"]

        assert "ok" in text
        assert "123" in text
        assert "password" in text
        assert "456" not in text
        assert "[REDACTED]" in text

    def testDeprecatedWhiteListed(self):
        config = self.mockMiddlewareConfig(whitelist=["ok"])

        jsonString = json.dumps({"ok": 123, "password": 456}).encode()
        responseObjectString = "{ 'responseObject': 'value' }"
        environ = Environ.MockEnviron().getEnvironForRequest(jsonString, "POST")
        app = MockApplication(responseObjectString)
        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, config)
        middleware.metrics_core = metrics
        next(middleware(environ, app.mockStartResponse))
        payload = self.createPayload(config)
        data = payload(metrics.req, metrics.res)
        text = data["request"]["log"]["entries"][0]["request"]["text"]

        assert "ok" in text
        assert "123" in text
        assert "password" in text
        assert "456" not in text
        assert "[REDACTED]" in text

    def testGroupingFunction(self):
        config = self.mockMiddlewareConfig(
            grouping_function=lambda req: {
                "api_key": "spam",
                "email": "flavor@spam.musubi",
                "label": "Spam Musubi",
            }
        )

        responseObjectString = "{ 'responseObject': 'value' }"
        environ = Environ.MockEnviron().getEnvironForRequest(b"", "POST")
        app = MockApplication(responseObjectString)
        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, config)
        middleware.metrics_core = metrics
        next(middleware(environ, app.mockStartResponse))
        payload = self.createPayload(config)
        data = payload(metrics.req, metrics.res)
        group = data["group"]

        assert group["id"] == "spam"
        assert group["email"] == "flavor@spam.musubi"
        assert group["label"] == "Spam Musubi"

    def testGroupingFunctionNone(self):
        # PayloadBuilder should return None if the grouping_function returns
        # None (which means not to log the request).
        config = self.mockMiddlewareConfig(grouping_function=lambda req: None)

        responseObjectString = "{ 'responseObject': 'value' }"
        environ = Environ.MockEnviron().getEnvironForRequest(b"", "POST")
        app = MockApplication(responseObjectString)
        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, config)
        middleware.metrics_core = metrics
        next(middleware(environ, app.mockStartResponse))
        payload_builder = self.createPayload(config)
        payload = payload_builder(metrics.req, metrics.res)
        assert payload is None

    def testDeprecatedIDField(self):
        config = self.mockMiddlewareConfig(
            grouping_function=lambda req: {
                "id": "spam",
                "email": "flavor@spam.musubi",
                "label": "Spam Musubi",
            }
        )

        responseObjectString = "{ 'responseObject': 'value' }"
        environ = Environ.MockEnviron().getEnvironForRequest(b"", "POST")
        app = MockApplication(responseObjectString)
        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, config)
        middleware.metrics_core = metrics
        next(middleware(environ, app.mockStartResponse))
        payload = self.createPayload(config)
        data = payload(metrics.req, metrics.res)
        group = data["group"]

        assert group["id"] == "spam"
        assert group["email"] == "flavor@spam.musubi"
        assert group["label"] == "Spam Musubi"

    def testGroupingFunctionValidationWhenMissingId(self):
        config = self.mockMiddlewareConfig(
            grouping_function=lambda req: {
                "email": "flavor@spam.musubi",
                "label": "Spam Musubi",
            }
        )

        responseObjectString = "{ 'responseObject': 'value' }"
        environ = Environ.MockEnviron().getEnvironForRequest(b"", "POST")
        app = MockApplication(responseObjectString)
        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, config)
        middleware.metrics_core = metrics
        next(middleware(environ, app.mockStartResponse))
        payload = self.createPayload(config)
        data = payload(metrics.req, metrics.res)

        # When the "id" and "api_key" fields are both missing,
        # the payload should be None
        assert data is None

    def testGroupingFunctionValidationWhenExtraFields(self):
        # Extra fields included in the grouping function response
        # should be stripped from the payload
        config = self.mockMiddlewareConfig(
            grouping_function=lambda req: {
                "id": "spam",
                "email": "flavor@spam.musubi",
                "label": "Spam Musubi",
                "telephone": "(939) 555-0113",
            }
        )

        responseObjectString = "{ 'responseObject': 'value' }"
        environ = Environ.MockEnviron().getEnvironForRequest(b"", "POST")
        app = MockApplication(responseObjectString)
        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, config)
        middleware.metrics_core = metrics
        next(middleware(environ, app.mockStartResponse))
        payload = self.createPayload(config)
        data = payload(metrics.req, metrics.res)
        assert isinstance(data, dict)
        assert "group" in data
        group = data["group"]

        expected_group = {
            "id": "spam",
            "email": "flavor@spam.musubi",
            "label": "Spam Musubi",
        }
        assert group == expected_group

    def testProduction(self):
        config = self.mockMiddlewareConfig(development_mode=False)
        payload = self.createPayload(config)
        assert payload.development_mode is False

    def testDevelopment(self):
        config = self.mockMiddlewareConfig(development_mode=True)
        payload = self.createPayload(config)
        assert payload.development_mode is True

    def testUuid(self):
        config = self.mockMiddlewareConfig(development_mode=True)
        responseObjectString = "{ 'responseObject': 'value' }"
        environ = Environ.MockEnviron().getEnvironForRequest(b"", "POST")
        app = MockApplication(responseObjectString)
        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, config)
        middleware.metrics_core = metrics
        next(middleware(environ, app.mockStartResponse))
        payload = self.createPayload(config)
        data = payload(metrics.req, metrics.res)
        assert data["_id"] == str(uuid.UUID(data["_id"], version=4))

    # for test GET/POST/PUT I'm putting the status code tests for now since we cant
    # verify the body yet for status 401 and 403, they can also be moved to
    # blacklisted(?)
    @pytest.mark.skip(reason="@todo")
    def testGET(self):
        # payload = createPayload(MetricsApiConfig(#params here))

        # Test GET with 200
        # jsonRes = self.data_fetcher.getJSON(url)
        # readMeRes = self.getMetricData()
        # similar = compareRequests(jsonRes, readMeRes)
        # self.assertTrue(similar)

        # same pattern with these:
        # Test GET with 400 (Bad Request)
        # Test GET with 401 (Unauthorized)
        # Test GET with 403 (Forbidden)
        # Test GET with 404 (Not Found)
        pass

    @pytest.mark.skip(reason="@todo")
    def testPOST(self):
        # payload = createPayload(MetricsApiConfig(#params here))

        # Test POST with 200
        # jsonRes = self.data_fetcher.postJSON(url, param)
        # readMeRes = self.getMetricData()
        # similar = compareRequests(jsonRes, readMeRes)
        # self.assertTrue(similar)

        # same pattern with these:
        # Test POST with 400 (Bad Request)
        # Test POST with 401 (Unauthorized)
        # Test POST with 403 (Forbidden)
        # Test POST with 404 (Not Found)
        pass

    @pytest.mark.skip(reason="@todo")
    def testPUT(self):
        # payload = createPayload(MetricsApiConfig(#params here))

        # Test PUT with 200
        # jsonRes = self.data_fetcher.putJSON(url, param)
        # readMeRes = self.getMetricData()
        # similar = compareRequests(jsonRes, readMeRes)
        # self.assertTrue(similar)

        # same pattern with these:
        # Test PUT with 400 (Bad Request)
        # Test PUT with 401 (Unauthorized)
        # Test PUT with 403 (Forbidden)
        # Test PUT with 404 (Not Found)
        pass
