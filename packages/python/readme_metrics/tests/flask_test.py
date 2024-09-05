from datetime import datetime, timedelta
import time
from unittest.mock import Mock

from flask import Flask, request
from readme_metrics import MetricsApiConfig
from readme_metrics.flask_readme import ReadMeMetrics
from readme_metrics.ResponseInfoWrapper import ResponseInfoWrapper


mock_config = MetricsApiConfig(
    "README_API_KEY",
    lambda req: {"id": "123", "label": "testuser", "email": "user@email.com"},
    buffer_length=1000,
)


class TestFlaskExtension:
    def setUp(self):
        pass

    def test_init(self):
        # the extension should register itself with the Flask application
        # provided to the constructor
        app = Mock()
        extension = ReadMeMetrics(config=mock_config, app=app)
        app.before_request.assert_called_with(extension.before_request)
        app.after_request.assert_called_with(extension.after_request)

    def test_before_request(self):
        app = Flask(__name__)
        extension = ReadMeMetrics(config=mock_config, app=app)
        with app.test_request_context("/"):
            extension.before_request()

            # ensure that before_request has set request.rm_start_dt to
            # roughly the current datetime
            assert hasattr(request, "rm_start_dt")
            req_start_dt = datetime.strptime(request.rm_start_dt, "%Y-%m-%dT%H:%M:%SZ")
            current_dt = datetime.utcnow()
            assert abs(current_dt - req_start_dt) < timedelta(seconds=1)

            # ensure that before_request has set request.rm_start_ts to
            # roughly the current unix timestamp, in milliseconds
            assert hasattr(request, "rm_start_ts")
            req_start_millis = request.rm_start_ts
            current_millis = time.time() * 1000.0
            assert abs(current_millis - req_start_millis) < 1000.00

    def test_after_request(self):
        app = Flask(__name__)
        print("hello")
        extension = ReadMeMetrics(config=mock_config, app=app)
        extension.metrics_core = Mock()

        response = Mock()
        response.headers = {"X-Header": "X Value!"}

        # simulate processing the entire request
        with app.test_request_context("/"):
            extension.before_request()
            extension.after_request(response)

        # ensure that we called metrics_core.process() with the current request,
        # and a ResponseInfoWrapper matching the current response
        extension.metrics_core.process.assert_called_once()
        call_args = extension.metrics_core.process.call_args
        assert len(call_args[0]) == 2
        assert call_args[0][0] == request
        assert isinstance(call_args[0][1], ResponseInfoWrapper)
        assert call_args[0][1].headers.get("X-Header") == "X Value!"

    def test_before_request_options(self):
        app = Flask(__name__)
        extension = ReadMeMetrics(config=mock_config, app=app)

        with app.test_request_context("/", method="OPTIONS"):
            extension.before_request()

            assert not hasattr(request, "rm_start_dt")
            assert not hasattr(request, "rm_start_ts")
            assert not hasattr(request, "rm_content_length")
            assert not hasattr(request, "rm_body")
