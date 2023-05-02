from queue import Queue

import requests_mock  # pylint: disable=unused-import

from readme_metrics import MetricsApiConfig
from readme_metrics import publisher


mock_config = MetricsApiConfig(
    "README_API_KEY",
    lambda req: {"id": "123", "label": "testuser", "email": "user@email.com"},
    buffer_length=2,
)
mock_config.METRICS_API = "https://readme.metrics.test"


class TestPublisher:
    def setUp(self):
        pass

    # pylint: disable-next=redefined-outer-name
    def test_posts_to_readme(self, requests_mock):
        queued_payload = {"foo": "bar"}
        queue = Queue()
        queue.put(queued_payload)

        requests_mock.real_http = False  # disables unmocked HTTP requests
        requests_mock.post("https://readme.metrics.test/v1/request", status_code=202)

        publisher.publish_batch(mock_config, queue)
        assert (
            requests_mock.call_count == 1
        ), "should POST to the ReadMe Metrics API once"
        assert queue.qsize() == 0, "should remove the item from the queue"

        request_payload = requests_mock.request_history[0].json()
        assert len(request_payload) == 1, "payload should match the enqueued item"
        assert (
            request_payload[0] == queued_payload
        ), "payload should match the enqueued item"

    # pylint: disable-next=redefined-outer-name
    def test_respects_buffer_length(self, requests_mock):
        queued_payload_1 = {"foo": "bar1"}
        queued_payload_2 = {"foo": "bar2"}
        queued_payload_3 = {"foo": "bar3"}
        queue = Queue()
        queue.put(queued_payload_1)
        queue.put(queued_payload_2)
        queue.put(queued_payload_3)

        requests_mock.real_http = False  # disables unmocked HTTP requests
        requests_mock.post("https://readme.metrics.test/v1/request", status_code=202)

        publisher.publish_batch(mock_config, queue)
        assert (
            requests_mock.call_count == 1
        ), "should POST to the ReadMe Metrics API once"

        request_payload = requests_mock.request_history[0].json()
        assert len(request_payload) == 2, "payload size should not exceed batch_size"
        assert (
            queued_payload_1 in request_payload
        ), "payload should match the first 2 enqueued items"
        assert (
            queued_payload_2 in request_payload
        ), "payload should match the first 2 enqueued items"

        # after 2 items were published, the third should still be enqueued
        assert queue.qsize() == 1, "should have dequeued 2 items, leaving 1 enqueued"
        assert (
            queue.get_nowait() == queued_payload_3
        ), "last item enqueued should still be in the queue"

    # pylint: disable-next=redefined-outer-name
    def test_ignores_empty_queue(self, requests_mock):
        queue = Queue()

        requests_mock.real_http = False  # disables unmocked HTTP requests
        requests_mock.post("https://readme.metrics.test/v1/request", status_code=202)

        publisher.publish_batch(mock_config, queue)
        assert (
            requests_mock.call_count == 0
        ), "should not POST to ReadMe when the queue is empty"

    # pylint: disable-next=redefined-outer-name
    def test_respects_backoff(self, requests_mock):
        queued_payload = {"foo": "bar"}
        queue = Queue()

        requests_mock.real_http = False  # disables unmocked HTTP requests
        requests_mock.post("https://readme.metrics.test/v1/request", status_code=429)

        queue.put(queued_payload)
        publisher.publish_batch(mock_config, queue)
        assert (
            requests_mock.call_count == 1
        ), "should POST to the ReadMe Metrics API once"
        assert queue.qsize() == 0

        queue.put(queued_payload)
        queue.put(queued_payload)
        queue.put(queued_payload)
        publisher.publish_batch(mock_config, queue)
        assert (
            requests_mock.call_count == 1
        ), "should not POST to ReadMe while backoff is enabled"
        assert queue.qsize() == 1, "should still dequeue up to batch_size items"
