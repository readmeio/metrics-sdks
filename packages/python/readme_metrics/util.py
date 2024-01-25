import logging
import hashlib
import base64
from logging import Formatter, StreamHandler


def util_build_logger():
    logger = logging.getLogger(__package__)
    logger.setLevel(logging.CRITICAL)
    formatter = Formatter(fmt="%(asctime)s [%(levelname)s] %(message)s")
    handler = StreamHandler()
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger


def mask(data):
    m = hashlib.sha512()
    m.update(data.encode("utf8"))
    digest = base64.b64encode(m.digest()).decode("utf8")
    opts = data[-4:]
    return f"sha512-{digest}?{opts}"
