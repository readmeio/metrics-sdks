package com.readme.datatransfer;

import com.readme.dataextraction.LogOptions;
import com.readme.dataextraction.payload.PayloadData;
import com.readme.dataextraction.payload.requestresponse.RequestData;
import com.readme.dataextraction.payload.requestresponse.ResponseData;
import com.readme.dataextraction.payload.user.UserData;
import com.readme.datatransfer.har.*;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.readme.dataextraction.ApiKeyMasker.mask;

public class OutgoingLogBodyConstructor {

    public OutgoingLogBody construct(
            PayloadData payloadData,
            LogOptions logOptions
    ) {
        UserData userData = payloadData.getUserData();
        RequestData requestData = payloadData.getApiCallLogData().getRequestData();
        ResponseData responseData = payloadData.getApiCallLogData().getResponseData();


        HarEntry harEntry = assembleHarEntry(payloadData, logOptions, requestData, responseData);
        HarLog harLog = assembleHarLog(harEntry);
        Group group = assembleGroup(userData);

        Har har = new Har(harLog);
        return OutgoingLogBody.builder()
                .id(UUID.randomUUID())
                .version(3)
                .clientIPAddress(requestData.getRemoteAddress())
                .development(logOptions != null && Boolean.TRUE.equals(logOptions.getDevelopment()))
                .group(group)
                .request(har)
                .build();

    }

    private static Group assembleGroup(UserData userData) {
        String maskedApiKey = mask(userData.getApiKey());
        return Group.builder()
                .id(maskedApiKey)
                .label(userData.getLabel())
                .email(userData.getEmail())
                .build();
    }

    private HarEntry assembleHarEntry(PayloadData payloadData, LogOptions logOptions, RequestData requestData, ResponseData responseData) {
        int serverTime = getServerTime(payloadData);

        return HarEntry.builder()
                .pageRef(requestData.getRoutePath() != null ? requestData.getRoutePath()
                        : constructUrl(requestData.getUrl(), requestData.getHeaders().get("host"), requestData.getProtocol()))
                .startedDateTime(payloadData.getRequestStartedDateTime())
                .time(serverTime)
                .request(processRequest(requestData, logOptions))
                .response(processResponse(responseData, logOptions))
                .cache(HarCache.builder().build()) //TODO Decide if it is required to do something here
                .timings(HarTiming.builder()
                        .waitTime(0)
                        .receive(serverTime)
                        .build())
                .build();
    }

    private static HarLog assembleHarLog(HarEntry harEntry) {
        String systemInformation = new StringBuilder(System.getProperty("os.arch"))
                .append("-")
                .append(System.getProperty("os.name"))
                .append(System.getProperty("os.version"))
                .append("/")
                .append(System.getProperty("java.version"))
                .toString();

        HarCreatorBrowser harCreatorBrowser = HarCreatorBrowser.builder()
                .name("readme-metrics (java)")
                .version("1.0.0") //TODO correct version from POM
                .comment(systemInformation)
                .build();

        return HarLog.builder()
                .version("1.2") //TODO check if correct
                .creator(harCreatorBrowser)
                .entries(Collections.singletonList(harEntry))
                .build();
    }

    private HarRequest processRequest(RequestData requestData, LogOptions logOptions) {
        Map<String, String> headers = requestData.getHeaders();
        String requestBody = requestData.getBody();
        String protocol = requestData.getProtocol();

        String requestParams = getRequestParametersAsString(requestData.getRequestParameters());
        List<HarQueryParam> harQueryParameterList = getHarQueryParameterList(requestData.getRequestParameters());

        HarRequest.HarRequestBuilder harRequestBuilder = HarRequest.builder()
                .httpVersion(protocol)
                .method(HttpMethod.valueOf(requestData.getMethod()))
                .url(requestData.getUrl() + "?" + requestParams)
                .queryString(harQueryParameterList)
                .headers(convertHeaders(headers));

        if(!requestData.getMethod().equals(HttpMethod.GET.name())) {
            if (requestBody == null) {
                throw new IllegalArgumentException("Request Body is null");
            }
            HarPostData harPostData = assembleHarPostData(requestBody, headers.get("content-type"));
            harRequestBuilder.postData(harPostData);
        }

        return harRequestBuilder.build();
    }

    private static List<HarQueryParam> getHarQueryParameterList(Map<String, String> requestParameters) {
        return requestParameters.entrySet().stream()
                .map(entry -> HarQueryParam.builder()
                        .name(entry.getKey())
                        .value(entry.getValue())
                        .build())
                .collect(Collectors.toList());
    }

    private static String getRequestParametersAsString(Map<String, String> requestParameters) {
        return requestParameters.entrySet()
                .stream()
                .map(entry -> entry.getKey() + "=" + entry.getValue())
                .collect(Collectors.joining("&"));
    }

    private HarPostData assembleHarPostData(String body, String mimeType) {
        return HarPostData.builder()
                .mimeType(mimeType)
                .text(body)
                .build();
    }

    private HarResponse processResponse(ResponseData responseData, LogOptions logOptions) {
        Map<String, String> headers = responseData.getHeaders();
        String body = responseData.getBody();

        String contentType = headers.get("content-type");
        String contentLength = headers.get("content-length");
        HarContent content = HarContent.builder()
                .mimeType(contentType)
                .text(body)
                .size(contentLength != null ? Long.parseLong(contentLength) : body.length())
                .build();
        return HarResponse.builder()
                .status(responseData.getStatusCode())
                .statusText(responseData.getStatusMessage())
                .headers(convertHeaders(headers))
                .content(content)
                .build();
    }


    private List<HarHeader> convertHeaders(Map<String, String> headers) {
        return headers.entrySet().stream()
                .map(entry ->
                        HarHeader.builder()
                                .name(entry.getKey())
                                .value(entry.getValue()).
                                build())
                .collect(Collectors.toList());
    }

    private String constructUrl(String url, String host, String proto) {
        try {
            return new URI(proto, host, url, null).toString();
        } catch (URISyntaxException e) {
            return "";
        }
    }

    private static int getServerTime(PayloadData payloadData) {
        return (int) (payloadData.getResponseEndDateTime().getTime() - payloadData.getRequestStartedDateTime().getTime());
    }

}