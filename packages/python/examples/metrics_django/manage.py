#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

if os.getenv("README_API_KEY") is None and "runserver" in sys.argv:
    sys.stderr.write("Missing `README_API_KEY` environment variable")
    sys.stderr.flush()
    sys.exit(1)


def main():
    """Run administrative tasks."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "metrics_django.settings")
    host = "0.0.0.0"
    port = os.getenv("PORT") or 8000

    server_type = os.getenv("SERVER_TYPE", "wsgi").lower()
    if server_type == "wsgi":
        # pylint: disable=import-outside-toplevel
        from django.core.management.commands.runserver import Command as runserver

        runserver.default_addr = host
        runserver.default_port = port
        try:
            # pylint: disable=import-outside-toplevel
            from django.core.management import execute_from_command_line
        except ImportError as exc:
            raise ImportError(
                "Couldn't import Django. Are you sure it's installed and "
                "available on your PYTHONPATH environment variable? Did you "
                "forget to activate a virtual environment?"
            ) from exc
        execute_from_command_line(sys.argv)
    else:
        try:
            # pylint: disable=import-outside-toplevel
            import uvicorn
        except ImportError as exc:
            raise ImportError(
                "Couldn't import Uvicorn. Are you sure it's installed and "
                "available on your PYTHONPATH environment variable?"
            ) from exc
        uvicorn.run(
            "metrics_django.asgi:application", host=host, port=port, lifespan="off"
        )


if __name__ == "__main__":
    main()
