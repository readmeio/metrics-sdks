from datetime import datetime
import time

from flask import Flask, request

from readme_metrics import MetricsApiConfig
from readme_metrics.Metrics import Metrics
from readme_metrics.ResponseInfoWrapper import ResponseInfoWrapper


# Guidelines for Flask extensions are available at:
#     https://flask.palletsprojects.com/en/2.0.x/extensiondev/


class ReadMeMetrics:
    def __init__(self, config: MetricsApiConfig, app: Flask = None):
        self.config = config
        self.metrics_core = Metrics(config)
        if app is not None:
            self.init_app(app)

    def init_app(self, app: Flask):
        self.config.LOGGER.info(
            f"Configuring {app.name} hooks to call ReadMeMetrics extension functions"
        )
        app.before_request(self.before_request)
        app.after_request(self.after_request)

    def before_request(self):
        try:
            request.rm_start_dt = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
            request.rm_start_ts = int(time.time() * 1000)
            if "Content-Length" in request.headers or request.data:
                request.rm_content_length = request.headers["Content-Length"] or "0"
                request.rm_body = request.data or ""
        except Exception as e:
            # Errors in the Metrics SDK should never cause the application to
            # throw an error. Log it but don't re-raise.
            self.config.LOGGER.exception(e)

    def after_request(self, response):
        try:
            response_info = ResponseInfoWrapper(
                response.headers,
                response.status,
                content_type=None,
                content_length=None,
                body=response.data,
            )
            self.metrics_core.process(request, response_info)
        except Exception as e:
            # Errors in the Metrics SDK should never cause the application to
            # throw an error. Log it but don't re-raise.
            self.config.LOGGER.exception(e)

        return response
