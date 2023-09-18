from typing import List, Tuple

import pytest
import requests

from readme_metrics.GetProjectBaseUrl import auth, get_project_base_url


def test_auth():
    tests = [
        ("", "Og=="),
        ("some_api_key", "c29tZV9hcGlfa2V5Og=="),
    ]

    for inp, expected in tests:
        assert auth(inp)["Authorization"] == f"Basic {expected}"


class MockResponse:
    def __init__(self, throw=None):
        self.throw = throw

    @staticmethod
    def json():
        return {
            "name": "ReadMe",
            "subdomain": "abelincoln",
            "jwtSecret": "abcdefghijklmnopqrstuvwxyz",
            "baseUrl": "https://zombo.com",
            "plan": "enterprise",
            "metrics": {"limit": 50000000},
            "token": "token",
        }

    def raise_for_status(self):
        if self.throw:
            raise self.throw("oh no")
        return


@pytest.fixture
def readme_api_v1_success(monkeypatch):
    monkeypatch.setattr(requests, "get", lambda *_, **__: MockResponse())


@pytest.fixture
def readme_api_v1_http_error(monkeypatch):
    monkeypatch.setattr(
        requests, "get", lambda *_, **__: MockResponse(throw=requests.HTTPError)
    )


def test_get_project_base_url(readme_api_v1_success):
    assert get_project_base_url("", "secretkey") == "https://zombo.com"


def test_get_project_base_url_exception(readme_api_v1_http_error):
    try:
        get_project_base_url("", "secretkey")
        assert False
    except:
        return
