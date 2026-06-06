package com.pharmasathi.backend.dto;

public record RegisterShopRequest(
        String shopName,
        String ownerName,
        String phone,
        String email,
        String address,
        String gstin,
        String drugLicense,
        String plan,
        String username,
        String password
) {
}
