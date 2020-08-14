class ResponseInfoWrapper:
    """
    Internal data class used by the middleware to wrap a call's response information

    ...
    Attributes
    ----------
    headers: dict
        Dictionary containing the headers that will be sent back to the client with this response
    status: int
        HTTP status code that will be sent back with this response
    content_type: str
        Content type header that will be sent back with this response
    content_length: int
        Content-Length header that will be sent back with this response
    body: str
        Body of the response that will be sent
    """
    def __init__(self, headers: dict, status: int, content_type: str, content_length: int, body: str):
        headers = dict(headers)
        self.headers = headers
        self.status = status
        self.content_type = content_type or ''
        self.content_length = content_length or 0
        self.body = body or ''

        if content_type is None and 'Content-Type' in headers:
            self.content_type = headers['Content-Type']

        if content_length is None and 'Content-Length' in headers:
            self.content_length = headers['Content-Length']