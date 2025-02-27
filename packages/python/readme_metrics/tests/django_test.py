from datetime import datetime, timedelta
import time
from unittest.mock import Mock, AsyncMock

from readme_metrics import MetricsApiConfig
from readme_metrics.django import MetricsMiddleware
from readme_metrics.ResponseInfoWrapper import ResponseInfoWrapper


mock_config = MetricsApiConfig(
    "README_API_KEY",
    lambda req: {"id": "123", "label": "testuser", "email": "user@email.com"},
    buffer_length=1000,
)


class TestDjangoMiddleware:
    def setup_middleware(self, is_async=False):
        response = AsyncMock() if is_async else Mock()
        response.headers = {"X-Header": "X Value!"}
        get_response = (
            AsyncMock(return_value=response)
            if is_async
            else Mock(return_value=response)
        )

        middleware = MetricsMiddleware(get_response, config=mock_config)
        middleware.metrics_core = Mock()
        return middleware

    def validate_metrics(self, middleware, request, is_async=False):
        if is_async:
            # the middleware should await get_response(request)
            middleware.get_response.assert_awaited_once_with(request)
        else:
            # the middleware should call get_response(request)
            middleware.get_response.assert_called_once_with(request)

        # the middleware should set request.rm_start_dt to roughly the current
        # datetime
        assert hasattr(request, "rm_start_dt")
        req_start_dt = datetime.strptime(request.rm_start_dt, "%Y-%m-%dT%H:%M:%SZ")
        current_dt = datetime.utcnow()
        assert abs(current_dt - req_start_dt) < timedelta(seconds=1)

        # the middleware should set request.rm_start_ts to roughly the current
        # unix timestamp, in milliseconds
        assert hasattr(request, "rm_start_ts")
        req_start_millis = request.rm_start_ts
        current_millis = time.time() * 1000.0
        assert abs(current_millis - req_start_millis) < 1000.00

        # ensure that the middleware called metrics_core.process() with the
        # current request, and a ResponseInfoWrapper with properties matching
        # the current response
        middleware.metrics_core.process.assert_called_once()
        call_args = middleware.metrics_core.process.call_args
        assert len(call_args[0]) == 2
        assert call_args[0][0] == request
        assert isinstance(call_args[0][1], ResponseInfoWrapper)
        assert call_args[0][1].headers.get("X-Header") == "X Value!"
        assert (
            getattr(request, "rm_content_length") == request.headers["Content-Length"]
        )

    def test_sync(self):
        middleware = self.setup_middleware()

        request = Mock()
        request.headers = {"Content-Length": "123"}
        middleware(request)

        self.validate_metrics(middleware, request)

    async def test_async(self):
        middleware = self.setup_middleware(is_async=True)

        request = AsyncMock()
        request.headers = {"Content-Length": "123"}
        await middleware(request)

        self.validate_metrics(middleware, request, is_async=True)

    def test_missing_content_length(self):
        middleware = MetricsMiddleware(Mock(), config=mock_config)
        request = Mock()
        request.headers = {}
        middleware(request)
        assert getattr(request, "rm_content_length") == "0"

    def test_options_request(self):
        middleware = MetricsMiddleware(Mock(), config=mock_config)
        middleware.metrics_core = Mock()
        request = Mock()
        request.method = "OPTIONS"
        middleware(request)
        assert not middleware.metrics_core.process.called
