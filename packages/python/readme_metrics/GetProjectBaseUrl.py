import requests, base64

from functools import lru_cache
from urllib.parse import urljoin


def auth(readme_api_key: str):
    encodedAuth = base64.b64encode(f"{readme_api_key}:")
    return {"Authorization": "Basic %s" % encodedAuth}


@lru_cache(maxsize=None)
def get_project_base_url(readme_api_url: str, readme_api_key: str):

    url = urljoin(readme_api_url, "/v1")
    headers = auth(readme_api_key)

    try:
        response = requests.get(url, headers=headers, timeout=1)
        response.raise_for_status()
        return response.baseUrl
    except:
        return ""

