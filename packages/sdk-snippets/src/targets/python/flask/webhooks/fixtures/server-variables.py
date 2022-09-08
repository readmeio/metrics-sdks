import os
import sys
from flask import Flask, request
from readme_metrics.VerifyWebhook import VerifyWebhook

if os.getenv("README_API_KEY") is None:
    sys.stderr.write("Missing `README_API_KEY` environment variable")
    sys.stderr.flush()
    sys.exit(1)

app = Flask(__name__)

# Your ReadMe secret
secret = "my-readme-secret"


@app.post("/webhook")
def webhook():
    # Verify the request is legitimate and came from ReadMe.
    signature = request.headers.get("readme-signature", None)

    try:
        VerifyWebhook(request.get_json(), signature, secret)
    except Exception as error:
        return (
            {"error": str(error)},
            401,
            {"Content-Type": "application/json; charset=utf-8"},
        )

    # Fetch the user from the database and return their data for use with OpenAPI variables.
    # user = User.objects.get(email__exact=request.values.get("email"))
    return (
        {
            # OAS Server variables
            "name": "default-name",
            "port": "",
        },
        200,
        {"Content-Type": "application/json; charset=utf-8"},
    )


if __name__ == "__main__":
    app.run(debug=False, host="127.0.0.1", port=os.getenv("PORT", "8000"))
