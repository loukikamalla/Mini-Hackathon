package com.dhanya.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "MILL_PROFILES")
public class MillProfile {
    @Id
    @Column(name = "MILL_CODE")
    private String millCode;

    @Column(name = "MILL_NAME", nullable = false)
    private String millName;

    @Column(name = "MANAGER_NAME", nullable = false)
    private String managerName;

    @Column(name = "USERNAME", unique = true, nullable = false)
    private String username;

    @Column(name = "PASSWORD_HASH", nullable = false)
    private String passwordHash;

    @Column(name = "DISTRICT", nullable = false)
    private String district;

    @Column(name = "ALLOCATED_QUOTA_MT", nullable = false)
    private Integer allocatedQuotaMt;

    @Column(name = "STATUS", nullable = false)
    private String status;

    public MillProfile() {}

    public MillProfile(String millCode, String millName, String managerName, String username, String passwordHash, String district, Integer allocatedQuotaMt, String status) {
        this.millCode = millCode;
        this.millName = millName;
        this.managerName = managerName;
        this.username = username;
        this.passwordHash = passwordHash;
        this.district = district;
        this.allocatedQuotaMt = allocatedQuotaMt;
        this.status = status;
    }

    public String getMillCode() { return millCode; }
    public void setMillCode(String millCode) { this.millCode = millCode; }
    public String getMillName() { return millName; }
    public void setMillName(String millName) { this.millName = millName; }
    public String getManagerName() { return managerName; }
    public void setManagerName(String managerName) { this.managerName = managerName; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public Integer getAllocatedQuotaMt() { return allocatedQuotaMt; }
    public void setAllocatedQuotaMt(Integer allocatedQuotaMt) { this.allocatedQuotaMt = allocatedQuotaMt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
