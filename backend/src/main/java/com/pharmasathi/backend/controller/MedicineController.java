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
    public List<Medicine> getAll() {
        return service.getAllMedicines();
    }

    @PostMapping
    public Medicine save(@RequestBody Medicine medicine) {
        return service.saveMedicine(medicine);
    }
@GetMapping("/{id}")
public Medicine getById(@PathVariable Long id) {
    return service.getMedicineById(id);
}


@PutMapping("/{id}")
public Medicine update(
        @PathVariable Long id,
        @RequestBody Medicine medicine) {

    return service.updateMedicine(id, medicine);
}

@DeleteMapping("/{id}")
public void delete(@PathVariable Long id) {
    service.deleteMedicine(id);
}

}