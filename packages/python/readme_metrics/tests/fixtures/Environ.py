import json
import io
import os

from werkzeug import wsgi


class MockEnviron:
    def __init__(self):
        with open(
            "./readme_metrics/tests/fixtures/environ_get.json"
        ) as json_file:
            self.environGetData = json.load(json_file)

        with open(
            "./readme_metrics/tests/fixtures/environ_post.json"
        ) as json_file:
            self.environPostData = json.load(json_file)

    def getEnvironForRequest(self, jsonByteString, httpRequestMethod):
        environ = self.environGetData
        if httpRequestMethod == "POST":
            environ = self.environPostData
        elif httpRequestMethod == "GET":
            environ = self.environGetData

        contentLength = len(jsonByteString)
        stream = io.BytesIO(jsonByteString)
        environ["wsgi.input"] = wsgi.LimitedStream(stream, contentLength)
        environ["CONTENT_LENGTH"] = contentLength
        return environ
