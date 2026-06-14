package com.pharmasathi.backend.controller;

import com.pharmasathi.backend.dto.LoginRequest;
import com.pharmasathi.backend.dto.RegisterShopRequest;
import com.pharmasathi.backend.service.ShopAccountService;
import com.pharmasathi.backend.service.AuthSessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/setup")
public class SetupController {

    private final ShopAccountService service;
    private final AuthSessionService sessions;

    public SetupController(ShopAccountService service, AuthSessionService sessions) {
        this.service = service;
        this.sessions = sessions;
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return service.status();
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterShopRequest request) {
        try {
            service.register(request);
            return ResponseEntity.ok(Map.of(
                    "registered", true
            ));
        } catch (IllegalArgumentException | IllegalStateException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(service.login(request));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(401).body(Map.of("message", exception.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        sessions.revoke(authorization);
        return ResponseEntity.noContent().build();
    }
}
