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
        supplier.setId(null);
        supplier.setShopId(shopId);
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

        existing.setName(supplier.getName());
        existing.setPhone(supplier.getPhone());
        existing.setEmail(supplier.getEmail());
        existing.setAddress(supplier.getAddress());

        return repository.save(existing);
    }

    public void deleteSupplier(Long shopId, Long id) {
        repository.findByIdAndShopId(id, shopId).ifPresent(repository::delete);
    }
}
