using System;
using System.Text;
using Moq;
using NUnit.Framework;
using RestSharp;
using ReadMe.HarJsonTranslationLogics;

namespace ReadMe.Tests;

public class ReadmeApiCallerTest
{
    private const string testHarJsonObject = "{\"sample\":\"data\"}";
    private const string testApiKey = "testApiKey";
    private Mock<IRestClient> restClient;
    private ReadMeApiCaller apiCaller;

    [SetUp]
    public void Setup()
    {
        restClient = new Mock<IRestClient>();
        apiCaller = new ReadMeApiCaller(testHarJsonObject, testApiKey, restClient.Object);
    }

    [Test]
    public void SendHarObjToReadMeApi_ShouldSendRequestWithCorrectHeadersAndBody()
    {
        var expectedApiKeyHeader = "Basic " + Convert.ToBase64String(Encoding.UTF8.GetBytes(testApiKey + ":"));
        restClient.Setup(client => client.ExecuteAsync(It.IsAny<IRestRequest>(), It.IsAny<CancellationToken>())).Verifiable();

        apiCaller.SendHarObjToReadMeApi();

        restClient.Verify(client => client.ExecuteAsync(It.Is<RestRequest>(request =>
            request.Method == Method.POST &&
            request.Parameters.Exists(p => p.Name == "Content-Type" && (string?)p.Value == "application/json") &&
            request.Parameters.Exists(p => p.Name == "Authorization" && (string?)p.Value == expectedApiKeyHeader) &&
            request.Parameters.Exists(p => p.Type == ParameterType.RequestBody && (string?)p.Value == testHarJsonObject)
        ), It.IsAny<CancellationToken>()), Times.Once);
    }
}
