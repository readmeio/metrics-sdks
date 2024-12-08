package com.readme.starter.datacollection;

import com.readme.dataextraction.RequestDataCollector;
import com.readme.dataextraction.UserDataCollector;
import com.readme.domain.UserData;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;

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
public class DataCollectionFilter implements Filter {

    private RequestDataCollector<HttpServletDataPayload> requestDataCollector;

    private UserDataCollector<HttpServletDataPayload> userDataCollector;


    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletDataPayload payload =
                new HttpServletDataPayload((HttpServletRequest) request, (HttpServletResponse) response);

        UserData userData = userDataCollector.collect(payload);
        //TODO: Validate user data. Collect request data only if user data is valid ?
        requestDataCollector.collect(payload, userData);
    }

}
