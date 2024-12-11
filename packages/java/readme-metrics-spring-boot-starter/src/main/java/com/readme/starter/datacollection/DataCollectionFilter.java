package com.readme.starter.datacollection;

import com.readme.dataextraction.RequestDataCollector;
import com.readme.dataextraction.UserDataCollector;
import com.readme.domain.UserData;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;


/**
 * A filter for collecting HTTP request and response metrics in environments using the
 * jakarta.servlet API (e.g., Spring Boot 3).
 *
 * <p>This filter intercepts HTTP requests and responses, passing them to a {@code DataCollector}
 * for processing. It enables applications to gather usage data,
 * such as response codes, headers, and payloads.</p>
 *
 * <p>Problem Solved: Provides a unified mechanism for metric collection while maintaining
 * compatibility with modern Servlet API versions.</p>
 */
@AllArgsConstructor
@Slf4j
public class DataCollectionFilter implements Filter {

    private RequestDataCollector<ServletDataPayloadAdapter> requestDataCollector;

    private UserDataCollector<ServletDataPayloadAdapter> userDataCollector;


    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        try {
            ServletDataPayloadAdapter payload =
                    new ServletDataPayloadAdapter((HttpServletRequest) request,
                            (HttpServletResponse) response);
            UserData userData = userDataCollector.collect(payload);

            //TODO: Validate user data. Collect request data only if user data is valid ?
            requestDataCollector.collect(payload, userData);
        } catch (Exception e){
            log.error("Error occurred while processing request by readme metrics-sdk: {}", e.getMessage());
        } finally {
            chain.doFilter(request, response);
        }
    }

}
