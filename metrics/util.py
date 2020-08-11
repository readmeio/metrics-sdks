def util_exclude_keys(dict, keys):
    return {x: dict[x] for x in dict if x not in keys}


def util_filter_keys(dict, keys):
    return {x: dict[x] for x in dict.keys() & keys}