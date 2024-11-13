using NUnit.Framework;
using Moq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using ReadMe.HarJsonTranslationLogics;
using ReadMe.HarJsonObjectModels;
using System.IO;
using System.Net;
using Newtonsoft.Json;
using System.Collections.Generic;

namespace ReadMe.Tests
{
    [TestFixture]
    public class HarJsonBuilderTests
    {
        private Mock<RequestDelegate> nextMock;
        private Mock<HttpContext> httpContextMock;
        private Mock<IConfiguration> configurationMock;
        private Mock<HttpResponse> responseMock;
        private Mock<HttpRequest> requestMock;
        private ConfigValues configValues;
        private HarJsonBuilder builder;

        [SetUp]
        public void SetUp()
        {
            nextMock = new Mock<RequestDelegate>();
            httpContextMock = new Mock<HttpContext>();
            configurationMock = new Mock<IConfiguration>();

            requestMock = new Mock<HttpRequest>();
            responseMock = new Mock<HttpResponse>();
            var connection = new Mock<ConnectionInfo>();

            connection.Setup(c => c.RemoteIpAddress).Returns(IPAddress.Parse("127.0.0.1"));
            httpContextMock.Setup(c => c.Request).Returns(requestMock.Object);
            httpContextMock.Setup(c => c.Response).Returns(responseMock.Object);
            httpContextMock.Setup(c => c.Connection).Returns(connection.Object);

            responseMock.SetupProperty(r => r.Body, new MemoryStream());

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

            var requestHeaders = new HeaderDictionary();
            requestMock.Setup(r => r.Headers).Returns(requestHeaders);
            requestMock.SetupProperty(r => r.Scheme, "https");
            requestMock.SetupProperty(r => r.Host, new HostString("localhost", 5000));
            requestMock.Setup(r => r.Query.Count).Returns(0);
            requestMock.Setup(r => r.Cookies.Count).Returns(0);

            var responseHeaders = new HeaderDictionary();
            responseMock.Setup(r => r.Headers).Returns(responseHeaders);
            responseMock.SetupProperty(r => r.Body, new MemoryStream());

            builder = new HarJsonBuilder(nextMock.Object, httpContextMock.Object, configurationMock.Object, configValues);
        }

        [Test]
        public async Task BuildHar_ShouldReturnJsonWithExpectedStructure()
        {
            string result = await builder.BuildHar();

            Assert.IsNotNull(result);
            var deserializedResult = JsonConvert.DeserializeObject<List<Root>>(result);
            Assert.IsNotEmpty(deserializedResult);

            Assert.That(deserializedResult[0].group.label, Is.EqualTo(configValues.group.label));
            Assert.That(deserializedResult[0].clientIPAddress, Is.EqualTo("127.0.0.1"));
        }

        [Test]
        public async Task BuildHar_ShouldAddDocumentationUrlHeaderToResponse()
        {
            await builder.BuildHar();

            Assert.IsTrue(responseMock.Object.Headers.ContainsKey("x-documentation-url"));
            Assert.IsTrue(responseMock.Object.Headers["x-documentation-url"].ToString().StartsWith(configValues.options.baseLogUrl));
        }
    }
}
