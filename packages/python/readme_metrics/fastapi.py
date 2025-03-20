from datetime import datetime
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from readme_metrics import MetricsApiConfig
from readme_metrics.Metrics import Metrics
from readme_metrics.ResponseInfoWrapper import ResponseInfoWrapper


class ReadMeMetricsMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, config: MetricsApiConfig):
        super().__init__(app)
        self.config = config
        self.metrics_core = Metrics(config)

    async def _safe_retrieve_body(self, request):
        # Safely retrieve the request body.
        try:
            body = await request.body()
            return body
        except Exception as e:
            self.config.LOGGER.exception(e)
            return None

    async def _read_response_body(self, response):
        # Reads and decodes the response body.
        try:
            body_chunks = []
            async for chunk in response.body_iterator:
                body_chunks.append(chunk)
            response.body_iterator = iter(body_chunks)
            encoded_body = b"".join(body_chunks)

            try:
                return encoded_body.decode("utf-8")
            except UnicodeDecodeError:
                return "[NOT VALID UTF-8]"
        except Exception as e:
            self.config.LOGGER.exception(e)
            return ""

    async def preamble(self, request):
        # Initialize metrics-related attributes on the request object.
        try:
            request.rm_start_dt = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
            request.rm_start_ts = int(time.time() * 1000)

            content_length = request.headers.get("Content-Length")
            body = await self._safe_retrieve_body(request)

            if content_length or body:
                request.rm_content_length = content_length or "0"
                request.rm_body = body or ""
        except Exception as e:
            self.config.LOGGER.exception(e)

    async def dispatch(self, request: Request, call_next):
        if (
            request.method == "OPTIONS"
            or self.config.GROUPING_FUNCTION(request) is None
        ):
            return await call_next(request)

        await self.preamble(request)

        response = None
        response_body = None
        try:
            response = await call_next(request)
            response_body = await self._read_response_body(response)

            response_info = ResponseInfoWrapper(
                headers=response.headers,
                status=response.status_code,
                content_type=response.headers.get("Content-Type"),
                content_length=response.headers.get("Content-Length"),
                body=response_body,
            )

            self.metrics_core.process(request, response_info)

        except Exception as e:
            self.config.LOGGER.exception(e)
            return await call_next(request)

        return Response(
            content=response_body,
            status_code=response.status_code,
            headers=response.headers,
            media_type=response.media_type,
        )
