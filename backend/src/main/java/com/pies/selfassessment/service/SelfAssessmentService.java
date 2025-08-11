package com.pies.selfassessment.service;

import com.pies.audit.service.AuditLogService;
import com.pies.selfassessment.model.SelfAssessment;
import com.pies.selfassessment.repository.SelfAssessmentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SelfAssessmentService {

    private final SelfAssessmentRepository repo;
    private final AuditLogService audit;

    @Transactional
    public SelfAssessment save(SelfAssessment a) {
        var saved = repo.save(a);
        audit.record("CREATE", "SelfAssessment", saved.getId());
        return saved;
    }

    @Transactional
    public SelfAssessment update(Long id, SelfAssessment in) {
        var a = findById(id);
        if (in.getDateOfSession() != null) a.setDateOfSession(in.getDateOfSession());
        if (in.getGoalOfSession() != null) a.setGoalOfSession(in.getGoalOfSession());
        if (in.getAssessment() != null) a.setAssessment(in.getAssessment());
        if (in.getNotes() != null) a.setNotes(in.getNotes());
        var saved = repo.save(a);
        audit.record("UPDATE", "SelfAssessment", saved.getId());
        return saved;
    }

    public SelfAssessment findById(Long id) {
        var a = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Self assessment " + id + " not found"));
        if (!a.isActiveStatus()) {
            throw new EntityNotFoundException("Self assessment " + id + " not found");
        }
        return a;
    }

    public Page<SelfAssessment> findActive(String q, Pageable pageable) {
        if (q == null || q.isBlank()) return repo.findByActiveStatusTrue(pageable);
        return repo.search(q, pageable);
    }

    @Transactional
    public void delete(Long id) {
        var a = findById(id);
        a.setActiveStatus(false);
        repo.save(a);
        audit.record("DELETE", "SelfAssessment", id);
    }
}