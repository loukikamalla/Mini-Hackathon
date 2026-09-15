package com.dhanya.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DhanyaApplication {
    public static void main(String[] args) {
        SpringApplication.run(DhanyaApplication.class, args);
        System.out.println("==========================================================");
        System.out.println("🌾 DHANYA Spring Boot Backend running on port 5000");
        System.out.println("📊 H2 Console: http://localhost:5000/h2-console");
        System.out.println("⚡ REST API: http://localhost:5000/api/v2/health");
        System.out.println("==========================================================");
    }
}
