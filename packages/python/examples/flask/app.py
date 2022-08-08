import os
import sys
from flask import Flask
from readme_metrics import MetricsApiConfig
from readme_metrics.flask_readme import ReadMeMetrics

if os.getenv("README_API_KEY") is None:
    sys.stderr.write("Missing `README_API_KEY` environment variable")
    sys.stderr.flush()
    os._exit(1)

app = Flask(__name__)


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


metrics_extension = ReadMeMetrics(
    MetricsApiConfig(
        api_key=os.getenv("README_API_KEY"),
        grouping_function=grouping_function,
        buffer_length=1,
    )
)
metrics_extension.init_app(app)


@app.route("/")
def hello_world():
    return (
        {"message": "hello world"},
        200,
        {"Content-Type": "application/json; charset=utf-8"},
    )


if __name__ == "__main__":
    app.run(debug=False, host="127.0.0.1", port=os.getenv("PORT", "4000"))
