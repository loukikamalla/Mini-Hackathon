package com.dhanya.backend.repository;

import com.dhanya.backend.entity.CmrRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CmrRecordRepository extends JpaRepository<CmrRecord, Long> {
    List<CmrRecord> findByMillCode(String millCode);
    List<CmrRecord> findByStatus(String status);
}
