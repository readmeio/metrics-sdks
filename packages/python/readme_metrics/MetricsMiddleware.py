from readme_metrics.Metrics import Metrics
from readme_metrics.MetricsApiConfig import MetricsApiConfig
from readme_metrics.ResponseInfoWrapper import ResponseInfoWrapper
from werkzeug import Request, Response
import io
import time
import datetime


class MetricsMiddleware:
    """
    Core middleware class for ReadMe Metrics

    ...
    Attributes
    ----------
    config : MetricsApiConfig
        contains the configuration settings for the running middleware instance
    """
    def __init__(
            self,
            wsgi_app_reference,
            config: MetricsApiConfig):
        """
        Constructs and initializes MetricsMiddleware WSGI middleware to be passed into the
        currently running WSGI web server.

        :param wsgi_app_reference: Reference to the current WSGI application, which will be wrapped
        :param config: Instance of MetricsApiConfig object
        """

        self.config = config
        self.app = wsgi_app_reference
        self.metrics_core = Metrics(config)

    def __call__(self, environ, start_response):
        """
        Method that is called by the running WSGI server.
        You should NOT be calling this method yourself under
        normal circumstances.
        """
        response_headers = {}
        response_status = 0
        iterable = None
        req = Request(environ)

        def _start_response(_status, _response_headers, *args):
            write = start_response(_status, _response_headers, *args)

            # Populate response info (headers & status)
            nonlocal response_headers, response_status

            response_headers = _response_headers
            response_status = _status

            return write

        try:

            req.rm_start_dt = str(datetime.datetime.now())
            req.rm_start_ts = int(time.time() * 1000)

            if req.method == 'POST':

                # The next 4 lines are a workaround for a serious shortcoming in the WSGI spec.
                # The data can only be read once, after which the socket is exhausted and cannot be read again.
                # As such, we read the data and then repopulate the variable so that it can be used by other
                # code down the pipeline.
                # For more info: https://stackoverflow.com/a/13106009/643951

                content_length = int(environ['CONTENT_LENGTH'])
                content_body = environ['wsgi.input'].read(content_length)

                environ['wsgi.input'].close()
                environ['wsgi.input'] = io.BytesIO(content_body)

                req.rm_content_length = content_length
                req.rm_body = content_body

            iterable = self.app(environ, _start_response)

            for data in iterable:
                res_ctype = ''
                res_clength = 0

                htype = next((h for h in response_headers if h[0] == 'Content-Type'), None)
                hlength = next((h for h in response_headers if h[0] == 'Content-Length'), None)

                if htype and hlength:
                    res_ctype = htype[1]
                    res_clength = int(hlength[1])

                # Populate response body
                res = ResponseInfoWrapper(response_headers, response_status, res_ctype, res_clength, data.decode('utf-8'))

                # Send off data to be queued (and processed) by ReadMe
                self.metrics_core.process(req, res)

                yield data

        finally:
            # Undocumented in WSGI spec but the iterable has to be closed
            if hasattr(iterable, 'close'):
                iterable.close()
