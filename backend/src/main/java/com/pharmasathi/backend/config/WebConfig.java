package com.pharmasathi.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final ShopAccessInterceptor shopAccessInterceptor;
    private final PrivacyHeadersInterceptor privacyHeadersInterceptor;
    private final AdminAccessInterceptor adminAccessInterceptor;
    private final String[] allowedOrigins;

    public WebConfig(
            ShopAccessInterceptor shopAccessInterceptor,
            PrivacyHeadersInterceptor privacyHeadersInterceptor,
            AdminAccessInterceptor adminAccessInterceptor,
            @Value("${pharmasathi.allowed-origins:http://localhost:*,http://127.0.0.1:*}") String allowedOrigins) {
        this.shopAccessInterceptor = shopAccessInterceptor;
        this.privacyHeadersInterceptor = privacyHeadersInterceptor;
        this.adminAccessInterceptor = adminAccessInterceptor;
        this.allowedOrigins = allowedOrigins.split("\\s*,\\s*");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {

        registry.addMapping("/**")
                .allowedOriginPatterns(allowedOrigins)
                .allowedMethods("*")
                .allowedHeaders("*");
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(privacyHeadersInterceptor)
                .addPathPatterns("/api/**");
        registry.addInterceptor(shopAccessInterceptor)
                .addPathPatterns(
                        "/api/dashboard",
                        "/api/medicines/**",
                        "/api/suppliers/**",
                        "/api/purchases/**",
                        "/api/sales/**"
                );
        registry.addInterceptor(adminAccessInterceptor)
                .addPathPatterns("/api/admin/**")
                .excludePathPatterns("/api/admin/login");
    }
}
