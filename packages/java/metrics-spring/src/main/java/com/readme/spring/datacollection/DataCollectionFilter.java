package com.readme.spring.datacollection;

import com.readme.core.dataextraction.LogOptions;
import com.readme.core.dataextraction.payload.PayloadData;
import com.readme.core.dataextraction.payload.requestresponse.ApiCallLogData;
import com.readme.core.dataextraction.payload.requestresponse.RequestDataCollector;
import com.readme.core.dataextraction.payload.user.UserData;
import com.readme.core.dataextraction.payload.user.UserDataCollector;
import com.readme.core.datatransfer.PayloadDataDispatcher;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;
import java.io.IOException;
import java.util.Date;
import java.util.concurrent.CompletableFuture;

import static com.readme.core.dataextraction.payload.PayloadData.*;
import static org.springframework.http.HttpMethod.OPTIONS;


//TODO Fix:
// Handle Basic tokens as well as Bearer ones

@AllArgsConstructor
@Slf4j
public class DataCollectionFilter implements Filter {

    private UserDataCollector<ServletDataPayloadAdapter> userDataCollector;

    private RequestDataCollector<ServletDataPayloadAdapter> requestDataCollector;

    private PayloadDataDispatcher payloadDispatcher;

    private LogOptions logOptions;

    @Override
    public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain) throws IOException, ServletException {
        ContentCachingRequestWrapper request = new ContentCachingRequestWrapper((HttpServletRequest) req);
        ContentCachingResponseWrapper response = new ContentCachingResponseWrapper((HttpServletResponse) resp);

        PayloadDataBuilder payloadDataBuilder = PayloadData.builder();
        payloadDataBuilder.requestStartedDateTime(new Date());

        try {
            if (request.getMethod().equalsIgnoreCase(OPTIONS.name())) {
                chain.doFilter(req, resp);
            } else {
                chain.doFilter(request, response);
                ServletDataPayloadAdapter payload =
                        new ServletDataPayloadAdapter(request, response);

                UserData userData = userDataCollector.collect(payload);
                payloadDataBuilder.userData(userData);

                ApiCallLogData apiCallLogData = requestDataCollector.collect(payload);
                payloadDataBuilder.apiCallLogData(apiCallLogData);
                payloadDataBuilder.responseEndDateTime(new Date());

                PayloadData payloadData = payloadDataBuilder.build();
                response.copyBodyToResponse();

                CompletableFuture.runAsync(() -> {
                    try {
                        payloadDispatcher.dispatch(payloadData, logOptions);
                        log.info("Data dispatched successfully");
                    } catch (Exception e) {
                        log.error("Error occurred while sending payload data", e.getMessage());
                    }
                });
            }
        } catch (Exception e){
            log.error("Error occurred while processing request by readme metrics-sdk: {}", e.getMessage());
        }
    }

}
