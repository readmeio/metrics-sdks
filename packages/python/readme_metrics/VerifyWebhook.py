import json
import hmac
from datetime import datetime, timedelta


class VerifyWebhook:
    def __init__(self, body, signature, secret):
        if signature is None:
            raise Exception("Missing Signature")

        parsed_input = dict(
            (x.strip(), y.strip())
            for x, y in (element.split("=") for element in signature.split(","))
        )

        time = parsed_input["t"]

        if datetime.now() - datetime.fromtimestamp(
            int(parsed_input["t"]) / 1000
        ) > timedelta(minutes=30):
            raise Exception("Expired Signature")

        unsigned = time + "." + json.dumps(body, separators=(",", ":"))
        verify_signature = hmac.new(
            secret,
            unsigned.encode("utf8"),
            "sha256",
        ).hexdigest()
        readme_signature = parsed_input["v0"]
        if (
            hmac.compare_digest(
                verify_signature.encode(), readme_signature.encode("utf8")
            )
            is False
        ):
            raise Exception("Invalid Signature")
