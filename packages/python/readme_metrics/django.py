from datetime import datetime
import time

from django.conf import settings
from asgiref.sync import iscoroutinefunction, markcoroutinefunction

from readme_metrics.Metrics import Metrics
from readme_metrics.ResponseInfoWrapper import ResponseInfoWrapper
from readme_metrics import MetricsApiConfig


class MetricsMiddleware:
    async_capable = True
    sync_capable = True

    def __init__(self, get_response, config=None):
        self.get_response = get_response
        self.config = config or settings.README_METRICS_CONFIG
        assert isinstance(self.config, MetricsApiConfig)
        self.metrics_core = Metrics(self.config)
        if iscoroutinefunction(self.get_response):
            markcoroutinefunction(self)

    def __call__(self, request):
        if iscoroutinefunction(self.get_response):
            return self.async_process(request)
        return self.sync_process(request)

    def preamble(self, request):
        try:
            request.rm_start_dt = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
            request.rm_start_ts = int(time.time() * 1000)
            if request.headers.get("Content-Length") or request.body:
                request.rm_content_length = request.headers.get("Content-Length") or "0"
                request.rm_body = request.body or ""
        except Exception as e:
            # Errors in the Metrics SDK should never cause the application to
            # throw an error. Log it but don't re-raise.
            self.config.LOGGER.exception(e)

    def process_response(self, request, response):
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

    def sync_process(self, request):
        if request.method == "OPTIONS":
            return self.get_response(request)
        self.preamble(request)
        response = self.get_response(request)
        self.process_response(request, response)
        return response

    async def async_process(self, request):
        if request.method == "OPTIONS":
            return await self.get_response(request)
        self.preamble(request)
        response = await self.get_response(request)
        self.process_response(request, response)
        return response
