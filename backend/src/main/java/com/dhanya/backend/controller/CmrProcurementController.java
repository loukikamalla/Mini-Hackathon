package com.dhanya.backend.controller;

import com.dhanya.backend.dto.ApiResponse;
import com.dhanya.backend.entity.CmrRecord;
import com.dhanya.backend.service.CmrReconciliationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v2/cmr-procurement")
@CrossOrigin(origins = "*")
public class CmrProcurementController {

    @Autowired
    private CmrReconciliationService reconciliationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CmrRecord>>> getProcurementData(@RequestParam(required = false, defaultValue = "ALL") String millCode) {
        List<CmrRecord> records = reconciliationService.getRecordsByMill(millCode);
        return ResponseEntity.ok(new ApiResponse<>(true, "Telangana OPMS Live Stream Synchronized", records));
    }

    @GetMapping("/settlement")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSettlementSummary(@RequestParam(required = false, defaultValue = "TS-WGL-MR-4412") String millCode) {
        Map<String, Object> stats = reconciliationService.calculateStatutorySettlement(millCode);
        return ResponseEntity.ok(new ApiResponse<>(true, "Statutory 67% CMR Settlement Computed", stats));
    }
}
