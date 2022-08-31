import json
from django.http import JsonResponse, HttpResponse


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
    else:
        return HttpResponse(status=200)
