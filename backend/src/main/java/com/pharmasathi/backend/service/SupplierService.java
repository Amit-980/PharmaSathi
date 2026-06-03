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

    public List<Supplier> getAllSuppliers() {
        return repository.findAll();
    }

    public Supplier saveSupplier(Supplier supplier) {
        return repository.save(supplier);
    }

    public Supplier getSupplierById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public Supplier updateSupplier(Long id, Supplier supplier) {

        Supplier existing = repository.findById(id).orElse(null);

        if (existing == null) {
            return null;
        }

        existing.setName(supplier.getName());
        existing.setPhone(supplier.getPhone());
        existing.setEmail(supplier.getEmail());
        existing.setAddress(supplier.getAddress());

        return repository.save(existing);
    }

    public void deleteSupplier(Long id) {
        repository.deleteById(id);
    }
}