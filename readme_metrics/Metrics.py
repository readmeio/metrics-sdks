import queue
import threading
import requests
import json
import pkg_resources

from werkzeug import Request

from readme_metrics import MetricsApiConfig, ResponseInfoWrapper
from readme_metrics.PayloadBuilder import PayloadBuilder


class Metrics:
    """
    This is the internal central controller classinvoked by the WSGI middleware. It
    handles the creation, queueing, and submission of the requests.
    """

    def __init__(self, config: MetricsApiConfig):
        """
        Constructs and initializes the ReadMe Metrics controller class with the
        specified configuration.

        Args:
            config (MetricsApiConfig): Running configuration
        """

        self.config = config
        self.payload_builder = PayloadBuilder(
            config.BLACKLIST,
            config.WHITELIST,
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
            if self.config.IS_BACKGROUND_MODE:
                threading.Thread(target=self._processAll, daemon=True).start()
            else:
                self._processAll()

    def _processAll(self) -> None:
        result_list = []
        while not self.queue.empty():
            obj = self.queue.get_nowait()
            if obj:
                result_list.append(obj)

        payload = json.dumps(result_list)

        version = pkg_resources.require("readme_metrics")[0].version

        readme_result = requests.post(
            self.METRICS_API + "/request",
            auth=(self.config.README_API_KEY, ""),
            data=payload,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "readme-metrics-python@" + version,
            },
        )
