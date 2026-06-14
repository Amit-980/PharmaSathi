package com.pharmasathi.backend.config;

import com.pharmasathi.backend.service.AdminAuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AdminAccessInterceptor implements HandlerInterceptor {

    private final AdminAuthService auth;

    public AdminAccessInterceptor(AdminAuthService auth) {
        this.auth = auth;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        if (!auth.authorized(request.getHeader("Authorization"))) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Platform admin login required");
            return false;
        }
        return true;
    }
}
