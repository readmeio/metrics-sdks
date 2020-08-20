from setuptools import setup

with open("README.md", "r") as fh:
    long_description = fh.read()

setup(
    name='readme-metrics',
    version='1.0.2',
    author='ReadMe',
    author_email='support@readme.io',
    description='ReadMe API Metrics WSGI SDK',
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/readmeio/metrics-sdks/tree/master/packages/python",
    packages=['readme_metrics'],
    install_requires=['werkzeug', 'requests'],
)
