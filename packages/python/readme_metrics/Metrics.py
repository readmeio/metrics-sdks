import atexit
import math
import queue
import threading

from readme_metrics import MetricsApiConfig
from readme_metrics.publisher import publish_batch
from readme_metrics.PayloadBuilder import PayloadBuilder
from readme_metrics.ResponseInfoWrapper import ResponseInfoWrapper


class Metrics:
    """
    This is the internal central controller class invoked by the ReadMe middleware. It queues
    requests for submission for processing by `readme_metrics.publisher.publish_batch()`.
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
            config.LOGGER,
        )
        self.queue = queue.Queue()

        atexit.register(self.exit_handler)

    def process(self, request, response: ResponseInfoWrapper) -> None:
        """Enqueues a request/response combination to be submitted the API.

        Args:
            request (Request): Request object from your WSGI server
            response (ResponseInfoWrapper): Response object
        """
        if not self.host_allowed(request.environ["HTTP_HOST"]):
            # pylint: disable=C0301
            self.config.LOGGER.debug(
                f"Not enqueueing request, host {request.environ['HTTP_HOST']} not in ALLOWED_HTTP_HOSTS"
            )
            return

        payload = self.payload_builder(request, response)
        if payload is None:
            # PayloadBuilder returns None when the grouping function returns
            # None (an indication that the request should not be logged.)
            self.config.LOGGER.debug(
                "Not enqueueing request, grouping function returned None"
            )
            return

        self.queue.put(payload)
        if self.queue.qsize() >= self.config.BUFFER_LENGTH:
            args = (self.config, self.queue)
            if self.config.IS_BACKGROUND_MODE:
                thread = threading.Thread(target=publish_batch, daemon=True, args=args)
                thread.start()
            else:
                publish_batch(*args)

    def exit_handler(self) -> None:
        if not self.queue.empty():
            args = (self.config, self.queue)
            for _ in range(math.ceil(self.queue.qsize() / self.config.BUFFER_LENGTH)):
                if self.config.IS_BACKGROUND_MODE:
                    thread = threading.Thread(
                        target=publish_batch, daemon=True, args=args
                    )
                    thread.start()
                else:
                    publish_batch(*args)
        self.queue.join()

    def host_allowed(self, host):
        if self.config.ALLOWED_HTTP_HOSTS:
            return host in self.config.ALLOWED_HTTP_HOSTS

        # If `allowed_http_hosts`` has not been set (None by default), send off the data to be
        # queued.
        return True
