from functools import lru_cache
from logging import Logger
from typing import Dict, Callable
from urllib.parse import urljoin

import base64
import requests


def auth(readme_api_key: str) -> Dict[str, str]:
    encodedAuth = base64.b64encode(f"{readme_api_key}:".encode("utf8")).decode("utf8")
    return {"Authorization": f"Basic {encodedAuth}"}


def build_project_base_url_f(
    readme_api_url: str, timeout: int, logger: Logger
) -> Callable[[str], str]:
    """returns a function that takes an API key and returns the baseUrl for
    that key"""

    @lru_cache(maxsize=512)
    def _build_project_base_url_f(readme_api_key):
        try:
            response = requests.get(
                urljoin(readme_api_url, "/v1"),
                headers=auth(readme_api_key),
                timeout=timeout,
            )
            response.raise_for_status()
            return response.json()["baseUrl"]
        except Exception as e:
            logger.debug(e)
            return ""

    return _build_project_base_url_f
