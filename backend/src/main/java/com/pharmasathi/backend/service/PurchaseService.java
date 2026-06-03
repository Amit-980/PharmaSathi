package com.pharmasathi.backend.service;

import com.pharmasathi.backend.entity.Medicine;
import com.pharmasathi.backend.entity.Purchase;
import com.pharmasathi.backend.repository.MedicineRepository;
import com.pharmasathi.backend.repository.PurchaseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final MedicineRepository medicineRepository;

    public PurchaseService(
            PurchaseRepository purchaseRepository,
            MedicineRepository medicineRepository) {

        this.purchaseRepository = purchaseRepository;
        this.medicineRepository = medicineRepository;
    }

    public List<Purchase> getAllPurchases() {
        return purchaseRepository.findAll();
    }

    public Purchase getPurchaseById(Long id) {
        return purchaseRepository.findById(id).orElse(null);
    }

    public Purchase savePurchase(Purchase purchase) {

        Medicine medicine = medicineRepository
                .findById(purchase.getMedicineId())
                .orElse(null);

        if (medicine != null) {

            medicine.setStockQuantity(
                    medicine.getStockQuantity()
                            + purchase.getQuantity()
            );

            medicineRepository.save(medicine);
        }

        return purchaseRepository.save(purchase);
    }

    public Purchase updatePurchase(Long id, Purchase purchase) {
        Purchase existing = purchaseRepository.findById(id).orElse(null);

        if (existing == null) {
            return null;
        }

        existing.setMedicineId(purchase.getMedicineId());
        existing.setSupplierId(purchase.getSupplierId());
        existing.setQuantity(purchase.getQuantity());
        existing.setPurchasePrice(purchase.getPurchasePrice());
        existing.setPurchaseDate(purchase.getPurchaseDate());

        return purchaseRepository.save(existing);
    }

    public void deletePurchase(Long id) {
        purchaseRepository.deleteById(id);
    }
}