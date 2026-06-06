package com.pharmasathi.backend.repository;

import com.pharmasathi.backend.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    List<Medicine> findAllByShopIdOrderByIdDesc(Long shopId);
    Optional<Medicine> findByIdAndShopId(Long id, Long shopId);
    long countByShopId(Long shopId);
}
