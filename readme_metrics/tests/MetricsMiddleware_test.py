import pytest
import requests
import json

from .fixtures import Environ

from readme_metrics import MetricsApiConfig
from readme_metrics import MetricsMiddleware
from readme_metrics.Metrics import Metrics

# for this, I'm not exactly sure how to test the __call__ function
# possible options I considered was making a mock server inside this test case
# connected to the middleware somehow


class MockServer:
    def __init__(self):
        # Not working when I tried the first time, but might as well write it
        # self.app = Flask(__name__)
        # self.app.wsgi_app = MetricsMiddleware(#config details)
        pass

    # I think requests package shouldn't be used cos we cant get the request body so
    # I'm using it as placeholder
    def doGET(self, url, params):
        return requests.get(url, params)

    def doPOST(self, url, data):
        return requests.post(url, data=json.dumps(dict(data)))

    def doPUT(self, url, data):
        return requests.put(url, data=json.dumps(dict(data)))

    def mockWSGI(self):
        # create a moch wsgi that can call metrics middleware
        pass

    def sendRequestsAtOnce(self, requestQueue):
        # accumulate the requests and send at once to the mockWSGI
        return requestQueue


# Mock middleware config
def mockMiddlewareConfig():
    return MetricsApiConfig(
        "koSyKkViOR5gD6yjBxlsprHfjAIlWOh6",
        lambda req: {"id": "123", "label": "testuser", "email": "user@email.com"},
        buffer_length=1,
    )


# Verify that metrics has fields for metrics API and package name
assert Metrics.METRICS_API != None
assert Metrics.PACKAGE_NAME != None

# Mock callback for handling middleware response
class MetricsCoreMock:
    def process(self, req, res):
        self.req = req
        self.res = res


# Mock application
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


class TestMetricsMiddleware:
    def setUp(self):
        self.mockserver = MockServer()

    # @pytest.mark.skip(reason="@todo")
    def testNoRequest(self):
        pass

    def testGetRequest(self):
        emptyByteString = b""
        responseObjectString = "{ responseObject: 'value' }"
        environ = Environ.MockEnviron().getEnvironForRequest(emptyByteString, "GET")
        app = MockApplication(responseObjectString)
        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, mockMiddlewareConfig())
        middleware.metrics_core = metrics
        next(middleware(environ, app.mockStartResponse))
        assert metrics.req.data == emptyByteString
        assert metrics.req.method == "GET"
        assert metrics.res.body == responseObjectString

    def testEmptyPostRequest(self):
        jsonString = b""
        responseObjectString = "{ responseObject: 'value' }"
        environ = Environ.MockEnviron().getEnvironForRequest(jsonString, "POST")
        app = MockApplication(responseObjectString)
        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, mockMiddlewareConfig())
        middleware.metrics_core = metrics
        next(middleware(environ, app.mockStartResponse))
        assert metrics.req.data == jsonString
        assert metrics.req.method == "POST"
        assert metrics.res.body == responseObjectString

    def testNonEmptyPostRequest(self):
        jsonString = b"{abc: 123}"
        responseObjectString = "{ responseObject: 'value' }"
        environ = Environ.MockEnviron().getEnvironForRequest(jsonString, "POST")
        app = MockApplication(responseObjectString)
        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, mockMiddlewareConfig())
        middleware.metrics_core = metrics
        next(middleware(environ, app.mockStartResponse))
        assert metrics.req.data == jsonString
        assert metrics.req.method == "POST"
        assert metrics.res.body == responseObjectString

    @pytest.mark.skip(reason="@todo")
    def testMultipleRequests(self):
        # Test if multiple requests got through and processed
        # check by using the length of the request queue and loop by calling the
        # middleware for that length
        # Test multiple requests but some of it has garbage data(?)
        pass

    @pytest.mark.skip(reason="@todo")
    def testClosed(self):
        # Test if iterable got closed properly
        pass

    # Other tests that I think can be tested, but unsure if this should be tested in
    # this section
    @pytest.mark.skip(reason="@todo")
    def testHeaders(self):
        # Test to verify if the response header is passed correctly
        pass

    @pytest.mark.skip(reason="@todo")
    def testStatus(self):
        # Test to verify if the response status is passed correctly
        pass
