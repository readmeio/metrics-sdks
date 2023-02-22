# ReadMe Metrics

<p align="center">
  <img src="https://user-images.githubusercontent.com/33762/182927634-2aebeb46-c215-4ac3-9e98-61f931e33583.png" />
</p>

<p align="center">
  Track usage of your API and troubleshoot issues faster.
</p>

<p align="center">
  <a href="https://pypi.org/project/readme-metrics/"><img src="https://img.shields.io/pypi/v/readme-metrics.svg?style=for-the-badge" alt="Latest release"></a>
  <a href="https://github.com/readmeio/metrics-sdks"><img src="https://img.shields.io/github/actions/workflow/status/readmeio/metrics-sdks/python.yml?branch=main&style=for-the-badge" alt="Build status"></a>
</p>

With [ReadMe's Metrics API](https://readme.com/metrics) your team can get deep insights into your API's usage. If you're a developer, it takes a few small steps to send your API logs to [ReadMe](http://readme.com). Here's an overview of how the integration works:

- You add the ReadMe middleware to your [Django](https://www.djangoproject.com/), [Flask](https://flask.palletsprojects.com/), or [WSGI](https://wsgi.readthedocs.io/) application.
- The middleware sends to ReadMe the response object that your application generates each time a user makes a request to your API. The entire response is sent, unless you allow or deny keys.
- ReadMe populates Metrics with this information, such as which endpoint is being called, response code, and error messages. It also identifies the customer who called your API, using whichever keys in the middleware you call out as containing relevant customer info.

```bash
pip install "readme-metrics[Django]" # Django applications
pip install "readme-metrics[Flask]" # Flask applications
pip install readme-metrics # WSGI
```

- [Django Integrations](https://docs.readme.com/docs/python-django-api-metrics)
- [Flask Integrations](https://docs.readme.com/docs/python-flask-api-metrics)
- [WSGI Integrations](https://docs.readme.com/docs/python-wsgi-api-metrics)

> 🚧 Any Issues?
>
> Integrations can be tricky! [Contact support](https://docs.readme.com/guides/docs/contact-support) if you have any questions/issues.
