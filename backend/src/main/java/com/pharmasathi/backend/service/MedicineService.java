package com.pharmasathi.backend.service;

import com.pharmasathi.backend.entity.Medicine;
import com.pharmasathi.backend.repository.MedicineRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MedicineService {

    private final MedicineRepository repository;

    public MedicineService(MedicineRepository repository) {
        this.repository = repository;
    }

    public List<Medicine> getAllMedicines() {
        return repository.findAll();
    }

    public Medicine saveMedicine(Medicine medicine) {
        return repository.save(medicine);
    }
public Medicine getMedicineById(Long id) {
    return repository.findById(id).orElse(null);
}
public Medicine updateMedicine(Long id, Medicine medicine) {

    Medicine existing = repository.findById(id).orElse(null);

    if (existing == null) {
        return null;
    }

    existing.setName(medicine.getName());
    existing.setBrand(medicine.getBrand());
    existing.setBatchNo(medicine.getBatchNo());
    existing.setExpiryDate(medicine.getExpiryDate());
    existing.setMrp(medicine.getMrp());
    existing.setGstRate(medicine.getGstRate());
    existing.setStockQuantity(medicine.getStockQuantity());

    return repository.save(existing);
}

public void deleteMedicine(Long id) {
    repository.deleteById(id);
}

}
