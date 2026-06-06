package com.pharmasathi.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final ShopAccessInterceptor shopAccessInterceptor;

    public WebConfig(ShopAccessInterceptor shopAccessInterceptor) {
        this.shopAccessInterceptor = shopAccessInterceptor;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {

        registry.addMapping("/**")
                .allowedOriginPatterns(
                        "http://localhost:*",
                        "http://127.0.0.1:*"
                )
                .allowedMethods("*")
                .allowedHeaders("*");
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(shopAccessInterceptor)
                .addPathPatterns(
                        "/api/dashboard",
                        "/api/medicines/**",
                        "/api/suppliers/**",
                        "/api/purchases/**",
                        "/api/sales/**"
                );
    }
}
