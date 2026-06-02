package com.pharmasathi.backend.repository;

import com.pharmasathi.backend.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {
}