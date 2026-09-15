package com.dhanya.backend.repository;

import com.dhanya.backend.entity.MillProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface MillProfileRepository extends JpaRepository<MillProfile, String> {
    Optional<MillProfile> findByUsername(String username);
    Optional<MillProfile> findByMillCode(String millCode);
}
