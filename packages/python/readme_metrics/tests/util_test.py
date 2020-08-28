import pytest
from readme_metrics import util


def test_excludeKeys():
    # dict is None
    with pytest.raises(TypeError):
        util.util_exclude_keys(None, ["key1", "key2"])

    # dict is Empty
    assert util.util_exclude_keys({}, ["key1", "key2"]) == {}

    # key is None
    with pytest.raises(TypeError):
        util.util_exclude_keys({"key1": "A", "key2": "B"}, None)

    # key is Empty
    excluded = util.util_exclude_keys({"key1": "A", "key2": "B"}, [])
    assert excluded == {"key1": "A", "key2": "B"}

    # keys all not in dict
    excluded = util.util_exclude_keys({"key1": "A", "key2": "B"}, ["key3", "key4"])
    assert excluded == {"key1": "A", "key2": "B"}

    # keys is all in dict
    excluded = util.util_exclude_keys({"key1": "A", "key2": "B"}, ["key1", "key2"])
    assert excluded == {}

    # some keys in dict
    excluded = util.util_exclude_keys({"key1": "A", "key2": "B"}, ["key2", "key3"])
    assert excluded == {"key1": "A"}


def test_filterKeys():
    # dict is None
    with pytest.raises(AttributeError):
        util.util_filter_keys(None, ["key1", "key2"])

    # dict is Empty
    filtered = util.util_filter_keys({}, ["key1", "key2"])
    assert filtered == {}

    # key is None
    with pytest.raises(TypeError):
        util.util_filter_keys({"key1": "A", "key2": "B"}, None)

    # key is Empty
    filtered = util.util_filter_keys({"key1": "A", "key2": "B"}, [])
    assert filtered == {}

    # keys all not in dict
    filtered = util.util_filter_keys({"key1": "A", "key2": "B"}, ["key3", "key4"])
    assert filtered == {}

    # keys is all in dict
    filtered = util.util_filter_keys({"key1": "A", "key2": "B"}, ["key1", "key2"])
    assert filtered == {"key1": "A", "key2": "B"}

    # some keys in dict
    filtered = util.util_filter_keys({"key1": "A", "key2": "B"}, ["key2", "key3"])
    assert filtered == {"key2": "B"}
