package com.readme.core.datatransfer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.readme.core.dataextraction.LogOptions;
import com.readme.core.dataextraction.payload.PayloadData;
import com.readme.core.dataextraction.payload.requestresponse.BaseRequestResponseData;
import com.readme.core.dataextraction.payload.requestresponse.RequestData;
import com.readme.core.dataextraction.payload.requestresponse.ResponseData;
import com.readme.core.dataextraction.payload.user.UserData;
import com.readme.core.datatransfer.har.*;
import lombok.extern.slf4j.Slf4j;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.*;
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
        filterDataByLogOptions(logOptions, requestData);

        ResponseData responseData = payloadData.getApiCallLogData().getResponseData();
        filterDataByLogOptions(logOptions, responseData);

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
                .cache(HarCache.builder().build())
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
                .version(SdkVersionUtil.getVersion())
                .comment(systemInformation)
                .build();

        return HarLog.builder()
                .version("1.2")
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
                .map(entry -> entry.getKey() + "=" + (entry.getValue() != null ? entry.getValue() : ""))
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

    boolean isJson(String body) {
        if (body == null) return false;
        String trimmed = body.trim();
        return (trimmed.startsWith("{") && trimmed.endsWith("}"))
                || (trimmed.startsWith("[") && trimmed.endsWith("]"));
    }

    boolean isFormUrlEncoded(String body) {
        if (body == null) return false;
        return body.matches("([\\w+%.-]+=[^&]*&?)+");
    }

    public void filterDataByLogOptions(LogOptions options, BaseRequestResponseData reqRespData) {
        Set<String> denyList = options.getDenylist();
        Set<String> allowList = options.getAllowlist();
        String body = reqRespData.getBody();

        if (!isPresent(allowList) && !isPresent(denyList)) return;

        if (isJson(body)) {
            body = handleJsonRequestResponseData(reqRespData, allowList, denyList);
        } else if (isFormUrlEncoded(body)) {
            body = handleFormRequestResponseData(reqRespData, allowList, denyList);
        } else {
            if (isPresent(allowList)) {
                updateHeaders(reqRespData, allowList, true);
            } else if (isPresent(denyList)) {
                updateHeaders(reqRespData, denyList, false);
            }
        }
        reqRespData.setBody(body);
        if (reqRespData instanceof ResponseData) {
            addResponseContentHeaders(reqRespData.getHeaders(), body);
        }
    }

    private void addResponseContentHeaders(Map<String,String> headers, String body) {
        if (isJson(body)) {
            headers.put("Content-Type", "application/json");
        } else if (isFormUrlEncoded(body)) {
            headers.put("Content-Type", "application/x-www-form-urlencoded");
        }
    }

    private String handleJsonRequestResponseData(BaseRequestResponseData data, Set<String> allowList, Set<String> denyList) {
        try {
            JsonNode node = new ObjectMapper().readTree(data.getBody());
            if (isPresent(allowList)) {
                updateHeaders(data, allowList, true);
                return applyJsonBodyAllowList(node, allowList).toString();
            } else if (isPresent(denyList)) {
                updateHeaders(data, denyList, false);
                return applyJsonBodyDenyList(node, denyList).toString();
            }
        } catch (Exception e) {
            log.error("Error parsing JSON body", e);
        }
        return data.getBody();
    }

    private String handleFormRequestResponseData(BaseRequestResponseData data, Set<String> allowList, Set<String> denyList) {
        if (isPresent(allowList)) {
            updateHeaders(data, allowList, true);
            return applyFormUrlEncodedAllowList(data.getBody(), allowList);
        } else if (isPresent(denyList)) {
            updateHeaders(data, denyList, false);
            return applyFormUrlEncodedDenyList(data.getBody(), denyList);
        }
        return data.getBody();
    }

    private void updateHeaders(BaseRequestResponseData data, Set<String> list, boolean isAllow) {
        Map<String, String> updated = isAllow
                ? applyHeadersAllowList(data.getHeaders(), list)
                : applyHeadersDenyList(data.getHeaders(), list);

        data.setHeaders(updated);
    }

    private boolean isPresent(Set<String> optionList){
        return optionList != null && !optionList.isEmpty();
    }

    private Map<String, String> applyHeadersDenyList(Map<String, String> headers, Set<String> denylist) {
        return headers.entrySet().stream()
                .filter(entry -> !denylist.contains(entry.getKey().toLowerCase()))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    private Map<String, String> applyHeadersAllowList(Map<String, String> headers, Set<String> allowList) {
        return headers.entrySet().stream()
                .filter(entry -> {
                    return allowList.contains(entry.getKey().toLowerCase()) ||
                            entry.getKey().equalsIgnoreCase("content-type");
                })
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    private String parseContentType(String contentTypeHeader) {
        if (contentTypeHeader == null || contentTypeHeader.isEmpty()) {
            return "";
        }
        return contentTypeHeader.split(";")[0];
    }

    private ObjectNode applyJsonBodyDenyList(JsonNode json, Set<String> deniedPaths) {
        ObjectNode newJson = json.deepCopy();
        deniedPaths.forEach(path -> {
            if (newJson.has(path)) {
                newJson.put(path, "[REDACTED]");
            }
        });
        return newJson;
    }

    private ObjectNode applyJsonBodyAllowList(JsonNode obj, Set<String> allowedPaths) {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode newObj = mapper.createObjectNode();
        allowedPaths.forEach(path -> {
            if (obj.has(path)) {
                newObj.set(path, obj.get(path));
            }
        });
        return newObj;
    }

    private String applyFormUrlEncodedDenyList(String body, Set<String> deniedKeys) {
        return Arrays.stream(body.split("&"))
                .map(param -> {
                    String[] keyValue = param.split("=");
                    if (keyValue.length == 2 && deniedKeys.contains(keyValue[0])) {
                        return keyValue[0] + "=[REDACTED]";
                    }
                    return param;
                })
                .collect(Collectors.joining("&"));
    }

    private String applyFormUrlEncodedAllowList(String body, Set<String> allowedKeys) {
        return Arrays.stream(body.split("&"))
                .filter(param -> {
                    String[] keyValue = param.split("=");
                    return keyValue.length == 2 && allowedKeys.contains(keyValue[0]);
                })
                .collect(Collectors.joining("&"));
    }

}