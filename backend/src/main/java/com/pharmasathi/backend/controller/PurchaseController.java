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
    public List<Purchase> getAll(@RequestAttribute Long shopId) {
        return service.getAllPurchases(shopId);
    }

    @PostMapping
    public Purchase save(@RequestAttribute Long shopId, @RequestBody Purchase purchase) {
        return service.savePurchase(shopId, purchase);
    }

    @GetMapping("/{id}")
    public Purchase getById(@RequestAttribute Long shopId, @PathVariable Long id) {
        return service.getPurchaseById(shopId, id);
    }

    @PutMapping("/{id}")
    public Purchase update(
            @RequestAttribute Long shopId,
            @PathVariable Long id,
            @RequestBody Purchase purchase) {

        return service.updatePurchase(shopId, id, purchase);
    }

    @DeleteMapping("/{id}")
    public void delete(@RequestAttribute Long shopId, @PathVariable Long id) {
        service.deletePurchase(shopId, id);
    }
}
