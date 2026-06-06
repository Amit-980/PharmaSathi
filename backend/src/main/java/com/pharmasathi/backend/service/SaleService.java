package com.pharmasathi.backend.service;

import com.pharmasathi.backend.entity.Medicine;
import com.pharmasathi.backend.entity.Sale;
import com.pharmasathi.backend.repository.MedicineRepository;
import com.pharmasathi.backend.repository.SaleRepository;
import org.springframework.stereotype.Service;

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

    public Sale saveSale(Long shopId, Sale sale) {

        Medicine medicine = medicineRepository
                .findByIdAndShopId(sale.getMedicineId(), shopId)
                .orElseThrow(() ->
                        new RuntimeException("Medicine not found"));

        if (medicine.getStockQuantity() < sale.getQuantity()) {
            throw new RuntimeException("Insufficient stock");
        }

        medicine.setStockQuantity(
                medicine.getStockQuantity() - sale.getQuantity()
        );

        medicineRepository.save(medicine);

        sale.setId(null);
        sale.setShopId(shopId);
        return saleRepository.save(sale);
    }

    public Sale updateSale(Long shopId, Long id, Sale sale) {
        Sale existing = saleRepository.findByIdAndShopId(id, shopId).orElse(null);

        if (existing == null) {
            return null;
        }

        existing.setMedicineId(sale.getMedicineId());
        existing.setCustomerName(sale.getCustomerName());
        existing.setCustomerPhone(sale.getCustomerPhone());
        existing.setQuantity(sale.getQuantity());
        existing.setSellingPrice(sale.getSellingPrice());
        existing.setSaleDate(sale.getSaleDate());

        return saleRepository.save(existing);
    }

    public void deleteSale(Long shopId, Long id) {
        saleRepository.findByIdAndShopId(id, shopId).ifPresent(saleRepository::delete);
    }
}
