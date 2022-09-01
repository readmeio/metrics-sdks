import types

from readme_metrics.Metrics import Metrics
from readme_metrics import MetricsApiConfig


class TestMetrics:
    def test_grouping_function_import(self):
        config = MetricsApiConfig(api_key=123456, grouping_function="json.loads")
        assert isinstance(config.GROUPING_FUNCTION, str)
        metrics = Metrics(config)
        assert isinstance(metrics.grouping_function, types.FunctionType)
