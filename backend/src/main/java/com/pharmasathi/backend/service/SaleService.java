package com.pharmasathi.backend.service;

import com.pharmasathi.backend.entity.Medicine;
import com.pharmasathi.backend.entity.Sale;
import com.pharmasathi.backend.repository.MedicineRepository;
import com.pharmasathi.backend.repository.SaleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SaleService {

    private final SaleRepository saleRepository;
    private final MedicineRepository medicineRepository;

    public SaleService(
            SaleRepository saleRepository,
            MedicineRepository medicineRepository) {

        this.saleRepository = saleRepository;
        this.medicineRepository = medicineRepository;
    }

    public List<Sale> getAllSales(Long shopId) {
        return saleRepository.findAllByShopIdOrderByIdDesc(shopId);
    }

    public Sale getSaleById(Long shopId, Long id) {
        return saleRepository.findByIdAndShopId(id, shopId).orElse(null);
    }

    @Transactional
    public Sale saveSale(Long shopId, Sale sale) {
        validate(sale);

        Medicine medicine = medicineRepository
                .findByIdAndShopId(sale.getMedicineId(), shopId)
                .orElseThrow(() ->
                        new RuntimeException("Medicine not found"));

        if (stock(medicine) < sale.getQuantity()) {
            throw new IllegalArgumentException("Insufficient stock");
        }

        medicine.setStockQuantity(
                stock(medicine) - sale.getQuantity()
        );

        medicineRepository.save(medicine);

        sale.setId(null);
        sale.setShopId(shopId);
        Sale saved = saleRepository.save(sale);
        if (saved.getInvoiceNumber() == null || saved.getInvoiceNumber().isBlank()) {
            saved.setInvoiceNumber("SALE-" + saved.getId());
        }
        defaults(saved);
        return saleRepository.save(saved);
    }

    @Transactional
    public Sale updateSale(Long shopId, Long id, Sale sale) {
        validate(sale);
        Sale existing = saleRepository.findByIdAndShopId(id, shopId).orElse(null);

        if (existing == null) {
            return null;
        }

        Medicine oldMedicine = medicineRepository.findByIdAndShopId(existing.getMedicineId(), shopId)
                .orElseThrow(() -> new IllegalStateException("Original medicine not found"));
        Medicine newMedicine = medicineRepository.findByIdAndShopId(sale.getMedicineId(), shopId)
                .orElseThrow(() -> new IllegalArgumentException("Medicine not found"));
        oldMedicine.setStockQuantity(stock(oldMedicine) + existing.getQuantity());
        if (stock(newMedicine) < sale.getQuantity()) {
            throw new IllegalArgumentException("Insufficient stock");
        }
        newMedicine.setStockQuantity(stock(newMedicine) - sale.getQuantity());
        medicineRepository.save(oldMedicine);
        medicineRepository.save(newMedicine);

        existing.setMedicineId(sale.getMedicineId());
        existing.setInvoiceNumber(sale.getInvoiceNumber());
        existing.setCustomerName(sale.getCustomerName());
        existing.setCustomerPhone(sale.getCustomerPhone());
        existing.setCustomerGstin(sale.getCustomerGstin());
        existing.setQuantity(sale.getQuantity());
        existing.setSellingPrice(sale.getSellingPrice());
        existing.setDiscountPercent(sale.getDiscountPercent());
        existing.setPaymentMode(sale.getPaymentMode());
        existing.setPaymentStatus(sale.getPaymentStatus());
        existing.setSaleDate(sale.getSaleDate());
        defaults(existing);

        return saleRepository.save(existing);
    }

    @Transactional
    public void deleteSale(Long shopId, Long id) {
        Sale sale = saleRepository.findByIdAndShopId(id, shopId).orElse(null);
        if (sale == null) return;
        Medicine medicine = medicineRepository.findByIdAndShopId(sale.getMedicineId(), shopId)
                .orElseThrow(() -> new IllegalStateException("Medicine not found"));
        medicine.setStockQuantity(stock(medicine) + sale.getQuantity());
        medicineRepository.save(medicine);
        saleRepository.delete(sale);
    }

    private void validate(Sale sale) {
        if (sale.getMedicineId() == null || sale.getQuantity() == null || sale.getQuantity() <= 0
                || sale.getSellingPrice() == null || sale.getSellingPrice() < 0
                || sale.getSaleDate() == null
                || sale.getCustomerPhone() == null || !sale.getCustomerPhone().matches("\\d{10}")) {
            throw new IllegalArgumentException("Valid customer phone, medicine, quantity, price and date are required");
        }
    }

    private void defaults(Sale sale) {
        sale.setCustomerName(sale.getCustomerName() == null ? "" : sale.getCustomerName().trim());
        sale.setCustomerGstin(sale.getCustomerGstin() == null ? "" : sale.getCustomerGstin().trim().toUpperCase());
        sale.setDiscountPercent(sale.getDiscountPercent() == null ? 0.0 : sale.getDiscountPercent());
        sale.setPaymentMode(sale.getPaymentMode() == null || sale.getPaymentMode().isBlank() ? "CASH" : sale.getPaymentMode());
        sale.setPaymentStatus(sale.getPaymentStatus() == null || sale.getPaymentStatus().isBlank() ? "PAID" : sale.getPaymentStatus());
    }

    private int stock(Medicine medicine) {
        return medicine.getStockQuantity() == null ? 0 : medicine.getStockQuantity();
    }
}
