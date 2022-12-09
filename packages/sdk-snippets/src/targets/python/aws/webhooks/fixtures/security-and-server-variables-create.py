import json

import boto3
from readme_metrics.VerifyWebhook import VerifyWebhook

# Your ReadMe secret as a bytes object; you may want to store this in AWS Secrets Manager
README_SECRET = b"my-readme-secret"

# Your default API Gateway usage plan; this will be attached to the API keys that being created
DEFAULT_USAGE_PLAN_ID = "123abc"


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
            key = client.create_api_key(
                name=email,
                description=f"API key for ReadMe user {email}",
                tags={"user": email, "vendor": "ReadMe"},
                enabled=True,
            )

            client.create_usage_plan_key(
                usagePlanId=DEFAULT_USAGE_PLAN_ID, keyId=key["id"], keyType="API_KEY"
            )

            api_key = key["value"]
            status_code = 200
    except Exception as e:
        error = str(e)
        if error.find("Signature") > -1:
            status_code = 401
        else:
            status_code = 500

    if status_code == 200:
        body = {
            # OAS Server variables
            "name": "default-name",
            "port": "",

            # OAS Security variables
            "petstore_auth": api_key,
            "basic_auth": { "user": email, "pass": api_key },
        }
    else:
        body = {"message": error}

    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }