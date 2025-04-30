package com.owl.kotlin_example

import com.readme.core.dataextraction.LogOptions
import com.readme.core.dataextraction.payload.user.UserData
import com.readme.core.dataextraction.payload.user.UserDataCollector
import com.readme.spring.datacollection.ServletDataPayloadAdapter
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class CustomUserDataCollectorConfig {

    @Bean
    fun customUserDataCollector(): UserDataCollector<ServletDataPayloadAdapter> {
        return UserDataCollector { payloadAdapter ->
            val apiKey = payloadAdapter.requestHeaders["x-user-name"]
            UserData.builder()
                .apiKey(apiKey)
                .email("owl@owlfactory.abc")
                .label("owl-label")
                .build()
        }
    }

    @Bean
    fun logOptions(): LogOptions {
        return LogOptions.builder()
            .baseLogUrl("http://baseurl.abcd")
            .bufferLength(3)
            .build()
    }
}