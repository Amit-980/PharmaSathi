package com.pharmasathi.backend.dto;

import java.time.LocalDate;

public record OwnerAccountUpdateRequest(
        Boolean enabled,
        String plan,
        LocalDate subscriptionEndDate
) {
}
