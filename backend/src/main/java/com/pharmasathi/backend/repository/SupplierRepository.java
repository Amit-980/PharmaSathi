package com.pharmasathi.backend.repository;

import com.pharmasathi.backend.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    List<Supplier> findAllByShopIdOrderByIdDesc(Long shopId);
    Optional<Supplier> findByIdAndShopId(Long id, Long shopId);
    long countByShopId(Long shopId);
}
