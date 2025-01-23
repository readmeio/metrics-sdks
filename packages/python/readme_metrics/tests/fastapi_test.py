from datetime import datetime, timedelta
import time
from unittest.mock import Mock, AsyncMock
import pytest
from fastapi import Response

from readme_metrics import MetricsApiConfig
from readme_metrics.ResponseInfoWrapper import ResponseInfoWrapper
from readme_metrics.fastapi import ReadMeMetricsMiddleware

mock_config = MetricsApiConfig(
    "README_API_KEY",
    lambda req: {"id": "123", "label": "testuser", "email": "user@email.com"},
    buffer_length=1000,
)


class TestFastAPIMiddleware:
    def setup_middleware(self, is_async=False):
        app = AsyncMock if is_async else Mock()

        middleware = ReadMeMetricsMiddleware(app, config=mock_config)
        middleware.metrics_core = Mock()
        return middleware

    def validate_metrics(self, middleware, request):
        assert hasattr(request, "rm_start_dt")
        req_start_dt = datetime.strptime(request.rm_start_dt, "%Y-%m-%dT%H:%M:%SZ")
        current_dt = datetime.utcnow()
        assert abs(current_dt - req_start_dt) < timedelta(seconds=1)

        assert hasattr(request, "rm_start_ts")
        req_start_millis = request.rm_start_ts
        current_millis = time.time() * 1000.0
        assert abs(current_millis - req_start_millis) < 1000.00

        middleware.metrics_core.process.assert_called_once()
        call_args = middleware.metrics_core.process.call_args
        assert len(call_args[0]) == 2
        assert call_args[0][0] == request
        assert isinstance(call_args[0][1], ResponseInfoWrapper)
        assert call_args[0][1].headers.get("x-header") == "X Value!"
        assert (
            getattr(request, "rm_content_length") == request.headers["Content-Length"]
        )

    @pytest.mark.asyncio
    async def test(self):
        middleware = self.setup_middleware()

        request = Mock()
        request.headers = {"Content-Length": "123"}

        call_next = AsyncMock()
        call_next.return_value = Response(content="", headers={"X-Header": "X Value!"})

        await middleware.dispatch(request, call_next)

        self.validate_metrics(middleware, request)

    @pytest.mark.asyncio
    async def test_missing_content_length(self):
        middleware = self.setup_middleware()

        request = AsyncMock()
        request.headers = {}

        call_next = AsyncMock()
        call_next.return_value = Response(content="")

        await middleware.dispatch(request, call_next)

        assert getattr(request, "rm_content_length") == "0"

    @pytest.mark.asyncio
    async def test_options_request(self):
        middleware = self.setup_middleware()

        request = AsyncMock()
        request.method = "OPTIONS"

        call_next = AsyncMock()

        await middleware.dispatch(request, call_next)

        assert not middleware.metrics_core.process.called
