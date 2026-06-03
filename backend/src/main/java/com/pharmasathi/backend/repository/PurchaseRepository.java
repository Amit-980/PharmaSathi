package com.pharmasathi.backend.repository;

import com.pharmasathi.backend.entity.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
}