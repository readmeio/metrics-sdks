from django.http import JsonResponse, HttpResponse

# pylint: disable=unused-import
from .models import Person


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
