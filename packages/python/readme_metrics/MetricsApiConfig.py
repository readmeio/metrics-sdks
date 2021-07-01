from typing import List, Any, Callable


class MetricsApiConfig:
    """ReadMe Metrics API configuration object

    Attributes:
        README_API_KEY (str) Your ReadMe API key
        GROUPING_FUNCTION (lambda): Grouping function to construct an
            identity object. It receives the current request as a parameter, and must
            return a dictionary containing at least an "id" field, and optionally
            "label" and "email" fields.

            The main purpose of the identity object is to identify the API's caller.
        BUFFER_LENGTH (int): Number of requests to buffer before sending data
            to ReadMe. Defaults to 10.
        IS_DEVELOPMENT_MODE (bool): Determines whether you are running in
            development mode. Defaults to False.
        IS_BACKGROUND_MODE (bool):  Determines whether to issue the call to
            the ReadMe API in a background thread. Defaults to True.
        DENYLIST (List[str]): An array of headers and JSON body properties to
            skip sending to ReadMe.

            If you configure a denylist, it will override any allowlist configuration.
        ALLOWLIST (List[str]): An array of headers and JSON body properties to
            send to ReadMe.

            If this option is configured, ONLY the allowlisted properties will be sent.
        ALLOWED_HTTP_HOSTS (List[str]): A list of allowed http hosts for sending
            data to the ReadMe API.
    """

    README_API_KEY: str = None
    BUFFER_LENGTH: int = 10
    GROUPING_FUNCTION: Callable[[Any], None] = lambda req: None
    IS_DEVELOPMENT_MODE: bool = False
    IS_BACKGROUND_MODE: bool = True
    DENYLIST: List[str] = []
    ALLOWLIST: List[str] = []
    ALLOWED_HTTP_HOSTS: List[str] = []

    def __init__(
        self,
        api_key: str,
        grouping_function,
        buffer_length: int = 10,
        development_mode: bool = False,
        background_worker_mode: bool = True,
        allowlist: List[str] = None,
        denylist: List[str] = None,
        blacklist: List[str] = None,
        whitelist: List[str] = None,
        allowed_http_hosts: List[str] = None,
    ):
        """Initializes an instance of the MetricsApiConfig object

        Args:
            api_key (str): Your ReadMe API key
            grouping_function ([type]]): Grouping function to construct an identity
                object. It receives the current request as a parameter, and must return
                a dictionary containing at least an "id" field, and optionally "label"
                and "email" fields.

                The main purpose of the identity object is to identify the API's caller.
            buffer_length (int, optional): Number of requests to buffer before sending
                data to ReadMe. Defaults to 10.
            development_mode (bool, optional): Determines whether you are running in
                development mode. Defaults to False.
            background_worker_mode (bool, optional): Determines whether to issue the
                call to the ReadMe API in a background thread. Defaults to True.
            denylist (List[str], optional): An array of headers and JSON body
                properties to skip sending to ReadMe. Defaults to None.

                If you configure a denylist, it will override any allowlist
                configuration.
            allowlist (List[str], optional): An array of headers and JSON body
                properties to send to ReadMe. Defaults to None.

                If this option is configured, ONLY the whitelisted properties will be
                sent.
            blacklist (List[str], optional): Deprecated, prefer denylist.
            whitelist (List[str], optional): Deprecated, prefer allowlist.
            allowed_http_hosts (List[str], optional): A list of allowed http hosts for sending data
                to the ReadMe API.
        """
        self.README_API_KEY = api_key
        self.GROUPING_FUNCTION = grouping_function
        self.BUFFER_LENGTH = buffer_length
        self.IS_DEVELOPMENT_MODE = development_mode
        self.IS_BACKGROUND_MODE = background_worker_mode
        self.DENYLIST = denylist or blacklist or []
        self.ALLOWLIST = allowlist or whitelist or []
        self.ALLOWED_HTTP_HOSTS = allowed_http_hosts
