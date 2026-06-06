package com.pharmasathi.backend.config;

import com.pharmasathi.backend.entity.ShopAccount;
import com.pharmasathi.backend.repository.ShopAccountRepository;
import com.pharmasathi.backend.service.AuthSessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.LocalDate;

@Component
public class ShopAccessInterceptor implements HandlerInterceptor {

    private final AuthSessionService sessions;
    private final ShopAccountRepository accounts;

    public ShopAccessInterceptor(AuthSessionService sessions, ShopAccountRepository accounts) {
        this.sessions = sessions;
        this.accounts = accounts;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        Long shopId = sessions.resolve(request.getHeader("Authorization"));
        ShopAccount account = shopId == null ? null : accounts.findById(shopId).orElse(null);

        if (account == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Login required");
            return false;
        }
        if (!account.isEnabled()) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Account disabled by owner");
            return false;
        }
        if (account.getSubscriptionEndDate() != null
                && account.getSubscriptionEndDate().isBefore(LocalDate.now())) {
            response.sendError(HttpServletResponse.SC_PAYMENT_REQUIRED, "Subscription expired");
            return false;
        }

        request.setAttribute("shopId", shopId);
        return true;
    }
}
