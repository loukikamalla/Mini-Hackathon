package com.dhanya.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "DHANYA_CMR_RECORDS")
public class CmrRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "TRUCK_NO", nullable = false)
    private String truckNo;

    @Column(name = "PASS_NO", nullable = false)
    private String passNo;

    @Column(name = "MILL_CODE", nullable = false)
    private String millCode;

    @Column(name = "FARMER_NAME", nullable = false)
    private String farmerName;

    @Column(name = "FARMER_AADHAAR", nullable = false)
    private String farmerAadhaar;

    @Column(name = "PADDY_VARIETY", nullable = false)
    private String paddyVariety;

    @Column(name = "GOVT_GROSS_KG", nullable = false)
    private Double govtGrossKg;

    @Column(name = "GOVT_TARE_KG", nullable = false)
    private Double govtTareKg;

    @Column(name = "GOVT_NET_KG", nullable = false)
    private Double govtNetKg;

    @Column(name = "MILL_GROSS_KG", nullable = false)
    private Double millGrossKg;

    @Column(name = "MILL_TARE_KG", nullable = false)
    private Double millTareKg;

    @Column(name = "MILL_NET_KG", nullable = false)
    private Double millNetKg;

    @Column(name = "MOISTURE_PERCENT", nullable = false)
    private Double moisturePercent;

    @Column(name = "NET_VARIANCE_KG", nullable = false)
    private Double netVarianceKg;

    @Column(name = "STATUS", nullable = false)
    private String status;

    @Column(name = "RECONCILIATION_FLAG", nullable = false)
    private String reconciliationFlag;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt = LocalDateTime.now();

    public CmrRecord() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTruckNo() { return truckNo; }
    public void setTruckNo(String truckNo) { this.truckNo = truckNo; }
    public String getPassNo() { return passNo; }
    public void setPassNo(String passNo) { this.passNo = passNo; }
    public String getMillCode() { return millCode; }
    public void setMillCode(String millCode) { this.millCode = millCode; }
    public String getFarmerName() { return farmerName; }
    public void setFarmerName(String farmerName) { this.farmerName = farmerName; }
    public String getFarmerAadhaar() { return farmerAadhaar; }
    public void setFarmerAadhaar(String farmerAadhaar) { this.farmerAadhaar = farmerAadhaar; }
    public String getPaddyVariety() { return paddyVariety; }
    public void setPaddyVariety(String paddyVariety) { this.paddyVariety = paddyVariety; }
    public Double getGovtGrossKg() { return govtGrossKg; }
    public void setGovtGrossKg(Double govtGrossKg) { this.govtGrossKg = govtGrossKg; }
    public Double getGovtTareKg() { return govtTareKg; }
    public void setGovtTareKg(Double govtTareKg) { this.govtTareKg = govtTareKg; }
    public Double getGovtNetKg() { return govtNetKg; }
    public void setGovtNetKg(Double govtNetKg) { this.govtNetKg = govtNetKg; }
    public Double getMillGrossKg() { return millGrossKg; }
    public void setMillGrossKg(Double millGrossKg) { this.millGrossKg = millGrossKg; }
    public Double getMillTareKg() { return millTareKg; }
    public void setMillTareKg(Double millTareKg) { this.millTareKg = millTareKg; }
    public Double getMillNetKg() { return millNetKg; }
    public void setMillNetKg(Double millNetKg) { this.millNetKg = millNetKg; }
    public Double getMoisturePercent() { return moisturePercent; }
    public void setMoisturePercent(Double moisturePercent) { this.moisturePercent = moisturePercent; }
    public Double getNetVarianceKg() { return netVarianceKg; }
    public void setNetVarianceKg(Double netVarianceKg) { this.netVarianceKg = netVarianceKg; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getReconciliationFlag() { return reconciliationFlag; }
    public void setReconciliationFlag(String reconciliationFlag) { this.reconciliationFlag = reconciliationFlag; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
