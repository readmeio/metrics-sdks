import os
import sys

from fastapi import FastAPI
from readme_metrics import MetricsApiConfig
from readme_metrics.fastapi import ReadMeMetricsMiddleware


if os.getenv("README_API_KEY") is None:
    sys.stderr.write("Missing `README_API_KEY` environment variable")
    sys.stderr.flush()
    sys.exit(1)

app = FastAPI()


# pylint: disable=W0613
def grouping_function(request):
    return {
        # User's API Key
        "api_key": "owlbert-api-key",
        # Username to show in the dashboard
        "label": "Owlbert",
        # User's email address
        "email": "owlbert@example.com",
    }


config = MetricsApiConfig(
    api_key=os.getenv("README_API_KEY"),
    grouping_function=grouping_function,
    background_worker_mode=False,
    buffer_length=1,
    timeout=5,
)

# Add middleware with configuration using a lambda
app.add_middleware(ReadMeMetricsMiddleware, config=config)


@app.get("/")
def read_root():
    return {"message": "hello world"}


@app.post("/")
def post_root():
    return "13414"
