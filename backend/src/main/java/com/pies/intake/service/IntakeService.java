package com.pies.intake.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pies.audit.service.AuditLogService;
import com.pies.intake.model.IntakeForm;
import com.pies.intake.model.IntakeFormHealthHistory;
import com.pies.intake.repository.IntakeFormHealthHistoryRepository;
import com.pies.intake.repository.IntakeRepository;
import com.pies.patient.repository.PatientRepository;
import com.pies.therapist.repository.TherapistRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

/**
 * Service class for managing intake forms and their health history.
 * Handles CRUD operations, patient linking, health history association, and
 * audit logging.
 */
@Service
@RequiredArgsConstructor
public class IntakeService {

    private final IntakeRepository intakeRepository;
    private final AuditLogService auditLogService;
    private final IntakeFormHealthHistoryRepository healthHistoryRepository;
    private final PatientRepository patientRepository;
    private final TherapistRepository therapistRepository;

    /**
     * Creates and persists an intake form and its associated health history.
     * Saves a new patient entity if one does not already exist.
     * Records an audit log for the creation.
     *
     * @param form          the IntakeForm entity to be saved
     * @param healthHistory the associated IntakeFormHealthHistory entity (can be
     *                      null)
     * @return the saved IntakeForm entity
     */

    public IntakeForm save(IntakeForm form, IntakeFormHealthHistory history) {
        System.out.println(">>> IntakeService.save() called");
        System.out.println(">>> IntakeForm: " + form);
        System.out.println(">>> HealthHistory: " + history);

        try {
            // Save Patient first if needed
            patientRepository.save(form.getPatient());

            // Save IntakeForm
            IntakeForm savedForm = intakeRepository.save(form);

            // Link health history if present
            if (history != null) {
                history.setIntakeForm(savedForm);
                healthHistoryRepository.save(history);
            }

            return savedForm;
        } catch (Exception e) {
            System.out.println(">>> ERROR during save: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

     /* 
    @Transactional
    public IntakeForm save(IntakeForm form, IntakeFormHealthHistory healthHistory) {
        System.out.println(">>> Saving IntakeForm: " + form);
        // Save patient entity if not persisted yet
        if (form.getPatient() != null && form.getPatient().getId() == null) {
            Patient savedPatient = patientRepository.save(form.getPatient());
            form.setPatient(savedPatient);
        }
        // Save intake form
        IntakeForm savedForm = intakeRepository.save(form);

        // Link and save health history if provided
        if (healthHistory != null) {
            healthHistory.setIntakeForm(savedForm);
            healthHistoryRepository.save(healthHistory);
        }     
        auditLogService.record("CREATE", "IntakeForm", savedForm.getId());
        return savedForm;
    }*/

    /**
     * Saves a standalone intake form (no health history mapping).
     * Used for backward compatibility.
     *
     * @param form the IntakeForm entity to be saved
     * @return the saved IntakeForm entity
     */
    @Transactional
    public IntakeForm save(IntakeForm form) {
        IntakeForm saved = intakeRepository.save(form);
        auditLogService.record("CREATE", "IntakeForm", saved.getId());
        return saved;
    }

    /**
     * Updates an existing intake form by ID.
     * Only select fields are updated (currently: practicedYogaBefore,
     * yogaFrequency).
     * Records an audit log for the update.
     *
     * @param id   the ID of the intake form to update
     * @param form the IntakeForm data to update
     * @return the updated IntakeForm entity
     */
    @Transactional
    public IntakeForm update(Long id, IntakeForm form) {
        IntakeForm entity = findById(id);
        if (form.getPracticedYogaBefore() != null) {
            entity.setPracticedYogaBefore(form.getPracticedYogaBefore());
        }
        if (form.getYogaFrequency() != null) {
            entity.setYogaFrequency(form.getYogaFrequency());
        }
        IntakeForm saved = intakeRepository.save(entity);
        auditLogService.record("UPDATE", "IntakeForm", saved.getId());
        return saved;
    }

    /**
     * Retrieves an intake form by its ID.
     * Only returns forms with activeStatus == true.
     *
     * @param id the ID of the intake form
     * @return the IntakeForm entity
     * @throws EntityNotFoundException if not found or inactive
     */
    public IntakeForm findById(Long id) {
        IntakeForm entity = intakeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("IntakeForm with id " + id + " not found"));
        if (!entity.isActiveStatus()) {
            throw new EntityNotFoundException("IntakeForm with id " + id + " not found");
        }
        return entity;
    }

    /**
     * Retrieves a page of active intake forms, optionally filtered by search query.
     *
     * @param query    the search query (nullable)
     * @param pageable pagination information
     * @return a page of IntakeForm entities
     */
    public Page<IntakeForm> findActive(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return intakeRepository.findByActiveStatusTrue(pageable);
        }
        return intakeRepository.search(query, pageable);
    }

    /**
     * Retrieves all intake forms.
     * Used primarily for admin/debug purposes (no paging).
     *
     * @return all IntakeForm entities
     */
    public Iterable<IntakeForm> findAll() {
        return intakeRepository.findAll();
    }

    /**
     * Soft-deletes an intake form by marking activeStatus as false.
     * Records an audit log for the delete operation.
     *
     * @param id the ID of the intake form to delete
     */
    @Transactional
    public void delete(Long id) {
        IntakeForm entity = findById(id);
        entity.setActiveStatus(false);
        intakeRepository.save(entity);
        auditLogService.record("DELETE", "IntakeForm", id);
    }

    /**
     * Saves only a health history record (utility method).
     *
     * @param healthHistory the IntakeFormHealthHistory entity to save
     */
    @Transactional
    public void saveHealthHistory(IntakeFormHealthHistory healthHistory) {
        healthHistoryRepository.save(healthHistory);
    }
}
