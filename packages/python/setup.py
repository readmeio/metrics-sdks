import importlib
from setuptools import setup

with open("README.md", "r") as fh:
    long_description = fh.read()

version = importlib.import_module("readme_metrics").__version__

setup(
    name="readme-metrics",
    version=version,
    author="ReadMe",
    author_email="support@readme.io",
    description="ReadMe API Metrics SDK",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/readmeio/metrics-sdks/tree/main/packages/python",
    packages=["readme_metrics"],
    install_requires=["requests", "Werkzeug"],
    extras_require={"Flask": ["Flask"], "Django": ["Django"]},
)
