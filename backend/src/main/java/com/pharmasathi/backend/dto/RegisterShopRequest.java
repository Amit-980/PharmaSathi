package com.pharmasathi.backend.dto;

public record RegisterShopRequest(
        String shopName,
        String ownerName,
        String phone,
        String email,
        String username,
        String password
) {
}
