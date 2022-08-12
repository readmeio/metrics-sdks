import logging

from readme_metrics.PayloadBuilder import PayloadBuilder


logger = logging.getLogger(__name__)

allowlist = [
    "allowed_string",
    "allowed_number",
    "allowed_dict",
    "allowed_list",
    "allowed_object",
]
denylist = [
    "denied_string",
    "denied_number",
    "denied_dict",
    "denied_list",
    "denied_object",
]

subdict = {"allowed_string": "allowed_value", "denied_string": "denied_value"}
sublist = ["allowed_string", "denied_string"]
mapping = {
    "allowed_string": "allowed_value",
    "denied_string": "denied_value",
    "unspecified_string": "unspecified_value",
    "allowed_number": 123,
    "denied_number": 456,
    "unspecified_number": 789,
    "allowed_dict": subdict,
    "denied_dict": subdict,
    "unspecified_dict": subdict,
    "allowed_list": sublist,
    "denied_list": sublist,
    "unspecified_list": sublist,
}

# When using the denylist, we should redact all top-level fields with names like denied_*.
expected_denylist_result = {
    "allowed_string": "allowed_value",
    "denied_string": "[REDACTED 12]",
    "unspecified_string": "unspecified_value",
    "allowed_number": 123,
    "denied_number": "[REDACTED]",
    "unspecified_number": 789,
    "allowed_dict": subdict,
    "denied_dict": "[REDACTED]",
    "unspecified_dict": subdict,
    "allowed_list": sublist,
    "denied_list": "[REDACTED]",
    "unspecified_list": sublist,
}

# When using the denylist, we should redact all denied_* and unspecified_* top-level fields.
expected_allowlist_result = {
    "allowed_string": "allowed_value",
    "denied_string": "[REDACTED 12]",
    "unspecified_string": "[REDACTED 17]",
    "allowed_number": 123,
    "denied_number": "[REDACTED]",
    "unspecified_number": "[REDACTED]",
    "allowed_dict": subdict,
    "denied_dict": "[REDACTED]",
    "unspecified_dict": "[REDACTED]",
    "allowed_list": sublist,
    "denied_list": "[REDACTED]",
    "unspecified_list": "[REDACTED]",
}


def test_redaction_with_allowlist():
    allowlist_result = PayloadBuilder(
        denylist=None,
        allowlist=allowlist,
        development_mode=True,
        grouping_function=None,
        logger=logger,
    ).redact_dict(mapping)
    assert allowlist_result == expected_allowlist_result


def test_redaction_with_denylist():
    denylist_result = PayloadBuilder(
        denylist=denylist,
        allowlist=None,
        development_mode=True,
        grouping_function=None,
        logger=logger,
    ).redact_dict(mapping)
    assert denylist_result == expected_denylist_result


def test_redaction_with_both():
    # when both allowlist and denylist are present, denylist takes precedence
    denylist_result = PayloadBuilder(
        denylist=denylist,
        allowlist=None,
        development_mode=True,
        grouping_function=None,
        logger=logger,
    ).redact_dict(mapping)
    assert denylist_result == expected_denylist_result
