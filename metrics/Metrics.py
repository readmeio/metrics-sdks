import queue
import threading
import requests
import json
from pprint import pprint

from werkzeug import Request
from pip._vendor.requests import __version__

from metrics import MetricsApiConfig, ResponseInfoWrapper
from metrics.PayloadBuilder import PayloadBuilder


class Metrics:
    """
    This is the internal central controller class invoked by the WSGI middleware. It handles the creation, queueing,
    and submission of the requests.
    """
    PACKAGE_NAME: str = 'readme/metrics'
    METRICS_API: str = 'https://metrics.readme.io'

    def __init__(self, config: MetricsApiConfig):
        """
        Constructs and initializes the ReadMe Metrics controller class with the specified configuration.
        :param config: Running configuration
        """

        self.config = config
        self.payload_builder = PayloadBuilder(config.BLACKLIST, config.WHITELIST, config.IS_DEVELOPMENT_MODE, config.GROUPING_FUNCTION)
        self.queue = queue.Queue()

    def process(self, request: Request, response: ResponseInfoWrapper) -> None:
        """
        Enqueues a request/response combination to be submitted to the ReadMe Metrics API.
        :param request: werkzeug.Request request object
        :param response: ResponseInfoWrapper response object
        """
        self.queue.put(self.payload_builder(request, response))

        if(self.queue.qsize() >= self.config.BUFFER_LENGTH):
            if(self.config.IS_BACKGROUND_MODE):
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

        # print("Posting: " + payload)

        readme_result = requests.post(self.METRICS_API + "/request", auth=(self.config.README_API_KEY, ""), data = payload, headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'readme-metrics-' + __version__
        })

        # print("Response: " + readme_result.text)
