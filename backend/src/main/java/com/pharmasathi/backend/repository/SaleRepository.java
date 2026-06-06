package com.pharmasathi.backend.repository;

import com.pharmasathi.backend.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SaleRepository extends JpaRepository<Sale, Long> {
    List<Sale> findAllByShopIdOrderByIdDesc(Long shopId);
    Optional<Sale> findByIdAndShopId(Long id, Long shopId);
    long countByShopId(Long shopId);
}
