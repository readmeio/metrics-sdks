from datetime import datetime
import time

from django.conf import settings

from readme_metrics.Metrics import Metrics
from readme_metrics.ResponseInfoWrapper import ResponseInfoWrapper
from readme_metrics import MetricsApiConfig


class MetricsMiddleware:
    def __init__(self, get_response, config=None):
        self.get_response = get_response
        self.config = config or settings.README_METRICS_CONFIG
        assert isinstance(self.config, MetricsApiConfig)
        self.metrics_core = Metrics(self.config)

    def __call__(self, request):
        try:
            request.rm_start_dt = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
            request.rm_start_ts = int(time.time() * 1000)
            if request.headers["Content-Length"] or request.body:
                request.rm_content_length = request.headers["Content-Length"] or "0"
                request.rm_body = request.body or ""
        except Exception as e:
            # Errors in the Metrics SDK should never cause the application to
            # throw an error. Log it but don't re-raise.
            self.config.LOGGER.exception(e)

        response = self.get_response(request)

        try:
            try:
                body = response.content.decode("utf-8")
            except UnicodeDecodeError:
                body = "[NOT VALID UTF-8]"
            response_info = ResponseInfoWrapper(
                response.headers,
                response.status_code,
                content_type=None,
                content_length=None,
                body=body,
            )
            self.metrics_core.process(request, response_info)
        except Exception as e:
            # Errors in the Metrics SDK should never cause the application to
            # throw an error. Log it but don't re-raise.
            self.config.LOGGER.exception(e)

        return response
