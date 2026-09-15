package com.dhanya.backend.repository;

import com.dhanya.backend.entity.FarmerAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FarmerAccountRepository extends JpaRepository<FarmerAccount, Long> {
}
