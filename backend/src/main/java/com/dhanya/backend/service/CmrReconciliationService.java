package com.dhanya.backend.service;

import com.dhanya.backend.entity.AuditLog;
import com.dhanya.backend.entity.CmrRecord;
import com.dhanya.backend.repository.AuditLogRepository;
import com.dhanya.backend.repository.CmrRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CmrReconciliationService {

    @Autowired
    private CmrRecordRepository cmrRecordRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    public List<CmrRecord> getRecordsByMill(String millCode) {
        if (millCode == null || millCode.trim().isEmpty() || "ALL".equalsIgnoreCase(millCode)) {
            return cmrRecordRepository.findAll();
        }
        return cmrRecordRepository.findByMillCode(millCode);
    }

    public Map<String, Object> calculateStatutorySettlement(String millCode) {
        List<CmrRecord> records = getRecordsByMill(millCode);

        double totalPaddyKg = 0.0;
        double totalVarianceKg = 0.0;
        int matches = 0;
        int mismatches = 0;

        for (CmrRecord r : records) {
            totalPaddyKg += r.getMillNetKg();
            totalVarianceKg += Math.abs(r.getNetVarianceKg());
            if ("MATCH".equalsIgnoreCase(r.getReconciliationFlag())) {
                matches++;
            } else {
                mismatches++;
            }
        }

        double totalPaddyQtl = totalPaddyKg / 100.0;
        // Statutory 67% CMR Out-turn ratio computation
        double cmr67TargetQtl = totalPaddyQtl * 0.67;

        // Statutory Subsidy Rates: Milling ₹10/Qtl, Handling ₹4.50/Qtl, Gunny bag ₹2.20/bag
        double millingSubsidy = totalPaddyQtl * 10.0;
        double handlingCharges = totalPaddyQtl * 4.50;
        double gunnyCredits = totalPaddyQtl * 4.40;
        double totalPayableSubsidy = millingSubsidy + handlingCharges + gunnyCredits;

        Map<String, Object> stats = new HashMap<>();
        stats.put("millCode", millCode);
        stats.put("totalPaddyKg", totalPaddyKg);
        stats.put("totalPaddyQtl", totalPaddyQtl);
        stats.put("cmr67TargetQtl", cmr67TargetQtl);
        stats.put("totalVarianceKg", totalVarianceKg);
        stats.put("matchedBatches", matches);
        stats.put("mismatchedBatches", mismatches);
        stats.put("millingSubsidyAmount", millingSubsidy);
        stats.put("handlingChargesAmount", handlingCharges);
        stats.put("gunnyCreditsAmount", gunnyCredits);
        stats.put("totalPayableSubsidy", totalPayableSubsidy);
        stats.put("approvalStatus", "CLEARED_FOR_PAYMENT");

        return stats;
    }

    public boolean resolveDispute(Long recordId, double agreedQuantity, String officerNotes) {
        return cmrRecordRepository.findById(recordId).map(record -> {
            record.setMillNetKg(agreedQuantity);
            record.setNetVarianceKg(record.getGovtNetKg() - agreedQuantity);
            record.setStatus("RESOLVED_BY_OFFICER");
            record.setReconciliationFlag("MATCH");
            cmrRecordRepository.save(record);

            auditLogRepository.save(new AuditLog("DISPUTE_RESOLVED", "Officer R. Kumar", "Resolved Record #" + recordId + " to " + agreedQuantity + " kg. Notes: " + officerNotes, "127.0.0.1"));
            return true;
        }).orElse(false);
    }
}
