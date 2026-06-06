package com.pharmasathi.backend.controller;

import com.pharmasathi.backend.entity.Medicine;
import com.pharmasathi.backend.service.MedicineService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medicines")
public class MedicineController {

    private final MedicineService service;

    public MedicineController(MedicineService service) {
        this.service = service;
    }

    @GetMapping
    public List<Medicine> getAll(@RequestAttribute Long shopId) {
        return service.getAllMedicines(shopId);
    }

    @PostMapping
    public Medicine save(@RequestAttribute Long shopId, @RequestBody Medicine medicine) {
        return service.saveMedicine(shopId, medicine);
    }
@GetMapping("/{id}")
public Medicine getById(@RequestAttribute Long shopId, @PathVariable Long id) {
    return service.getMedicineById(shopId, id);
}


@PutMapping("/{id}")
public Medicine update(
        @RequestAttribute Long shopId,
        @PathVariable Long id,
        @RequestBody Medicine medicine) {

    return service.updateMedicine(shopId, id, medicine);
}

@DeleteMapping("/{id}")
public void delete(@RequestAttribute Long shopId, @PathVariable Long id) {
    service.deleteMedicine(shopId, id);
}

}
