import importlib
import logging
import math
from queue import Empty, Queue
import time

import requests


def publish_batch(config, queue):
    result_list = []
    try:
        try:
            while not queue.empty() and len(result_list) < config.batch_size:
                payload = queue.get_nowait()
                result_list.append(payload)
        except Empty:
            pass

        if len(result_list) == 0:
            return

        version = importlib.import_module(__package__).__version__
        url = config.METRICS_API + "/request"
        readme_result = requests.post(
            url,
            auth=(config.README_API_KEY, ""),
            data=result_list,
            headers={
                "Content-Type": "application/json",
                "User-Agent": f"readme-metrics-python@{version}",
            },
            timeout=1,
        )
        config.logger.info(
            f"POST to {url} with {len(result_list)} items returned {readme_result.status_code}"
        )
        if not readme_result.ok:
            config.logger.exception(readme_result.text)
            raise Exception(f"POST to {url} returned {readme_result.status_code}")
    except Exception as e:
        # Errors in the Metrics SDK should never cause the application to
        # throw an error. Log it but don't re-raise.
        config.logger.exception(e)
    finally:
        for _ in result_list:
            queue.task_done()
