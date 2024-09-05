import hmac
import json
import typing as t
from datetime import datetime, timedelta


class VerificationError(Exception):
    pass


class VerifyWebhook:
    def __init__(self, body: dict, signature: t.Optional[str], secret: str):
        if signature is None:
            raise VerificationError("Missing Signature")

        parsed_input = dict(
            (x.strip(), y.strip())
            for x, y in (element.split("=") for element in signature.split(","))
        )

        time = parsed_input["t"]

        if datetime.now() - datetime.fromtimestamp(
            int(parsed_input["t"]) / 1000
        ) > timedelta(minutes=30):
            raise VerificationError("Expired Signature")

        unsigned = time + "." + json.dumps(body, separators=(",", ":"))
        verify_signature = hmac.new(
            secret.encode("utf-8", errors="ignore"),
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
            raise VerificationError("Invalid Signature")
