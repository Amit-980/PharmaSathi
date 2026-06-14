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

    public List<Medicine> getAllMedicines(Long shopId) {
        return repository.findAllByShopIdOrderByIdDesc(shopId);
    }

    public Medicine saveMedicine(Long shopId, Medicine medicine) {
        validate(shopId, medicine, null);
        medicine.setId(null);
        medicine.setShopId(shopId);
        applyDefaults(medicine);
        return repository.save(medicine);
    }
public Medicine getMedicineById(Long shopId, Long id) {
    return repository.findByIdAndShopId(id, shopId).orElse(null);
}
public Medicine updateMedicine(Long shopId, Long id, Medicine medicine) {

    Medicine existing = repository.findByIdAndShopId(id, shopId).orElse(null);

    if (existing == null) {
        return null;
    }
    validate(shopId, medicine, id);

    existing.setName(medicine.getName());
    existing.setBrand(medicine.getBrand());
    existing.setSku(medicine.getSku());
    existing.setBarcode(medicine.getBarcode());
    existing.setHsnCode(medicine.getHsnCode());
    existing.setBatchNo(medicine.getBatchNo());
    existing.setUnit(medicine.getUnit());
    existing.setPackSize(medicine.getPackSize());
    existing.setExpiryDate(medicine.getExpiryDate());
    existing.setPurchasePrice(medicine.getPurchasePrice());
    existing.setWholesalePrice(medicine.getWholesalePrice());
    existing.setMrp(medicine.getMrp());
    existing.setGstRate(medicine.getGstRate());
    existing.setStockQuantity(medicine.getStockQuantity());
    existing.setMinimumStock(medicine.getMinimumStock());
    applyDefaults(existing);

    return repository.save(existing);
}

public void deleteMedicine(Long shopId, Long id) {
    repository.findByIdAndShopId(id, shopId).ifPresent(repository::delete);
}

private void validate(Long shopId, Medicine medicine, Long id) {
    if (medicine.getName() == null || medicine.getName().isBlank()
            || medicine.getBatchNo() == null || medicine.getBatchNo().isBlank()
            || medicine.getMrp() == null || medicine.getMrp() < 0
            || medicine.getStockQuantity() == null || medicine.getStockQuantity() < 0
            || medicine.getPackSize() != null && medicine.getPackSize() < 1) {
        throw new IllegalArgumentException("Valid medicine, batch, price and stock are required");
    }
    String sku = medicine.getSku();
    if (sku != null && !sku.isBlank()) {
        boolean duplicate = id == null
                ? repository.existsByShopIdAndSkuIgnoreCase(shopId, sku.trim())
                : repository.existsByShopIdAndSkuIgnoreCaseAndIdNot(shopId, sku.trim(), id);
        if (duplicate) throw new IllegalArgumentException("SKU already exists");
    }
}

private void applyDefaults(Medicine medicine) {
    medicine.setSku(text(medicine.getSku()));
    medicine.setBarcode(text(medicine.getBarcode()));
    medicine.setHsnCode(text(medicine.getHsnCode()));
    medicine.setUnit(medicine.getUnit() == null || medicine.getUnit().isBlank() ? "Strip" : medicine.getUnit().trim());
    medicine.setPackSize(medicine.getPackSize() == null ? 1 : medicine.getPackSize());
    medicine.setMinimumStock(medicine.getMinimumStock() == null ? 10 : medicine.getMinimumStock());
    medicine.setGstRate(medicine.getGstRate() == null ? 0.0 : medicine.getGstRate());
}

private String text(String value) {
    return value == null ? "" : value.trim();
}

}
