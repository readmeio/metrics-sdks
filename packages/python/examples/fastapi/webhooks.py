import os
import sys

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from readme_metrics.VerifyWebhook import VerifyWebhook


if os.getenv("README_API_KEY") is None:
    sys.stderr.write("Missing `README_API_KEY` environment variable")
    sys.stderr.flush()
    sys.exit(1)

app = FastAPI()

# Your ReadMe secret
secret = os.getenv("README_API_KEY")


@app.post("/webhook")
async def webhook(request: Request):
    # Verify the request is legitimate and came from ReadMe.
    signature = request.headers.get("readme-signature", None)

    try:
        body = await request.json()
        VerifyWebhook(body, signature, secret)
    except Exception as error:
        return JSONResponse(
            status_code=401,
            headers={"Content-Type": "application/json; charset=utf-8"},
            content={"error": str(error)},
        )

    # Fetch the user from the database and return their data for use with OpenAPI variables.
    # user = User.objects.get(email__exact=request.values.get("email"))
    return JSONResponse(
        status_code=200,
        headers={"Content-Type": "application/json; charset=utf-8"},
        content={
            "petstore_auth": "default-key",
            "basic_auth": {"user": "user", "pass": "pass"},
        },
    )
