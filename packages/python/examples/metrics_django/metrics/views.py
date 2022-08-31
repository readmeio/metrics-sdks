import os

from django.http import JsonResponse, HttpResponse
from readme_metrics.VerifyWebhook import VerifyWebhook


# pylint: disable=unused-argument
def grouping_function(request):
    return {
        "api_key": "owlbert-api-key",
        "label": "Owlbert",
        "email": "owlbert@example.com",
    }


def index(request):
    if request.method == "GET":
        return JsonResponse(
            {"message": "hello world"}, json_dumps_params={"separators": (",", ":")}
        )

    return HttpResponse(status=200)

secret = os.getenv("README_API_KEY").encode("utf8")

def webhook(request):
    # Verify the request is legitimate and came from ReadMe.
    signature = request.headers.get("readme-signature", None)

    try:
        VerifyWebhook(request.body.decode('utf-8'), signature, secret)
    except Exception as error:
        return JsonResponse({ error: str(error) }, status=401, json_dumps_params={"separators": (",", ":")})

    # Fetch the user from the database and return their data for use with OpenAPI variables.
    # user = User.objects.get(email__exact=request.values.get("email"))
    return JsonResponse({
        "petstore_auth": "default-key",
        "basic_auth": {"user": "user", "pass": "pass"},
    }, json_dumps_params={"separators": (",", ":")})
