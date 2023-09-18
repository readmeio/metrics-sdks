import requests, base64
from typing import Dict

from functools import lru_cache
from urllib.parse import urljoin


def auth(readme_api_key: str) -> Dict[str, str]:
    encodedAuth = base64.b64encode(f"{readme_api_key}:".encode("utf8")).decode("utf8")
    return {"Authorization": f"Basic {encodedAuth}"}


@lru_cache(maxsize=None)
def get_project_base_url(readme_api_url: str, readme_api_key: str) -> str:
    """returns the baseUrl for the current API key"""
    response = requests.get(
        urljoin(readme_api_url, "/v1"), headers=auth(readme_api_key), timeout=1
    )
    response.raise_for_status()
    return response.json()["baseUrl"]
