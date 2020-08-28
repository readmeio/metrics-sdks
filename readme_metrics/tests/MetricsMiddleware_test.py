import pytest
import requests
import json

from readme_metrics import MetricsApiConfig
from readme_metrics import MetricsMiddleware


# for this, I'm not exactly sure how to test the __call__ function
# possible options I considered was making a mock server inside this test case
# connected to the middleware somehow
class MockServer:
    def __init__(self):
        # Not working when I tried the first time, but might as well write it
        # self.app = Flask(__name__)
        # self.app.wsgi_app = MetricsMiddleware(#config details)
        pass

    # I think requests package shouldn't be used cos we cant get the request body so
    # I'm using it as placeholder
    def doGET(self, url, params):
        return requests.get(url, params)

    def doPOST(self, url, data):
        return requests.post(url, data=json.dumps(dict(data)))

    def doPUT(self, url, data):
        return requests.put(url, data=json.dumps(dict(data)))

    def mockWSGI(self):
        # create a moch wsgi that can call metrics middleware
        pass

    def sendRequestsAtOnce(self, requestQueue):
        # accumulate the requests and send at once to the mockWSGI
        return requestQueue


class TestMetricsMiddleware:
    def setUp(self):
        self.mockserver = MockServer()

    @pytest.mark.skip(reason="@todo")
    def testNoRequest(self):
        # Test no request (None) but the function is called
        # Test no request ([]) but the function is called
        pass

    @pytest.mark.skip(reason="@todo")
    def testSingleRequest(self):
        # Test if a single request got through and processed
        # Test if a single request is sent but with trash data(?)
        pass

    @pytest.mark.skip(reason="@todo")
    def testMultipleRequests(self):
        # Test if multiple requests got through and processed
        # check by using the length of the request queue and loop by calling the
        # middleware for that length
        # Test multiple requests but some of it has garbage data(?)
        pass

    @pytest.mark.skip(reason="@todo")
    def testClosed(self):
        # Test if iterable got closed properly
        pass

    # Other tests that I think can be tested, but unsure if this should be tested in
    # this section
    @pytest.mark.skip(reason="@todo")
    def testHeaders(self):
        # Test to verify if the response header is passed correctly
        pass

    @pytest.mark.skip(reason="@todo")
    def testStatus(self):
        # Test to verify if the response status is passed correctly
        pass
