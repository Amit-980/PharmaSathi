package com.pharmasathi.backend.controller;

import com.pharmasathi.backend.entity.Supplier;
import com.pharmasathi.backend.service.SupplierService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {

    private final SupplierService service;

    public SupplierController(SupplierService service) {
        this.service = service;
    }

    @GetMapping
    public List<Supplier> getAll(@RequestAttribute Long shopId) {
        return service.getAllSuppliers(shopId);
    }

    @PostMapping
    public Supplier save(@RequestAttribute Long shopId, @RequestBody Supplier supplier) {
        return service.saveSupplier(shopId, supplier);
    }

    @GetMapping("/{id}")
    public Supplier getById(@RequestAttribute Long shopId, @PathVariable Long id) {
        return service.getSupplierById(shopId, id);
    }

    @PutMapping("/{id}")
    public Supplier update(
            @RequestAttribute Long shopId,
            @PathVariable Long id,
            @RequestBody Supplier supplier) {

        return service.updateSupplier(shopId, id, supplier);
    }

    @DeleteMapping("/{id}")
    public void delete(@RequestAttribute Long shopId, @PathVariable Long id) {
        service.deleteSupplier(shopId, id);
    }
}
