package com.dhanya.backend.controller;

import com.dhanya.backend.dto.ApiResponse;
import com.dhanya.backend.service.CmrReconciliationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v2/disputes")
@CrossOrigin(origins = "*")
public class DisputeController {

    @Autowired
    private CmrReconciliationService reconciliationService;

    @PostMapping("/resolve")
    public ResponseEntity<ApiResponse<String>> resolveDispute(@RequestBody Map<String, Object> payload) {
        Long recordId = Long.valueOf(payload.get("recordId").toString());
        double agreedQuantity = Double.parseDouble(payload.get("agreedQuantity").toString());
        String notes = payload.getOrDefault("notes", "Joint inspection agreed metric").toString();

        boolean success = reconciliationService.resolveDispute(recordId, agreedQuantity, notes);
        if (success) {
            return ResponseEntity.ok(new ApiResponse<>(true, "Dispute resolved and re-calibrated successfully", "RECORD_" + recordId));
        }
        return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Record not found", null));
    }
}
