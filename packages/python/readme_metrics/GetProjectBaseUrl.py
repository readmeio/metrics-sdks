import requests, base64

from functools import lru_cache


def auth(readme_api_key: str):
    encodedAuth = base64.b64encode("%s:" % readme_api_key)
    return {"Authorization": "Basic %s" % encodedAuth}


@lru_cache(maxsize = 512)
def get_project_base_url(readme_api_url: str, readme_api_key: str):
    url = "%s/v1" % readme_api_url
    headers = auth(readme_api_key)

    project = requests.get(url, headers=headers).json()
    return project.baseUrl

