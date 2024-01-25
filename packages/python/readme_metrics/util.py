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
    m.update(bytes(data, "ascii"))
    digest = base64.b64encode(m.digest())
    opts = data[-4:]
    return "sha512-" + digest.decode("ascii") + "?" + opts
