package com.dhanya.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "FARMER_ACCOUNTS")
public class FarmerAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long farmerId;

    @Column(name = "FARMER_NAME", nullable = false)
    private String farmerName;

    @Column(name = "AADHAAR_NO", nullable = false)
    private String aadhaarNo;

    @Column(name = "PHONE_NO", nullable = false)
    private String phoneNo;

    @Column(name = "BANK_ACCOUNT", nullable = false)
    private String bankAccount;

    @Column(name = "IFSC_CODE", nullable = false)
    private String ifscCode;

    @Column(name = "VILLAGE", nullable = false)
    private String village;

    @Column(name = "PADDY_SOLD_QTL", nullable = false)
    private Double paddySoldQtl;

    @Column(name = "DBT_PAYABLE_AMOUNT", nullable = false)
    private Double dbtPayableAmount;

    @Column(name = "DBT_STATUS", nullable = false)
    private String dbtStatus;

    public FarmerAccount() {}

    public Long getFarmerId() { return farmerId; }
    public void setFarmerId(Long farmerId) { this.farmerId = farmerId; }
    public String getFarmerName() { return farmerName; }
    public void setFarmerName(String farmerName) { this.farmerName = farmerName; }
    public String getAadhaarNo() { return aadhaarNo; }
    public void setAadhaarNo(String aadhaarNo) { this.aadhaarNo = aadhaarNo; }
    public String getPhoneNo() { return phoneNo; }
    public void setPhoneNo(String phoneNo) { this.phoneNo = phoneNo; }
    public String getBankAccount() { return bankAccount; }
    public void setBankAccount(String bankAccount) { this.bankAccount = bankAccount; }
    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }
    public String getVillage() { return village; }
    public void setVillage(String village) { this.village = village; }
    public Double getPaddySoldQtl() { return paddySoldQtl; }
    public void setPaddySoldQtl(Double paddySoldQtl) { this.paddySoldQtl = paddySoldQtl; }
    public Double getDbtPayableAmount() { return dbtPayableAmount; }
    public void setDbtPayableAmount(Double dbtPayableAmount) { this.dbtPayableAmount = dbtPayableAmount; }
    public String getDbtStatus() { return dbtStatus; }
    public void setDbtStatus(String dbtStatus) { this.dbtStatus = dbtStatus; }
}
