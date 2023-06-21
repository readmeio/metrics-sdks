import os
import importlib
import json
import time

from queue import Empty
from urllib.parse import urljoin

import requests


# when we need to backoff HTTP requests, pause for this many seconds
BACKOFF_SECONDS = 15

backoff_expires_at = None


class HTTPError(Exception):
    pass


def start_backoff():
    global backoff_expires_at  # pylint: disable=global-statement
    # Backoff for a few seconds, but not if another concurrent request has
    # already triggered a backoff
    if backoff_expires_at is None:
        backoff_expires_at = time.time() + BACKOFF_SECONDS


def clear_backoff():
    global backoff_expires_at  # pylint: disable=global-statement
    backoff_expires_at = None


def should_backoff(response):
    # Some HTTP error codes indicate a problem with the API key, like the key is
    # invalid or it's being rate limited. To avoid pointless requests to the
    # ReadMe server, pause outgoing requests for a few seconds before trying
    # again. Logs will be silently discarded while requests are paused, which is
    # acceptable since the server wouldn't accept them anyway.
    backoff_codes = [
        401,  # Unauthorized, i.e. this API key is invalid
        403,  # Forbidden, i.e. this API key is blocked by the server
        429,  # Too Many Requests, i.e. this API key is currently being rate limited
        500,  # Internal Server Error; give the ReadMe server a chance to recover
        503,  # Service Unavailable; same thing
    ]
    return response.status_code in backoff_codes


def publish_batch(config, queue):
    result_list = []
    try:
        try:
            while not queue.empty() and len(result_list) < config.BUFFER_LENGTH:
                payload = queue.get_nowait()
                result_list.append(payload)
        except Empty:
            pass

        if len(result_list) == 0:
            return

        if backoff_expires_at is not None:
            if backoff_expires_at > time.time():
                config.LOGGER.info(
                    "Publishing to ReadMe is temporarily paused; "
                    + f"skipping {len(result_list)} request(s)"
                )
                return
            # After the backoff expires, erase the old expiration time
            clear_backoff()

        version = importlib.import_module(__package__).__version__
        url = urljoin(
            os.getenv("README_METRICS_SERVER", config.METRICS_API), "/v1/request"
        )

        readme_result = requests.post(
            url,
            auth=(config.README_API_KEY, ""),
            data=json.dumps(result_list),
            headers={
                "Content-Type": "application/json",
                "User-Agent": f"readme-metrics-python@{version}",
            },
            timeout=config.METRICS_API_TIMEOUT,
        )
        config.LOGGER.info(
            f"POST to {url} with {len(result_list)} items returned {readme_result.status_code}"
        )

        if should_backoff(readme_result) and backoff_expires_at is None:
            config.LOGGER.warning(
                f"ReadMe API returned HTTP status {readme_result.status_code}; "
                + f"pausing publishing for {BACKOFF_SECONDS} seconds"
            )
            start_backoff()

        if not readme_result.ok:
            config.LOGGER.exception(readme_result.text)
            raise HTTPError(f"POST to {url} returned {readme_result.status_code}")
    except Exception as e:
        # Errors in the Metrics SDK should never cause the application to
        # throw an error. Log it but don't re-raise.
        config.LOGGER.exception(e)
    finally:
        for _ in result_list:
            queue.task_done()
