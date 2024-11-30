package com.readme.dataextraction.servlets.javax;

import com.readme.dataextraction.RequestDataCollector;
import com.readme.dataextraction.UserDataCollector;
import com.readme.domain.UserData;
import lombok.AllArgsConstructor;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * A filter for collecting HTTP request and response metrics in environments using the
 * javax.servlet API (e.g., Spring Boot 2).
 *
 * <p>This filter intercepts HTTP requests and responses, passing them to a {@code DataCollector}
 * for processing. It enables applications to gather usage data,
 * such as response codes, headers, and payloads.</p>
 *
 * <p>Use this filter if your project depends on the javax.servlet package, which is
 * typically the case in projects using Servlet API versions prior to 5.0.</p>
 *
 * <p>Problem Solved: Provides a unified mechanism for metric collection while maintaining
 * compatibility with older Servlet API versions.</p>
 */
@AllArgsConstructor
public class JavaxDataCollectionFilter implements Filter {

    private RequestDataCollector<JavaxHttpServletDataPayload> requestDataCollector;

    private UserDataCollector<JavaxHttpServletDataPayload> userDataCollector;


    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        JavaxHttpServletDataPayload payload =
                new JavaxHttpServletDataPayload((HttpServletRequest) request, (HttpServletResponse) response);

        UserData userData = userDataCollector.collect(payload);
        requestDataCollector.collect(payload, userData);
    }

}
