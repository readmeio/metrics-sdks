package com.readme.datatransfer.har;


import com.readme.dataextraction.payload.LogOptions;
import com.readme.dataextraction.payload.PayloadData;
import com.readme.dataextraction.payload.requestresponse.RequestData;
import com.readme.dataextraction.payload.requestresponse.ResponseData;
import com.readme.dataextraction.user.UserData;
import com.readme.datatransfer.OutgoingLogBody;
import org.jetbrains.annotations.NotNull;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;


public class OutgoingLogConstructor {

    public OutgoingLogBody constructPayload(
            PayloadData payloadData,
            LogOptions logOptions
    ) {
        int serverTime = (int) (payloadData.getResponseEndDateTime().getTime() - payloadData.getRequestStartedDateTime().getTime());
        UserData userData = payloadData.getUserData();
        RequestData requestData = payloadData.getApiCallLogData().getRequestData();
        ResponseData responseData = payloadData.getApiCallLogData().getResponseData();


        Group group = Group.builder()
                .id(userData.getApiKey())
                .label(userData.getLabel())
                .email(userData.getEmail())
                .build();

        HarEntry harEntry = HarEntry.builder()
                .pageref(requestData.getRoutePath() != null ? requestData.getRoutePath()
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

        HarLog harLog = HarLog.builder()
                .version("1.2") //TODO check if correct
                .creator(new HarCreatorBrowser("readme-metrics (java)", "1.0.0",
                        System.getProperty("os.arch") + "-" + System.getProperty("os.name") + System.getProperty("os.version") +
                                "/" + System.getProperty("java.version"), Collections.emptyMap())) //TODO validate getting info correctly
                .entries(Collections.singletonList(harEntry))
                .build();

        Har har = new Har(harLog);

        return OutgoingLogBody.builder()
                .id(payloadData.getLogId() != null ? payloadData.getLogId() : UUID.randomUUID())
                .version(3)
                .clientIPAddress(requestData.getRemoteAddress())
                .development(logOptions != null && Boolean.TRUE.equals(logOptions.getDevelopment()))
                .group(group)
                .request(har)
                .build();

    }

    private String constructUrl(String url, String host, String proto) {
        try {
            return new URI(proto, host, url, null).toString();
        } catch (URISyntaxException e) {
            return "";
        }
    }

    private HarRequest processRequest(RequestData requestData, LogOptions logOptions) {
        Map<String, String> headers = requestData.getHeaders();
        String requestBody = requestData.getBody();
        String protocol = requestData.getProtocol();

        String requestParams = getRequestParametersAsString(requestData.getRequestParameters());
        List<HarQueryParam> harQueryParameterList = getHarQueryParameterList(requestData.getRequestParameters());

        return HarRequest.builder()
                .httpVersion(protocol)
                .method(HttpMethod.valueOf(requestData.getMethod()))
                .url(requestData.getUrl() + "?" + requestParams)
                .queryString(harQueryParameterList)
                .headers(convertHeaders(headers))
                .postData(convertBodyToHar(requestBody, headers.get("content-type")))
                .build();
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

    private HarPostData convertBodyToHar(String body, String mimeType) {
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
                .size(Long.valueOf(contentLength))
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

}