import json
from django.http import JsonResponse

def grouping_function(request):
    return {
        "api_key": "owlbert-api-key",
        "label": "Owlbert",
        "email": "owlbert@example.com"
    }

def index(request):
    return JsonResponse({ "message": "hello world" }, json_dumps_params={'separators': (',', ':')})
