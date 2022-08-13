import pytest

from readme_metrics import MetricsApiConfig
from readme_metrics import MetricsMiddleware
from .fixtures import Environ


# Mock middleware config
def mockMiddlewareConfig():
    return MetricsApiConfig(
        "README_API_KEY",
        lambda req: {"id": "123", "label": "testuser", "email": "user@email.com"},
        buffer_length=1,
    )


# Mock callback for handling middleware response
class MetricsCoreMock:
    def process(self, req, res):
        self.req = req
        self.res = res


# Mock application
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


class TestMetricsMiddleware:
    def test_get_request(self):
        req = b""
        res = "{ responseObject: 'value' }"
        environ = Environ.MockEnviron().getEnvironForRequest(req, "GET")
        app = MockApplication(res)

        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, mockMiddlewareConfig())
        middleware.metrics_core = metrics

        next(middleware(environ, app.mockStartResponse))

        assert metrics.req.data == req
        assert metrics.req.method == "GET"
        assert metrics.res.body == res

    def test_empty_post_request(self):
        req = b""
        res = "{ responseObject: 'value' }"
        environ = Environ.MockEnviron().getEnvironForRequest(req, "POST")
        app = MockApplication(res)

        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, mockMiddlewareConfig())
        middleware.metrics_core = metrics

        next(middleware(environ, app.mockStartResponse))

        assert metrics.req.data == req
        assert metrics.req.method == "POST"
        assert metrics.res.body == res

    def test_non_empty_post_request(self):
        req = b"{abc: 123}"
        res = "{ responseObject: 'value' }"
        environ = Environ.MockEnviron().getEnvironForRequest(req, "POST")
        app = MockApplication(res)

        metrics = MetricsCoreMock()
        middleware = MetricsMiddleware(app, mockMiddlewareConfig())
        middleware.metrics_core = metrics

        next(middleware(environ, app.mockStartResponse))

        assert metrics.req.data == req
        assert metrics.req.method == "POST"
        assert metrics.res.body == res

    @pytest.mark.skip(reason="@todo")
    def test_multiple_requests(self):
        # Test if multiple requests got through and processed
        # check by using the length of the request queue and loop by calling the
        # middleware for that length
        # Test multiple requests but some of it has garbage data(?)
        pass

    @pytest.mark.skip(reason="@todo")
    def test_closed(self):
        # Test if iterable got closed properly
        pass

    # Other tests that I think can be tested, but unsure if this should be tested in
    # this section
    @pytest.mark.skip(reason="@todo")
    def test_headers(self):
        # Test to verify if the response header is passed correctly
        pass

    @pytest.mark.skip(reason="@todo")
    def test_status(self):
        # Test to verify if the response status is passed correctly
        pass
