package com.readme.spring.datacollection;

import com.readme.core.dataextraction.LogOptions;
import com.readme.core.dataextraction.payload.PayloadData;
import com.readme.core.dataextraction.payload.requestresponse.ApiCallLogData;
import com.readme.core.dataextraction.payload.requestresponse.RequestDataCollector;
import com.readme.core.dataextraction.payload.user.UserData;
import com.readme.core.dataextraction.payload.user.UserDataCollector;
import com.readme.core.datatransfer.PayloadDataDispatcher;
import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.readme.core.datatransfer.ReadmeApiKeyEncoder;
import com.readme.spring.config.ReadmeConfigurationProperties;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;
import java.io.IOException;
import java.util.Date;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static com.readme.core.dataextraction.payload.PayloadData.*;
import static com.readme.core.datatransfer.BaseLogUrlFetcher.fetchBaseLogUrl;
import static org.springframework.http.HttpMethod.OPTIONS;

/**
 * Servlet filter for collecting HTTP request and response data to be sent to ReadMe Metrics.
 * <p>
 * This filter wraps incoming requests and responses to capture relevant metadata, user info,
 * payload content, and asynchronously dispatches the structured data to the configured destination.
 */
@AllArgsConstructor
@Slf4j
public class DataCollectionFilter implements Filter {

    private ReadmeConfigurationProperties readmeProperties;

    private UserDataCollector<ServletDataPayloadAdapter> userDataCollector;

    private RequestDataCollector<ServletDataPayloadAdapter> requestDataCollector;

    private PayloadDataDispatcher payloadDispatcher;

    private LogOptions logOptions;

    /**
     * Intercepts HTTP requests and responses to extract structured log data for ReadMe metrics.
     * <p>
     * For non-OPTIONS requests, this method wraps the request/response, collects user and API call data,
     * and asynchronously sends it via {@link PayloadDataDispatcher}.
     *
     * @param req   the incoming {@link ServletRequest}
     * @param resp  the outgoing {@link ServletResponse}
     * @param chain the {@link FilterChain} to continue request processing
     * @throws IOException      in case of I/O errors
     * @throws ServletException in case of servlet processing errors
     */
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
                setDocumentationUrl(payloadDataBuilder, response);
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

    private void setDocumentationUrl(PayloadDataBuilder payloadDataBuilder, ContentCachingResponseWrapper response) {
        UUID logId = UUID.randomUUID();
        payloadDataBuilder.logId(logId);
        String encodedReadmeApiKey = ReadmeApiKeyEncoder.encode(readmeProperties.getReadmeApiKey());
        String baseLogUrl = logOptions.getBaseLogUrl() != null ? logOptions.getBaseLogUrl() : fetchBaseLogUrl(encodedReadmeApiKey);
        if (baseLogUrl != null && !baseLogUrl.isEmpty()) {
            response.setHeader("x-documentation-url", baseLogUrl + "/logs/" + logId);
        }
    }
}
