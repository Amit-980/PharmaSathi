package com.pharmasathi.backend.repository;

import com.pharmasathi.backend.entity.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    List<Purchase> findAllByShopIdOrderByIdDesc(Long shopId);
    Optional<Purchase> findByIdAndShopId(Long id, Long shopId);
    long countByShopId(Long shopId);
}
