package com.dhanya.backend.service;

import com.dhanya.backend.dto.LoginRequest;
import com.dhanya.backend.dto.LoginResponse;
import com.dhanya.backend.entity.AuditLog;
import com.dhanya.backend.entity.MillProfile;
import com.dhanya.backend.repository.AuditLogRepository;
import com.dhanya.backend.repository.MillProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private MillProfileRepository millProfileRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    public LoginResponse authenticate(LoginRequest request) {
        if (request == null || request.getUsername() == null || request.getPassword() == null) {
            return new LoginResponse(false, "Invalid credentials provided", null, null, null, null, null);
        }

        String user = request.getUsername().trim();
        String pass = request.getPassword().trim();

        // 1. Civil Supplies Officer Authentication
        if (("dcso.wgl@telangana.gov.in".equalsIgnoreCase(user) || "dcso".equalsIgnoreCase(user)) && "Govt@Civil2025".equals(pass)) {
            auditLogRepository.save(new AuditLog("OFFICER_LOGIN", "DCSO R. Kumar", "DCSO logged into Warangal District Oversight", "127.0.0.1"));
            return new LoginResponse(true, "DCSO Authentication Successful", "GOVT-TOKEN-" + UUID.randomUUID(), "GOVERNMENT_OFFICER", null, "Warangal District Civil Supplies Oversight", "Officer R. Kumar (DCSO)");
        }

        // 2. Miller Manager Accounts
        Optional<MillProfile> profileOpt = millProfileRepository.findByUsername(user);
        if (!profileOpt.isPresent()) {
            profileOpt = millProfileRepository.findByMillCode(user);
        }

        if (profileOpt.isPresent()) {
            MillProfile p = profileOpt.get();
            if (pass.equals(p.getPasswordHash())) {
                auditLogRepository.save(new AuditLog("MILLER_LOGIN", p.getManagerName(), "Miller logged in for " + p.getMillName(), "127.0.0.1"));
                return new LoginResponse(true, "Miller Authentication Successful", "MILLER-TOKEN-" + UUID.randomUUID(), "RICE_MILLER", p.getMillCode(), p.getMillName(), p.getManagerName());
            }
        }

        return new LoginResponse(false, "Invalid username or password", null, null, null, null, null);
    }
}
