import logging
from logging import Formatter, StreamHandler


def util_exclude_keys(dict, keys):
    return {x: dict[x] for x in dict if x not in keys}


def util_filter_keys(dict, keys):
    return {x: dict[x] for x in dict.keys() & keys}


def util_build_logger():
    logger = logging.getLogger(__package__)
    logger.setLevel(logging.CRITICAL)
    formatter = Formatter(fmt="%(asctime)s [%(levelname)s] %(message)s")
    handler = StreamHandler()
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger
