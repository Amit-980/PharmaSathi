package com.pharmasathi.backend.controller;

import com.pharmasathi.backend.entity.Purchase;
import com.pharmasathi.backend.service.PurchaseService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchases")
public class PurchaseController {

    private final PurchaseService service;

    public PurchaseController(PurchaseService service) {
        this.service = service;
    }

    @GetMapping
    public List<Purchase> getAll() {
        return service.getAllPurchases();
    }

    @PostMapping
    public Purchase save(@RequestBody Purchase purchase) {
        return service.savePurchase(purchase);
    }

    @GetMapping("/{id}")
    public Purchase getById(@PathVariable Long id) {
        return service.getPurchaseById(id);
    }

    @PutMapping("/{id}")
    public Purchase update(
            @PathVariable Long id,
            @RequestBody Purchase purchase) {

        return service.updatePurchase(id, purchase);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deletePurchase(id);
    }
}