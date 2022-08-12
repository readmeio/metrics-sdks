import os
import importlib
import json

from queue import Empty
from urllib.parse import urljoin

import requests


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

        version = importlib.import_module(__package__).__version__
        url = urljoin(os.getenv("METRICS_SERVER", config.METRICS_API), "/v1/request")

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
        if not readme_result.ok:
            config.LOGGER.exception(readme_result.text)
            raise Exception(f"POST to {url} returned {readme_result.status_code}")
    except Exception as e:
        # Errors in the Metrics SDK should never cause the application to
        # throw an error. Log it but don't re-raise.
        config.LOGGER.exception(e)
    finally:
        for _ in result_list:
            queue.task_done()
