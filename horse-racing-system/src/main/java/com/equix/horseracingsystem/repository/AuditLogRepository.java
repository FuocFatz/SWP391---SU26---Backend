package com.equix.horseracingsystem.repository;

import com.equix.horseracingsystem.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    // Lọc theo loại thực thể bị tác động (Ví dụ: SYSTEM_SETTING, HORSE)
    Page<AuditLog> findByEntityType(String entityType, Pageable pageable);

    // Lọc theo ID người thực hiện
    Page<AuditLog> findByUserId(Long userId, Pageable pageable);
}