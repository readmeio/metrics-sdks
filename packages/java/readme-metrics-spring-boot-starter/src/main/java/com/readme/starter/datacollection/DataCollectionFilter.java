package com.readme.starter.datacollection;

import com.readme.dataextraction.payload.PayloadData;
import com.readme.dataextraction.payload.requestresponse.ApiCallLogData;
import com.readme.dataextraction.payload.requestresponse.RequestDataCollector;
import com.readme.dataextraction.payload.user.UserData;
import com.readme.dataextraction.payload.user.UserDataCollector;
import com.readme.datatransfer.PayloadDataDispatcher;
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

import static com.readme.dataextraction.payload.PayloadData.*;
import static org.springframework.http.HttpMethod.OPTIONS;


//TODO Fix:
// 1. Convert IpV6 to V4 ?????
// 2. * Request.entries.pageref is empty
// 5. * Add response content size and mime type
// 6. Handle Basic tokens as well as Bearer ones
// 7. Validate the collected data on readme dashboard
// 8. Fix core and starter tests
// 9. Consider to rename core-metrics (maybe just "core") and starter (maybe just "spring")
// 10. Handle case if SDK user configured getting request user data from body, but GET req doesn't have it
// 11. Validate user data. Collect request data only if user data is valid ?

@AllArgsConstructor
@Slf4j
public class DataCollectionFilter implements Filter {

    private UserDataCollector<ServletDataPayloadAdapter> userDataCollector;

    private RequestDataCollector<ServletDataPayloadAdapter> requestDataCollector;

    private PayloadDataDispatcher payloadDispatcher;

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
                    payloadDispatcher.dispatch(payloadData);
                });
            }
        } catch (Exception e){
            log.error("Error occurred while processing request by readme metrics-sdk: {}", e.getMessage());
        }
    }

}
