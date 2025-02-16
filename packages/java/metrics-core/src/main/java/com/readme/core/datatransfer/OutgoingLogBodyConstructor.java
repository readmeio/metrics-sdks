package com.readme.core.datatransfer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.readme.core.dataextraction.LogOptions;
import com.readme.core.dataextraction.payload.PayloadData;
import com.readme.core.dataextraction.payload.requestresponse.RequestData;
import com.readme.core.dataextraction.payload.requestresponse.ResponseData;
import com.readme.core.dataextraction.payload.user.UserData;
import com.readme.core.datatransfer.har.*;
import lombok.extern.slf4j.Slf4j;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.readme.core.dataextraction.ApiKeyMasker.mask;

@Slf4j
public class OutgoingLogBodyConstructor {

    public OutgoingLogBody construct(
            PayloadData payloadData,
            LogOptions logOptions
    ) {
        UserData userData = payloadData.getUserData();
        RequestData requestData = payloadData.getApiCallLogData().getRequestData();
        ResponseData responseData = payloadData.getApiCallLogData().getResponseData();

        filterDataByLogOptions(logOptions, requestData);

        HarEntry harEntry = assembleHarEntry(payloadData, logOptions, requestData, responseData);
        HarLog harLog = assembleHarLog(harEntry);
        Group group = assembleGroup(userData);

        Har har = new Har(harLog);
        return OutgoingLogBody.builder()
                .id(UUID.randomUUID())
                .version(3)
                .clientIPAddress(requestData.getRemoteAddress())
                .development(logOptions.isDevelopment())
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
            if (requestBody != null) {
                HarPostData harPostData = assembleHarPostData(requestBody, headers.get("content-type"));
                harRequestBuilder.postData(harPostData);
            }
        }

        return harRequestBuilder.build();
    }

    private List<HarQueryParam> getHarQueryParameterList(Map<String, String> requestParameters) {
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



    public void filterDataByLogOptions(LogOptions options, RequestData req) {
        List<String> denylist = options.getDenylist();
        List<String> allowlist = options.getAllowlist();
        ObjectMapper mapper = new ObjectMapper();

        String mimeType = parseContentType(req.getHeaders().get("content-type"));
        if(mimeType.equalsIgnoreCase("application/json")) {
            try {
                JsonNode requestBodyNode = mapper.readTree(req.getBody());
                String requestBody = "";

                if (denylist != null && !denylist.isEmpty()) {
                    requestBody = applyJsonBodyDenyList(requestBodyNode, denylist).toString();
                    req.setHeaders(applyHeadersDenyList(req.getHeaders(), denylist));
                }
                if (allowlist != null && !allowlist.isEmpty() && denylist == null) {
                    requestBody = applyJsonBodyAllowList(requestBodyNode, allowlist).toString();
                    req.setHeaders(applyHeadersAllowList(req.getHeaders(), allowlist));
                }

                req.setBody(requestBody);
            } catch (Exception e) {
                log.error("Error parsing request body", e);
            }
        }

    }

    private Map<String, String> applyHeadersDenyList(Map<String, String> headers, List<String> denylist) {
        return headers.entrySet().stream()
                .filter(entry -> !denylist.contains(entry.getKey()))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    private Map<String, String> applyHeadersAllowList(Map<String, String> headers, List<String> allowList) {
        return headers.entrySet().stream()
                .filter(entry -> allowList.contains(entry.getKey()))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    private String parseContentType(String contentTypeHeader) {
        if (contentTypeHeader == null || contentTypeHeader.isEmpty()) {
            return "";
        }
        return contentTypeHeader.split(";")[0];
    }

    private ObjectNode applyJsonBodyDenyList(JsonNode json, List<String> deniedPaths) {
        ObjectNode newJson = json.deepCopy();
        deniedPaths.forEach(path -> {
            if (newJson.has(path)) {
                newJson.put(path, "[REDACTED]");
            }
        });
        return newJson;
    }

    private ObjectNode applyJsonBodyAllowList(JsonNode obj, List<String> allowedPaths) {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode newObj = mapper.createObjectNode();
        allowedPaths.forEach(path -> {
            if (obj.has(path)) {
                newObj.set(path, obj.get(path));
            }
        });
        return newObj;
    }

}