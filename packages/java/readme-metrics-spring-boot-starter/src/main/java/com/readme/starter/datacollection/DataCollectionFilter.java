package com.readme.starter.datacollection;

import com.readme.dataextraction.RequestDataCollector;
import com.readme.dataextraction.UserDataCollector;
import com.readme.domain.UserData;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;

import static org.springframework.http.HttpMethod.GET;
import static org.springframework.http.HttpMethod.OPTIONS;


@AllArgsConstructor
@Slf4j
public class DataCollectionFilter implements Filter {

    private RequestDataCollector<ServletDataPayloadAdapter> requestDataCollector;

    private UserDataCollector<ServletDataPayloadAdapter> userDataCollector;

    //TODO
    // 1. Research possibility to collect metrics in a separate thread, as it may produce
    // race condition on reading body data stream.
    // 2. Problem to solve: if we collect a request/response after doFilter(r,r), it means
    // the request dataStream will be red by customer's business logic and will not be available to us.
    // On the other hand, if we collect a request before doFilter, the response data is not available yet.
    @Override
    public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) resp;

        try {
            if (request.getMethod().equalsIgnoreCase(OPTIONS.name())) {
                chain.doFilter(req, resp);
            } else if (request.getMethod().equalsIgnoreCase(GET.name())) {
                ServletDataPayloadAdapter payload =
                        new ServletDataPayloadAdapter(request, response);

                //TODO: Handle case if SDK user configured getting request user data from body, but GET req doesn't have it
                UserData userData = userDataCollector.collect(payload);
                //TODO: Validate user data. Collect request data only if user data is valid ?
                requestDataCollector.collect(payload, userData);
                chain.doFilter(req, resp);
            } else {
                ContentCachingRequestWrapper cacheableRequest =
                        new ContentCachingRequestWrapper(request);
                ContentCachingResponseWrapper cacheableResponse =
                        new ContentCachingResponseWrapper(response);

                ServletDataPayloadAdapter payload =
                        new ServletDataPayloadAdapter(cacheableRequest, cacheableResponse);
                UserData userData = userDataCollector.collect(payload);

                requestDataCollector.collect(payload, userData);
                chain.doFilter(cacheableRequest, cacheableResponse);
            }
        } catch (Exception e){
            log.error("Error occurred while processing request by readme metrics-sdk: {}", e.getMessage());
        } finally {
            chain.doFilter(req, resp);
        }
    }

}
