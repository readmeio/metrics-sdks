package com.readme.spring.datacollection;


import com.readme.core.dataextraction.payload.requestresponse.ApiCallLogData;
import com.readme.core.dataextraction.payload.requestresponse.RequestData;
import com.readme.core.dataextraction.payload.requestresponse.RequestDataCollector;
import com.readme.core.dataextraction.payload.requestresponse.ResponseData;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;


@Slf4j
@AllArgsConstructor
@Component
public class ServletRequestDataCollector implements RequestDataCollector<ServletDataPayloadAdapter> {

    @Override
    public ApiCallLogData collect(ServletDataPayloadAdapter dataPayload) {
        return ApiCallLogData
                .builder()
                .requestData(buildRequestData(dataPayload))
                .responseData(buildResponseData(dataPayload))
                .build();
    }

    private RequestData buildRequestData(ServletDataPayloadAdapter dataPayload) {
        return RequestData.builder()
                .url(dataPayload.getUrl())
                .method(dataPayload.getRequestMethod())
                .protocol(dataPayload.getProtocol())
                .remoteAddress(dataPayload.getAddress())
                .headers(dataPayload.getRequestHeaders())
                .body(dataPayload.getRequestBody())
                .routePath(dataPayload.getUrl())
                .requestParameters(dataPayload.getRequestParameters())
                .build();
    }

    private ResponseData buildResponseData(ServletDataPayloadAdapter dataPayload) {
        return ResponseData.builder()
                .headers(dataPayload.getResponseHeaders())
                .body(dataPayload.getResponseBody())
                .statusCode(dataPayload.getStatusCode())
                .statusMessage(dataPayload.getStatusMessage())
                .build();
    }

}
