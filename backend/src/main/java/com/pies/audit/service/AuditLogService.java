package com.pies.audit.service;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pies.audit.model.AuditLog;
import com.pies.audit.repository.AuditLogRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuditLogService {
    private final AuditLogRepository repo;

    @Transactional
    public void record(String action, String entity, Long entityId) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        String user = auth != null ? auth.getName() : "anonymous";
        AuditLog log = new AuditLog();
        log.setUsername(user);
        log.setAction(action);
        log.setEntity(entity);
        log.setEntityId(entityId);
        log.setTimestamp(java.time.LocalDateTime.now());
        repo.save(log);
    }
}