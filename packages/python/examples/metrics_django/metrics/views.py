from django.http import HttpResponse

def grouping_function(request):
    return {
        "api_key": "unique api_key of the user",
        "label": "label for us to show for this user (account name, user name, email, etc)",
        "email": "email address for user"
    }

def index(request):
    return HttpResponse("Hello, world. You're at the metrics index.")
