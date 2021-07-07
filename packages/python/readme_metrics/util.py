import logging
from logging import Formatter, StreamHandler


def util_build_logger():
    logger = logging.getLogger(__package__)
    logger.setLevel(logging.CRITICAL)
    formatter = Formatter(fmt="%(asctime)s [%(levelname)s] %(message)s")
    handler = StreamHandler()
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger
