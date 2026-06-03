package com.pharmasathi.backend.controller;

import com.pharmasathi.backend.dto.DashboardDto;
import com.pharmasathi.backend.repository.MedicineRepository;
import com.pharmasathi.backend.repository.PurchaseRepository;
import com.pharmasathi.backend.repository.SaleRepository;
import com.pharmasathi.backend.repository.SupplierRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DashboardController {

    private final MedicineRepository medicineRepository;
    private final SupplierRepository supplierRepository;
    private final PurchaseRepository purchaseRepository;
    private final SaleRepository saleRepository;

    public DashboardController(
            MedicineRepository medicineRepository,
            SupplierRepository supplierRepository,
            PurchaseRepository purchaseRepository,
            SaleRepository saleRepository) {

        this.medicineRepository = medicineRepository;
        this.supplierRepository = supplierRepository;
        this.purchaseRepository = purchaseRepository;
        this.saleRepository = saleRepository;
    }

    @GetMapping("/api/dashboard")
    public DashboardDto getDashboard() {

        return new DashboardDto(
                medicineRepository.count(),
                supplierRepository.count(),
                purchaseRepository.count(),
                saleRepository.count()
        );
    }
}