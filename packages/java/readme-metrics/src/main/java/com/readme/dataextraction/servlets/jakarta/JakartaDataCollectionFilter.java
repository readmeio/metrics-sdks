package com.readme.dataextraction.servlets.jakarta;

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
 * <p>Use this filter if your project depends on the jakarta.servlet package, which is
 * typically the case in projects using Servlet API versions 5.0 and later.</p>
 *
 * <p>Problem Solved: Provides a unified mechanism for metric collection while maintaining
 * compatibility with modern Servlet API versions.</p>
 */
@AllArgsConstructor
public class JakartaDataCollectionFilter implements Filter {

    private RequestDataCollector<JakartaHttpServletDataPayload> requestDataCollector;

    private UserDataCollector<JakartaHttpServletDataPayload> userDataCollector;


    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        JakartaHttpServletDataPayload payload =
                new JakartaHttpServletDataPayload((HttpServletRequest) request, (HttpServletResponse) response);

        UserData userData = userDataCollector.collect(payload);
        //TODO: Validate user data. Collect request data only if user data set correctly
        requestDataCollector.collect(payload, userData);
    }

}
