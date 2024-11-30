package com.readme;

import com.readme.config.CoreConfig;
import com.readme.datatransfer.DataSender;
import com.readme.datatransfer.HttpDataSender;
import com.readme.domain.RequestPayload;
import okhttp3.OkHttpClient;

public class ReadmeMetrics {

    //TODO Don't forget to refactor all this mess
    public static void main(String[] args) {

        OkHttpClient okHttpClient = new OkHttpClient();

        CoreConfig coreConfig = CoreConfig.builder()
                .readmeAPIKey("apikey")
                .build();

        DataSender d = new HttpDataSender(okHttpClient, coreConfig);

        //TODO List of work to build the body dinamically:
        // 1. Generate the logID
        // 2. Initialize startTime
        RequestPayload r = RequestPayload.builder()
                .body("[{\"_id\":\"ff783c0a-d49c-4930-8bbd-2e8937b35bad\",\"_version\":3,\"group\":{\n" +
                        "  \"id\":\"sha512-u2GbQ83jIqNa+a8v110+8IDztQQr4joL1xSE+wFH51zSOA1qQKPwOC8t2n2LWJQA1mX4ZLZ45SEokITzLed/ow==?-key\",\n" +
                        "  \"label\":\"Owlbertic\",\"email\":\"owlbertic@example.com\"},\n" +
                        "  \"clientIPAddress\":\"127.0.0.1\",\"development\":false,\"request\":{\n" +
                        "    \"log\":{\"version\":\"1.2\",\"creator\":{\"name\":\"readme-metrics (JAVA)\",\"version\":\"7.0.0-alpha.7\",\"comment\":\"arm64-darwin24.1.0/22.9.0\"},\n" +
                        "      \"entries\":[{\"pageref\":\"http://127.0.0.1/\",\"startedDateTime\":\"2024-11-07T22:32:27.863Z\",\"time\":4318,\"request\":{\n" +
                        "        \"method\":\"GET\",\"url\":\"http://127.0.0.1:8000/\",\"httpVersion\":\"HTTP/1.1\",\"headers\":[\n" +
                        "          {\"name\":\"host\",\"value\":\"127.0.0.1:8000\"},\n" +
                        "          {\"name\":\"connection\",\"value\":\"keep-alive\"},\n" +
                        "          {\"name\":\"sec-ch-ua\",\"value\":\"\\\"Chromium\\\";v=\\\"130\\\", \\\"Google Chrome\\\";v=\\\"130\\\", \\\"Not?A_Brand\\\";v=\\\"99\\\"\"},\n" +
                        "          {\"name\":\"sec-ch-ua-mobile\",\"value\":\"?0\"},{\"name\":\"sec-ch-ua-platform\",\"value\":\"\\\"macOS\\\"\"},\n" +
                        "          {\"name\":\"accept-language\",\"value\":\"uk-UA,uk;q=0.9\"},\n" +
                        "          {\"name\":\"upgrade-insecure-requests\",\"value\":\"1\"},\n" +
                        "          {\"name\":\"user-agent\",\"value\":\"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36\"},\n" +
                        "          {\"name\":\"accept\",\"value\":\"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7\"},\n" +
                        "          {\"name\":\"sec-fetch-site\",\"value\":\"JAVA\"},\n" +
                        "          {\"name\":\"sec-fetch-mode\",\"value\":\"navigate\"},\n" +
                        "          {\"name\":\"sec-fetch-user\",\"value\":\"?1\"},\n" +
                        "          {\"name\":\"sec-fetch-dest\",\"value\":\"document\"},\n" +
                        "          {\"name\":\"accept-encoding\",\"value\":\"gzip, deflate, br, zstd\"},\n" +
                        "          {\"name\":\"if-none-match\",\"value\":\"W/\\\"1a-iEQ9RXvkycqsT4vWvcdHrxZT8OE\\\"\"}],\n" +
                        "        \"queryString\":[],\"cookies\":[],\"headersSize\":-1,\"bodySize\":-1},\n" +
                        "        \"response\":{\"status\":304,\"statusText\":\"Not Modified\",\n" +
                        "          \"headers\":[\n" +
                        "            {\"name\":\"x-powered-by\",\"value\":\"Express\"},\n" +
                        "            {\"name\":\"etag\",\"value\":\"W/\\\"1a-iEQ9RXvkycqsT4vWvcdHrxZT8OE\\\"\"}],\n" +
                        "          \"content\":{\"text\":\"\\\"\\\"\",\"size\":0,\"mimeType\":\"text/plain\"},\n" +
                        "          \"httpVersion\":\"\",\"cookies\":[],\"redirectURL\":\"\",\"headersSize\":0,\"bodySize\":0},\"cache\":{},\"timings\":{\"wait\":0,\"receive\":4318}}]}}}]\n")
                .build();

        System.out.println(d.send(r));
    }

}