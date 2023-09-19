from functools import lru_cache
from logging import Logger
from typing import Dict
from urllib.parse import urljoin

import base64
import requests


def auth(readme_api_key: str) -> Dict[str, str]:
    encodedAuth = base64.b64encode(f"{readme_api_key}:".encode("utf8")).decode("utf8")
    return {"Authorization": f"Basic {encodedAuth}"}


@lru_cache(maxsize=None)
def get_project_base_url(
    readme_api_url: str, readme_api_key: str, timeout: int, logger: Logger
) -> str:
    """returns the baseUrl for the current API key"""

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
