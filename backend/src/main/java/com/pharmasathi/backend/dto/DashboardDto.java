package com.pharmasathi.backend.dto;

public class DashboardDto {

    private long totalMedicines;
    private long totalSuppliers;
    private long totalPurchases;
    private long totalSales;

    public DashboardDto(
            long totalMedicines,
            long totalSuppliers,
            long totalPurchases,
            long totalSales) {

        this.totalMedicines = totalMedicines;
        this.totalSuppliers = totalSuppliers;
        this.totalPurchases = totalPurchases;
        this.totalSales = totalSales;
    }

    public long getTotalMedicines() {
        return totalMedicines;
    }

    public long getTotalSuppliers() {
        return totalSuppliers;
    }

    public long getTotalPurchases() {
        return totalPurchases;
    }

    public long getTotalSales() {
        return totalSales;
    }
}