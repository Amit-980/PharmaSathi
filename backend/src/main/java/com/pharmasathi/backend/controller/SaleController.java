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
    public List<Sale> getAll() {
        return service.getAllSales();
    }

    @PostMapping
    public Sale save(@RequestBody Sale sale) {
        return service.saveSale(sale);
    }

    @GetMapping("/{id}")
    public Sale getById(@PathVariable Long id) {
        return service.getSaleById(id);
    }

    @PutMapping("/{id}")
    public Sale update(
            @PathVariable Long id,
            @RequestBody Sale sale) {

        return service.updateSale(id, sale);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteSale(id);
    }
}