from typing import List


class MetricsApiConfig:
    """
    ReadMe Metrics API configuration object

    ...
    Attributes
    ----------
    README_API_KEY: str
        (required) Your ReadMe API key
    GROUPING_FUNCTION = lambda
        (required)
        Grouping function to construct an identity object. It receives the current request as a parameter, and must
        return a dictionary containing at least an "id" field, and optionally "label" and "email" fields.

        The main purpose of the identity object is to identify the API's caller.
    BUFFER_LENGTH: int
        (optional, default = 10)
        Number of requests to buffer before sending data to ReadMe.
    IS_DEVELOPMENT_MODE: bool
        (optional, default = False) Determines whether you are running in development mode.
    IS_BACKGROUND_MODE: bool
        (optional, default = True) Determines whether to issue the call to the ReadMe API in a background thread.
    BLACKLIST: List[str]
        (optional) An array of headers and JSON body properties to skip sending to ReadMe.

        If you configure a blacklist, it will override any whitelist configuration.
    WHITELIST: List[str]
        (optional) An array of headers and JSON body properties to send to ReadMe.

        If this option is configured, ONLY the whitelisted properties will be sent.
    """
    README_API_KEY: str = None
    BUFFER_LENGTH: int = 10
    GROUPING_FUNCTION = lambda req: None
    IS_DEVELOPMENT_MODE: bool = False
    IS_BACKGROUND_MODE: bool = True
    BLACKLIST: List[str] = []
    WHITELIST: List[str] = []

    def __init__(self,
            api_key: str,
            grouping_function,
            buffer_length:int = 10,
            development_mode:bool = False,
            background_worker_mode:bool = True,
            blacklist:List[str] = None,
            whitelist:List[str] = None):
        """
        Initializes an instance of the MetricsApiConfig object, with defaults set where possible.
        :param api_key: (required) Your ReadMe API key
        :param grouping_function: (required)
            Grouping function to construct an identity object. It receives the current request as a parameter, and must
            return a dictionary containing at least an "id" field, and optionally "label" and "email" fields.

            The main purpose of the identity object is to identify the API's caller.
        :param buffer_length: (optional, default = 10) Number of requests to buffer before sending data to ReadMe.
        :param development_mode: (optional, default = False) Determines whether you are running in development mode.
        :param background_worker_mode: (optional, default = True)
            Determines whether to issue the call to the ReadMe API in a background thread.
        :param blacklist: (optional)
            An array of headers and JSON body properties to skip sending to ReadMe.

            If you configure a blacklist, it will override any whitelist configuration.
        :param whitelist: (optional)
            An array of headers and JSON body properties to send to ReadMe.

            If this option is configured, ONLY the whitelisted properties will be sent.
        """

        self.README_API_KEY = api_key
        self.GROUPING_FUNCTION = grouping_function
        self.BUFFER_LENGTH = buffer_length
        self.IS_DEVELOPMENT_MODE = development_mode
        self.IS_BACKGROUND_MODE = background_worker_mode
        self.BLACKLIST = blacklist or []
        self.WHITELIST = whitelist or []