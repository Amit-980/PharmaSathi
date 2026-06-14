package com.pharmasathi.backend.service;

import com.pharmasathi.backend.entity.Supplier;
import com.pharmasathi.backend.repository.SupplierRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SupplierService {

    private final SupplierRepository repository;

    public SupplierService(SupplierRepository repository) {
        this.repository = repository;
    }

    public List<Supplier> getAllSuppliers(Long shopId) {
        return repository.findAllByShopIdOrderByIdDesc(shopId);
    }

    public Supplier saveSupplier(Long shopId, Supplier supplier) {
        validate(supplier);
        supplier.setId(null);
        supplier.setShopId(shopId);
        defaults(supplier);
        return repository.save(supplier);
    }

    public Supplier getSupplierById(Long shopId, Long id) {
        return repository.findByIdAndShopId(id, shopId).orElse(null);
    }

    public Supplier updateSupplier(Long shopId, Long id, Supplier supplier) {

        Supplier existing = repository.findByIdAndShopId(id, shopId).orElse(null);

        if (existing == null) {
            return null;
        }
        validate(supplier);

        existing.setName(supplier.getName());
        existing.setPhone(supplier.getPhone());
        existing.setEmail(supplier.getEmail());
        existing.setAddress(supplier.getAddress());
        existing.setGstin(supplier.getGstin());
        existing.setDrugLicense(supplier.getDrugLicense());
        existing.setCreditDays(supplier.getCreditDays());
        existing.setOpeningBalance(supplier.getOpeningBalance());
        defaults(existing);

        return repository.save(existing);
    }

    public void deleteSupplier(Long shopId, Long id) {
        repository.findByIdAndShopId(id, shopId).ifPresent(repository::delete);
    }

    private void validate(Supplier supplier) {
        if (supplier.getName() == null || supplier.getName().isBlank()
                || supplier.getPhone() == null || !supplier.getPhone().matches("\\d{10}")
                || supplier.getCreditDays() != null && supplier.getCreditDays() < 0) {
            throw new IllegalArgumentException("Valid supplier name, 10-digit phone and credit days are required");
        }
    }

    private void defaults(Supplier supplier) {
        supplier.setGstin(supplier.getGstin() == null ? "" : supplier.getGstin().trim().toUpperCase());
        supplier.setDrugLicense(supplier.getDrugLicense() == null ? "" : supplier.getDrugLicense().trim());
        supplier.setCreditDays(supplier.getCreditDays() == null ? 0 : supplier.getCreditDays());
        supplier.setOpeningBalance(supplier.getOpeningBalance() == null ? 0.0 : supplier.getOpeningBalance());
    }
}
