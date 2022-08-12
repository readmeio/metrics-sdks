from datetime import datetime, timedelta
import time
from unittest.mock import Mock

from readme_metrics import MetricsApiConfig
from readme_metrics.django import MetricsMiddleware
from readme_metrics.ResponseInfoWrapper import ResponseInfoWrapper


mock_config = MetricsApiConfig(
    "README_API_KEY",
    lambda req: {"id": "123", "label": "testuser", "email": "user@email.com"},
    buffer_length=1000,
)


class TestDjangoMiddleware:
    def test(self):
        response = Mock()
        response.headers = {"X-Header": "X Value!"}
        get_response = Mock(return_value=response)

        middleware = MetricsMiddleware(get_response, config=mock_config)
        assert middleware.get_response == get_response
        middleware.metrics_core = Mock()

        # the middleware should call get_response(request)
        request = Mock()
        middleware(request)
        get_response.assert_called_once_with(request)

        # the middleware should set request.rm_start_dt to roughly the current
        # datetime
        assert hasattr(request, "rm_start_dt")
        req_start_dt = datetime.strptime(request.rm_start_dt, "%Y-%m-%d %H:%M:%S.%f")
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
