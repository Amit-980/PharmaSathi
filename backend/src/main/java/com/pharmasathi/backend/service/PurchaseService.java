package com.pharmasathi.backend.service;

import com.pharmasathi.backend.entity.Medicine;
import com.pharmasathi.backend.entity.Purchase;
import com.pharmasathi.backend.repository.MedicineRepository;
import com.pharmasathi.backend.repository.PurchaseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public List<Purchase> getAllPurchases(Long shopId) {
        return purchaseRepository.findAllByShopIdOrderByIdDesc(shopId);
    }

    public Purchase getPurchaseById(Long shopId, Long id) {
        return purchaseRepository.findByIdAndShopId(id, shopId).orElse(null);
    }

    @Transactional
    public Purchase savePurchase(Long shopId, Purchase purchase) {
        validate(purchase);

        Medicine medicine = medicineRepository
                .findByIdAndShopId(purchase.getMedicineId(), shopId)
                .orElseThrow(() -> new IllegalArgumentException("Medicine not found"));
        if (purchase.getSupplierId() == null) {
            throw new IllegalArgumentException("Supplier is required");
        }

        medicine.setStockQuantity(stock(medicine) + purchase.getQuantity());
        medicine.setPurchasePrice(purchase.getPurchasePrice());
        medicineRepository.save(medicine);
        purchase.setId(null);
        purchase.setShopId(shopId);
        Purchase saved = purchaseRepository.save(purchase);
        if (saved.getInvoiceNumber() == null || saved.getInvoiceNumber().isBlank()) {
            saved.setInvoiceNumber("PUR-" + saved.getId());
        }
        defaults(saved);
        return purchaseRepository.save(saved);
    }

    @Transactional
    public Purchase updatePurchase(Long shopId, Long id, Purchase purchase) {
        validate(purchase);
        Purchase existing = purchaseRepository.findByIdAndShopId(id, shopId).orElse(null);

        if (existing == null) {
            return null;
        }

        Medicine oldMedicine = medicineRepository.findByIdAndShopId(existing.getMedicineId(), shopId)
                .orElseThrow(() -> new IllegalStateException("Original medicine not found"));
        Medicine newMedicine = medicineRepository.findByIdAndShopId(purchase.getMedicineId(), shopId)
                .orElseThrow(() -> new IllegalArgumentException("Medicine not found"));
        oldMedicine.setStockQuantity(stock(oldMedicine) - existing.getQuantity());
        if (oldMedicine.getStockQuantity() < 0) {
            throw new IllegalArgumentException("Purchase cannot be changed because its stock has already been sold");
        }
        newMedicine.setStockQuantity(stock(newMedicine) + purchase.getQuantity());
        medicineRepository.save(oldMedicine);
        medicineRepository.save(newMedicine);

        existing.setMedicineId(purchase.getMedicineId());
        existing.setSupplierId(purchase.getSupplierId());
        existing.setInvoiceNumber(purchase.getInvoiceNumber());
        existing.setQuantity(purchase.getQuantity());
        existing.setPurchasePrice(purchase.getPurchasePrice());
        existing.setDiscountPercent(purchase.getDiscountPercent());
        existing.setPaymentStatus(purchase.getPaymentStatus());
        existing.setPurchaseDate(purchase.getPurchaseDate());
        defaults(existing);

        return purchaseRepository.save(existing);
    }

    @Transactional
    public void deletePurchase(Long shopId, Long id) {
        Purchase purchase = purchaseRepository.findByIdAndShopId(id, shopId).orElse(null);
        if (purchase == null) return;
        Medicine medicine = medicineRepository.findByIdAndShopId(purchase.getMedicineId(), shopId)
                .orElseThrow(() -> new IllegalStateException("Medicine not found"));
        int adjusted = stock(medicine) - purchase.getQuantity();
        if (adjusted < 0) throw new IllegalArgumentException("Purchase cannot be deleted because its stock has already been sold");
        medicine.setStockQuantity(adjusted);
        medicineRepository.save(medicine);
        purchaseRepository.delete(purchase);
    }

    private void validate(Purchase purchase) {
        if (purchase.getMedicineId() == null || purchase.getSupplierId() == null
                || purchase.getQuantity() == null || purchase.getQuantity() <= 0
                || purchase.getPurchasePrice() == null || purchase.getPurchasePrice() < 0
                || purchase.getPurchaseDate() == null) {
            throw new IllegalArgumentException("Valid medicine, supplier, quantity, price and date are required");
        }
    }

    private void defaults(Purchase purchase) {
        purchase.setDiscountPercent(purchase.getDiscountPercent() == null ? 0.0 : purchase.getDiscountPercent());
        purchase.setPaymentStatus(purchase.getPaymentStatus() == null || purchase.getPaymentStatus().isBlank()
                ? "PAID" : purchase.getPaymentStatus());
    }

    private int stock(Medicine medicine) {
        return medicine.getStockQuantity() == null ? 0 : medicine.getStockQuantity();
    }
}
