#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

from django.core.management.commands.runserver import Command as runserver

if os.getenv("README_API_KEY") is None and "runserver" in sys.argv:
    sys.stderr.write("Missing `README_API_KEY` environment variable")
    sys.stderr.flush()
    sys.exit(1)


def main():
    """Run administrative tasks."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "metrics_django.settings")
    runserver.default_port = os.getenv("PORT") or 8000
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


if __name__ == "__main__":
    main()
