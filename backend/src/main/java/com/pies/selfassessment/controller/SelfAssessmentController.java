package com.pies.selfassessment.controller;

import com.pies.patient.model.Patient;
import com.pies.patient.repository.PatientRepository;
import com.pies.selfassessment.model.SelfAssessment;
import com.pies.selfassessment.payload.SelfAssessmentRequest;
import com.pies.selfassessment.service.SelfAssessmentService;
import com.pies.therapist.model.Therapist;
import com.pies.therapist.repository.TherapistRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@Tag(name = "SelfAssessments")
@RestController
@RequestMapping("/self-assessments")
@RequiredArgsConstructor
public class SelfAssessmentController {

    private final SelfAssessmentService svc;
    private final PatientRepository patientRepo;
    private final TherapistRepository therapistRepo;

    /**
     * Simple response structure for success messages.
     */
    public record SimpleResponse(String message) {
    }

    /**
     * Create a new self-assessment. All therapist roles can do this.
     */
    @PreAuthorize("hasAnyRole('JUNIOR', 'SENIOR', 'ADMIN')")
    @PostMapping
    public ResponseEntity<SimpleResponse> create(@RequestBody @Valid SelfAssessmentRequest req) {
        Patient patient = patientRepo.findById(req.getPatientId())
                .orElseThrow(() -> new EntityNotFoundException("Patient " + req.getPatientId() + " not found"));
        Therapist therapist = therapistRepo.findById(req.getTherapistId())
                .orElseThrow(() -> new EntityNotFoundException("Therapist " + req.getTherapistId() + " not found"));

        SelfAssessment a = new SelfAssessment();
        a.setPatient(patient);
        a.setTherapist(therapist);
        a.setDateOfSession(LocalDate.parse(req.getDateOfSession()));
        a.setGoalOfSession(req.getGoalOfSession());
        a.setAssessment(req.getAssessment());
        a.setNotes(req.getNotes());

        svc.save(a);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SimpleResponse("Self assessment created successfully"));
    }


    /**
     * Update an existing self-assessment. Only SENIOR or ADMIN.
     */
    @PreAuthorize("hasAnyRole('SENIOR', 'ADMIN')")
    @PutMapping("{id}")
    public ResponseEntity<SimpleResponse> update(@PathVariable Long id, @RequestBody SelfAssessment a) {
        svc.update(id, a);
        return ResponseEntity.ok(new SimpleResponse("Self assessment updated successfully"));
    }

    /**
     * Retrieve a self-assessment by ID. All therapist roles can view.
     */
    @PreAuthorize("hasAnyRole('JUNIOR', 'SENIOR', 'ADMIN')")
    @GetMapping("{id}")
    public SelfAssessment get(@PathVariable Long id) {
        return svc.findById(id);
    }

    /**
     * List all active self-assessments with optional search and paging.
     */
    @PreAuthorize("hasAnyRole('JUNIOR', 'SENIOR', 'ADMIN')")
    @GetMapping
    public Page<SelfAssessment> list(@RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "10") int size,
                                     @RequestParam(required = false) String q) {
        Pageable pageable = PageRequest.of(page, size);
        return svc.findActive(q, pageable);
    }

    /**
     * Soft-delete a self-assessment. Only SENIOR or ADMIN.
     */
    @PreAuthorize("hasAnyRole('SENIOR', 'ADMIN')")
    @DeleteMapping("{id}")
    public ResponseEntity<SimpleResponse> delete(@PathVariable Long id) {
        svc.delete(id);
        return ResponseEntity.ok(new SimpleResponse("Self assessment deleted successfully"));
    }
}
