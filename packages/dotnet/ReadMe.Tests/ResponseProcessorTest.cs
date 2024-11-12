using Moq;
using ReadMe.HarJsonObjectModels;
using Microsoft.AspNetCore.Http;

namespace ReadMe.Tests
{
    public class ResponseProcessorTest
    {
        private Mock<HttpResponse> httpResponseMock;
        private ConfigValues configValues;
        private ResponseProcessor processor;
        private string responseBodyData;

        [SetUp]
        public void Setup()
        {
            httpResponseMock = new Mock<HttpResponse>();

            configValues = new ConfigValues
            {
                options = new Options
                {
                    development = true,
                    baseLogUrl = "http://example.com",
                    isAllowListEmpty = true,
                    isDenyListEmpty = true,
                    allowList = new List<string>(),
                    denyList = new List<string>(),
                },
                group = new Group
                {
                    id = "group-id",
                    label = "group-label",
                    email = "group@example.com"
                }
            };

            responseBodyData = "{\"key\":\"value\"}";

            processor = new ResponseProcessor(httpResponseMock.Object, responseBodyData, configValues);

            var headers = new HeaderDictionary
            {
                { "Content-Type", "application/json" },
                { "Authorization", "Bearer token" }
            };

            httpResponseMock.Setup(r => r.StatusCode).Returns(200);
            httpResponseMock.Setup(r => r.Headers).Returns(headers);
        }

        [Test]
        public void ProcessResponse_ShouldReturnValidResponseObject()
        {
            var response = processor.ProcessResponse();

            Assert.IsNotNull(response);
            Assert.That(response.status, Is.EqualTo(200));
            Assert.That(response.statusText, Is.EqualTo("OK"));
            Assert.That(response.content.mimeType, Is.EqualTo("text/plain"));
            Assert.That(response.bodySize, Is.EqualTo(responseBodyData.Length));
            Assert.That(response.headers.Count, Is.EqualTo(2));
            Assert.That(response.content.text, Is.EqualTo(responseBodyData));
            Assert.That(response.statusText, Is.EqualTo("OK"));
        }

        [Test]
        public void GetHeaders_ShouldFilterHeadersByAllowList()
        {
            configValues.options.isAllowListEmpty = false;
            configValues.options.allowList.Add("Content-Type");

            var response = processor.ProcessResponse();

            Assert.That(response.headers.Count, Is.EqualTo(1));
            Assert.That(response.headers[0].name, Is.EqualTo("Content-Type"));
        }

        [Test]
        public void GetHeaders_ShouldFilterHeadersByDenyList()
        {
            configValues.options.isDenyListEmpty = false;
            configValues.options.denyList.Add("Authorization");

            var response = processor.ProcessResponse();

            Assert.That(response.headers.Count, Is.EqualTo(1));
            Assert.That(response.headers[0].name, Is.Not.EqualTo("Authorization"));
        }
    }
}
