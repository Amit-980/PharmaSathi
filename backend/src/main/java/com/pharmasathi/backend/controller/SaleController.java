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
}