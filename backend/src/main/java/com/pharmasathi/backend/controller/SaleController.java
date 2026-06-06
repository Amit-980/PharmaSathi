package com.pharmasathi.backend.controller;

import com.pharmasathi.backend.entity.Sale;
import com.pharmasathi.backend.service.SaleService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
public class SaleController {

    private final SaleService service;

    public SaleController(SaleService service) {
        this.service = service;
    }

    @GetMapping
    public List<Sale> getAll(@RequestAttribute Long shopId) {
        return service.getAllSales(shopId);
    }

    @PostMapping
    public Sale save(@RequestAttribute Long shopId, @RequestBody Sale sale) {
        return service.saveSale(shopId, sale);
    }

    @GetMapping("/{id}")
    public Sale getById(@RequestAttribute Long shopId, @PathVariable Long id) {
        return service.getSaleById(shopId, id);
    }

    @PutMapping("/{id}")
    public Sale update(
            @RequestAttribute Long shopId,
            @PathVariable Long id,
            @RequestBody Sale sale) {

        return service.updateSale(shopId, id, sale);
    }

    @DeleteMapping("/{id}")
    public void delete(@RequestAttribute Long shopId, @PathVariable Long id) {
        service.deleteSale(shopId, id);
    }
}
