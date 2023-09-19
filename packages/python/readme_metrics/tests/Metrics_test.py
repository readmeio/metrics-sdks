import datetime
import json
import time
import types

from werkzeug import Request
from readme_metrics import Metrics
from readme_metrics import MetricsApiConfig
from readme_metrics.ResponseInfoWrapper import ResponseInfoWrapper
from .fixtures import Environ


def mock_request():
    body = json.dumps({"ok": 123, "password": 456}).encode()
    environ = Environ.MockEnviron().getEnvironForRequest(body, "POST")
    req = Request(environ)
    req.rm_start_dt = str(datetime.datetime.utcnow())
    req.rm_start_ts = int(time.time() * 1000)
    req.rm_body = body
    return req


class TestMetrics:
    def test_grouping_function_import(self):
        config = MetricsApiConfig(api_key=123456, grouping_function="json.loads")
        assert isinstance(config.GROUPING_FUNCTION, str)
        metrics = Metrics.Metrics(config)
        assert isinstance(metrics.grouping_function, types.FunctionType)

    def test_base_log_url(self):
        # don't publish batch
        old_publish_batch = Metrics.publish_batch
        Metrics.publish_batch = lambda *_: None

        # configure Metrics
        base_log_url = "https://example.com"
        config = MetricsApiConfig(
            api_key="123456",
            base_log_url=base_log_url,
            grouping_function=lambda *_: {"id": "123456"},
            background_worker_mode=False,
        )
        metrics = Metrics.Metrics(config)

        res = ResponseInfoWrapper({}, 200, "application/json", 2, "{}")
        metrics.process(mock_request(), res)

        assert "x-documentation-url" in res.headers
        assert res.headers["x-documentation-url"].startswith(f"{base_log_url}/logs/")
        assert len(res.headers["x-documentation-url"]) == (
            len(f"{base_log_url}/logs/") + 36
        )

        Metrics.publish_batch = old_publish_batch
