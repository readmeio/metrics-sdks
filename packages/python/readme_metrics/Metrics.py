import queue
import threading
import requests
import json
import importlib

from werkzeug import Request

from readme_metrics import MetricsApiConfig
from readme_metrics.publisher import publish_batch
from readme_metrics.PayloadBuilder import PayloadBuilder
from readme_metrics.ResponseInfoWrapper import ResponseInfoWrapper


class Metrics:
    """
    This is the internal central controller class invoked by the ReadMe middleware. It
    queues requests for submission. The submission is processed by readme_metrics.publisher.publish_batch().
    """

    PACKAGE_NAME: str = "readme/metrics"

    def __init__(self, config: MetricsApiConfig):
        """
        Constructs and initializes the ReadMe Metrics controller class with the
        specified configuration.

        Args:
            config (MetricsApiConfig): Running configuration
        """

        self.config = config
        self.payload_builder = PayloadBuilder(
            config.DENYLIST,
            config.ALLOWLIST,
            config.IS_DEVELOPMENT_MODE,
            config.GROUPING_FUNCTION,
        )
        self.queue = queue.Queue()

    def process(self, request: Request, response: ResponseInfoWrapper) -> None:
        """Enqueues a request/response combination to be submitted the API.

        Args:
            request (Request): Request object
            response (ResponseInfoWrapper): Response object
        """
        self.queue.put(self.payload_builder(request, response))
        if self.queue.qsize() >= self.config.BUFFER_LENGTH:
            args = (self.config, self.queue)
            if self.config.IS_BACKGROUND_MODE:
                thread = threading.Thread(target=publish_batch, daemon=True, args=args)
                thread.start()
            else:
                publish_batch(*args)
