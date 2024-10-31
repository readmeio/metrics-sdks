using Moq;
using ReadMe.HarJsonObjectModels;
using Microsoft.AspNetCore.Http;

namespace ReadMe.Tests
{
    public class RequestProcessorTest
    {
        private Mock<HttpRequest> httpRequestMock;
        private ConfigValues configValues;
        private RequestProcessor processor;

        [SetUp]
        public void Setup()
        {
            httpRequestMock = new Mock<HttpRequest>();

            configValues = new ConfigValues
            {
                options = new Options
                {
                    development = true,
                    baseLogUrl = "http://example.com",
                    isAllowListEmpty = true,
                    isDenyListEmpty = true,
                },
                group = new Group
                {
                    id = "group-id",
                    label = "group-label",
                    email = "group@example.com"
                }
            };

            httpRequestMock.Setup(r => r.Method).Returns("GET");
            httpRequestMock.Setup(r => r.Scheme).Returns("https");
            httpRequestMock.Setup(r => r.Host).Returns(new HostString("localhost", 5001));
            httpRequestMock.Setup(r => r.Path).Returns("/api/data");
            httpRequestMock.Setup(r => r.QueryString).Returns(new QueryString("?id=123"));
            httpRequestMock.Setup(r => r.Protocol).Returns("HTTP/1.1");

            processor = new RequestProcessor(httpRequestMock.Object, configValues);
        }

        [Test]
        public async Task ProcessRequest_Returns_RequestObjectWithCorrectHeadersQueryAndCookies()
        {
            // Arrange headers
            var headers = new HeaderDictionary
            {
                { "Content-Type", "application/json" },
                { "Authorization", "Bearer token" }
            };
            httpRequestMock.Setup(r => r.Headers).Returns(headers);

            // Arrange query
            var query = new QueryCollection(new Dictionary<string, Microsoft.Extensions.Primitives.StringValues>
            {
                { "id", "123" },
                { "type", "test" }
            });
            httpRequestMock.Setup(r => r.Query).Returns(query);

            // Arange cookies
            var cookies = new Dictionary<string, string>()
            {
                { "sessionId", "abc123" },
                { "userId", "user456" }
            };

            var cookiesMock = new Mock<IRequestCookieCollection>();
            cookiesMock.Setup(c => c.Count).Returns(cookies.Count);
            cookiesMock.Setup(c => c.GetEnumerator()).Returns(cookies.GetEnumerator());
            httpRequestMock.Setup(r => r.Cookies).Returns(cookiesMock.Object);

            var result = await processor.ProcessRequest();

            Assert.IsNotNull(result);
            Assert.That(result.method, Is.EqualTo("GET"));
            Assert.That(result.url, Is.EqualTo("https://localhost:5001/api/data?id=123"));
            Assert.That(result.httpVersion, Is.EqualTo("HTTP/1.1"));

            // Assert headers
            Assert.That(result.headers.Count, Is.EqualTo(2));
            Assert.That(result.headers[0].name, Is.EqualTo("Content-Type"));
            Assert.That(result.headers[0].value, Is.EqualTo("application/json"));
            Assert.That(result.headers[1].name, Is.EqualTo("Authorization"));
            Assert.IsNotEmpty(result.headers[1].value);  // Masked value

            // Assert query
            Assert.That(result.queryString.Count, Is.EqualTo(2));
            Assert.That(result.queryString[0].name, Is.EqualTo("id"));
            Assert.That(result.queryString[0].value, Is.EqualTo("123"));
            Assert.That(result.queryString[1].name, Is.EqualTo("type"));
            Assert.That(result.queryString[1].value, Is.EqualTo("test"));

            // Assert cookies
            Assert.That(result.cookies.Count, Is.EqualTo(2));
            Assert.That(result.cookies[0].name, Is.EqualTo("sessionId"));
            Assert.That(result.cookies[0].value, Is.EqualTo("abc123"));
            Assert.That(result.cookies[1].name, Is.EqualTo("userId"));
            Assert.That(result.cookies[1].value, Is.EqualTo("user456"));
        }
    }
}
