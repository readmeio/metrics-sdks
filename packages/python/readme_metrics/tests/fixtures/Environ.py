import io
import json

from werkzeug import wsgi


class MockEnviron:
    def __init__(self):
        with open(
            "./readme_metrics/tests/fixtures/environ_get.json", encoding="utf-8"
        ) as json_file:
            self.environGetData = json.load(json_file)

        with open(
            "./readme_metrics/tests/fixtures/environ_post.json", encoding="utf-8"
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
        environ["CONTENT_LENGTH"] = str(contentLength)
        environ["HTTP_AUTHORIZATION"] = "Bearer: a-random-api-key"
        return environ
