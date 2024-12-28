package com.readme.starter.datacollection;

import com.readme.dataextraction.payload.PayloadData;
import com.readme.dataextraction.payload.RequestDataCollector;
import com.readme.dataextraction.payload.requestresponse.ApiCallLogData;
import com.readme.dataextraction.user.UserData;
import com.readme.dataextraction.user.UserDataCollector;
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
// 0. Send outbound payload as an array *
// 1. Convert IpV6 to V4 ?????
// 2. Request.entries.pageref is empty
// 3. Request.entries.startedDateTime shouldn't be long format but valid date one
// 4. response -> no status code and no status text
// 5. Add response content size and mime type
// 6. Handle Basic tokens as well as Bearer ones
// 7. Validate the collected data on readme dashboard
// 8. Fix core and starter tests

@AllArgsConstructor
@Slf4j
public class DataCollectionFilter implements Filter {

    private UserDataCollector<ServletDataPayloadAdapter> userDataCollector;

    private RequestDataCollector<ServletDataPayloadAdapter> requestDataCollector;

    private PayloadDataDispatcher payloadDispatcher;

    //TODO
    // 1. Research possibility to collect metrics in a separate thread, as it may produce
    // race condition on reading body data stream.
    // 2. Problem to solve: if we collect a request/response after doFilter(r,r), it means
    // the request dataStream will be red by customer's business logic and will not be available to us.
    // On the other hand, if we collect a request before doFilter, the response data is not available yet.
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
                //TODO: Handle case if SDK user configured getting request user data from body, but GET req doesn't have it
                //TODO: Validate user data. Collect request data only if user data is valid ?
                //TODO: Does it make sense to collect everything except body before chain execution?....
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
