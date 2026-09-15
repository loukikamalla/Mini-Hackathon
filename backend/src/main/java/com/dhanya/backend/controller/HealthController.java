package com.dhanya.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v2/health")
@CrossOrigin(origins = "*")
public class HealthController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "DHANYA Spring Boot 3 REST API");
        health.put("database", "H2 In-Memory (jdbc:h2:mem:dhanyadb)");
        health.put("timestamp", LocalDateTime.now().toString());
        health.put("statutoryCompliance", "67% CMR Out-Turn Active");
        return ResponseEntity.ok(health);
    }
}
