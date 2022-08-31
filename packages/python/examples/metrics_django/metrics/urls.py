from django.urls import path
from django.views.decorators.csrf import csrf_exempt

from . import views

urlpatterns = [
    path("", csrf_exempt(views.index), name="index"),
    path("webhook", csrf_exempt(views.webhook), name="webhook"),
]
