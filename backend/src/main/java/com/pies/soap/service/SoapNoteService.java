package com.pies.soap.service;

import com.pies.audit.service.AuditLogService;
import com.pies.soap.model.SoapNote;
import com.pies.soap.repository.SoapNoteRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SoapNoteService {
    private static final Logger logger = LoggerFactory.getLogger(SoapNoteService.class);
    private final SoapNoteRepository repo;
    private final AuditLogService audit;

    /*
    @Transactional
    public SoapNote save(SoapNote n) {
        var saved = repo.save(n);
        audit.record("CREATE", "SoapNote", saved.getId());
        return saved;
    }*/

    @Transactional
    public SoapNote update(Long id, SoapNote in) {
        var n = findById(id);
        if (in.getDateOfSession() != null) n.setDateOfSession(in.getDateOfSession());
        if (in.getSessionLength() != null) n.setSessionLength(in.getSessionLength());
        if (in.getTimeOfSession() != null) n.setTimeOfSession(in.getTimeOfSession());
        if (in.getTypeOfSession() != null) n.setTypeOfSession(in.getTypeOfSession());
        if (in.getSNotes() != null) n.setSNotes(in.getSNotes());
        if (in.getONotes() != null) n.setONotes(in.getONotes());
        if (in.getANotes() != null) n.setANotes(in.getANotes());
        if (in.getPNotes() != null) n.setPNotes(in.getPNotes());
        if (in.getConditions() != null) n.setConditions(in.getConditions());
        if (in.getMedications() != null) n.setMedications(in.getMedications());
        if (in.getMedicationNote() != null) n.setMedicationNote(in.getMedicationNote());
        if (in.getGoals() != null) n.setGoals(in.getGoals());
        if (in.getDiet() != null) n.setDiet(in.getDiet());
        if (in.getActivityLevel() != null) n.setActivityLevel(in.getActivityLevel());
        if (in.getHistoryOfConditions() != null) n.setHistoryOfConditions(in.getHistoryOfConditions());
        if (in.getQuickNotes() != null) n.setQuickNotes(in.getQuickNotes());
        if (in.getAge() != null) n.setAge(in.getAge());

        var saved = repo.save(n);
        audit.record("UPDATE", "SoapNote", saved.getId());
        return saved;
    }

    public SoapNote findById(Long id) {
        var n = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("SOAP note " + id + " not found"));
        if (!n.isActiveStatus()) {
            throw new EntityNotFoundException("SOAP note " + id + " not found");
        }
        return n;
    }

    public Page<SoapNote> findActive(String q, Pageable pageable) {
        if (q == null || q.isBlank()) return repo.findByActiveStatusTrue(pageable);
        return repo.search(q, pageable);
    }

    @Transactional
    public void delete(Long id) {
        var n = findById(id);
        n.setActiveStatus(false);
        repo.save(n);
        audit.record("DELETE", "SoapNote", id);
    }

    @Transactional
    public SoapNote save(SoapNote n) {
        try {
            var saved = repo.save(n);
            audit.record("CREATE", "SoapNote", saved.getId());
            return saved;
        } catch (DataIntegrityViolationException ex) {
            logger.error("DataIntegrityViolationException: {}", ex.getMessage(), ex);
            throw ex;  // Let global handler respond
        }
    }
}