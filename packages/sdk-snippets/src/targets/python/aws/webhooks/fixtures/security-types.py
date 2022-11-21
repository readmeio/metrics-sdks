import json

import boto3
from readme_metrics.VerifyWebhook import VerifyWebhook

# Your ReadMe secret as a bytes object; you may want to store this in AWS Secrets Manager
README_SECRET = b"my-readme-secret"


def handler(event, lambda_context):
    status_code = None
    email = None
    api_key = None
    error = None

    try:
        signature = event.get("headers", {}).get("ReadMe-Signature")
        body = json.loads(event.get("body", "{}"))
        VerifyWebhook(body, signature, README_SECRET)

        email = body.get("email")
        client = boto3.client("apigateway")
        keys = client.get_api_keys(nameQuery=email, includeValues=True)
        if len(keys.get("items", [])) > 0:
            # if multiple API keys are returned for the given email, use the first one
            api_key = keys["items"][0]["value"]
            status_code = 200
        else:
            error = "Email not found"
            status_code = 404
    except Exception as e:
        error = str(e)
        if error.find("Signature") > -1:
            status_code = 401
        else:
            status_code = 500

    if status_code == 200:
        body = {
            # OAS Security variables
            "api_key": api_key,
            "http_basic": { "user": email, "pass": api_key },
            "http_bearer": api_key,
            "oauth2": api_key,
        }
    else:
        body = {"message": error}

    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }