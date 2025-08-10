package com.pies.therapist.service;

import com.pies.audit.service.AuditLogService;
import com.pies.therapist.model.Therapist;
import com.pies.therapist.model.TherapistRole;
import com.pies.therapist.repository.TherapistRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


/**
 * Service class for Therapist entity operations.
 * Handles CRUD, soft delete, and audit logging.
 */
@Service
@RequiredArgsConstructor
public class TherapistService {

    private final TherapistRepository repo;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;


    /**
     * Creates and saves a therapist with hashed password.
     * Records audit log for creation.
     *
     * @param therapist Therapist entity with raw password.
     * @return Saved Therapist entity.
     */
    @Transactional
    public Therapist save(Therapist therapist) {
        if (therapist.getRawPassword() == null || therapist.getRawPassword().isBlank()) {
            throw new IllegalArgumentException("Password cannot be null or empty");
        }
        therapist.setPasswordHash(passwordEncoder.encode(therapist.getRawPassword()));
        Therapist saved = repo.save(therapist);
        auditLogService.record("CREATE", "Therapist", saved.getId());
        return saved;
    }

    /**
     * Updates an existing therapist by ID.
     * Only selected fields are updatable.
     * Records audit log for update.
     *
     * @param id     Therapist ID.
     * @param update Therapist data to update.
     * @return Updated Therapist entity.
     */
    @Transactional
    public Therapist update(Long id, Therapist update) {
        Therapist entity = findById(id);
        if (update.getFirstName() != null)
            entity.setFirstName(update.getFirstName());
        if (update.getLastName() != null)
            entity.setLastName(update.getLastName());
        if (update.getEmail() != null)
            entity.setEmail(update.getEmail());
        if (update.getPhoneNumber() != null)
            entity.setPhoneNumber(update.getPhoneNumber());
        if (update.getRawPassword() != null && !update.getRawPassword().isBlank()) {
            entity.setPasswordHash(passwordEncoder.encode(update.getRawPassword()));
        }
        if (update.getRole() != null) {
            if (entity.getRole() == TherapistRole.ADMIN && update.getRole() != TherapistRole.ADMIN) {
                long admins = repo.countByRoleAndActiveStatusTrue(TherapistRole.ADMIN);
                if (admins <= 1) {
                    throw new IllegalArgumentException("At least one admin must remain");
                }
            }
            entity.setRole(update.getRole());
        }
        Therapist saved = repo.save(entity);
        auditLogService.record("UPDATE", "Therapist", saved.getId());
        return saved;
    }

    /**
     * Retrieves a therapist by ID. Only returns active therapists.
     *
     * @param id Therapist ID.
     * @return Therapist entity.
     * @throws EntityNotFoundException if not found or inactive.
     */
    public Therapist findById(Long id) {
        Therapist therapist = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Therapist " + id + " not found"));
        if (!therapist.isActiveStatus()) {
            throw new EntityNotFoundException("Therapist " + id + " not found");
        }
        return therapist;
    }

    /**
     * Retrieves a page of active therapists, with optional search query.
     *
     * @param q        Search query (nullable).
     * @param pageable Paging information.
     * @return Page of Therapist entities.
     */
    public Page<Therapist> findActive(String q, Pageable pageable) {
        if (q == null || q.isBlank()) {
            return repo.findByActiveStatusTrue(pageable);
        }
        return repo.search(q, pageable);
    }

    /**
     * Soft deletes a therapist by setting activeStatus to false.
     * Records audit log for delete.
     *
     * @param id Therapist ID.
     */
    @Transactional
    public void delete(Long id) {
        Therapist therapist = findById(id);
        therapist.setActiveStatus(false);
        repo.save(therapist);
        auditLogService.record("DELETE", "Therapist", id);
    }

    /**
     * Retrieves all therapists (no filtering).
     * For admin/debug purposes.
     *
     * @return Iterable of Therapist entities.
     */
    public Iterable<Therapist> findAll() {
        return repo.findAll();
    }

    public List<Therapist> getAllActiveTherapists() {
        return repo.findByActiveStatusTrue();
    }

}
