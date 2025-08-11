package com.pies.soap.controller;

import com.pies.patient.model.Patient;
import com.pies.patient.repository.PatientRepository;
import com.pies.soap.model.SoapNote;
import com.pies.soap.payload.SoapNoteRequest;
import com.pies.soap.service.SoapNoteService;
import com.pies.therapist.model.Therapist;
import com.pies.therapist.repository.TherapistRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Tag(name = "SoapNotes")
@RestController
@RequestMapping("/soap-notes")
@RequiredArgsConstructor
public class SoapNoteController {
    private static final Logger logger = LoggerFactory.getLogger(SoapNoteController.class);

    private final SoapNoteService svc;
    private final PatientRepository patientRepo;
    private final TherapistRepository therapistRepo;


    /**
     * Simple response structure for success messages.
     */
    public record SimpleResponse(String message) {
    }

    /**
     * Create a new SOAP note. JUNIOR, SENIOR, and ADMIN roles allowed.
     */
    @Operation(summary = "Create a new SOAP note", requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            content = @Content(schema = @Schema(implementation = SoapNoteRequest.class))
    ))
    @PreAuthorize("hasAnyRole('JUNIOR', 'SENIOR', 'ADMIN')")
    @PostMapping
    public ResponseEntity<SimpleResponse> create(@RequestBody @Valid SoapNoteRequest req) {
        Patient patient = patientRepo.findById(req.getPatientId())
                .orElseThrow(() -> new EntityNotFoundException("Patient not found with ID " + req.getPatientId()));
        Therapist therapist = therapistRepo.findById(req.getTherapistId())
                .orElseThrow(() -> new EntityNotFoundException("Therapist not found with ID " + req.getTherapistId()));
        logger.info("Received request: patientId={}, therapistId={}", req.getPatientId(), req.getTherapistId());

        SoapNote note = new SoapNote();
        note.setPatient(patient);
        note.setTherapist(therapist);
        note.setDateOfSession(LocalDate.parse(req.getDateOfSession()));
        note.setTimeOfSession(LocalTime.parse(req.getTimeOfSession()));
        note.setSessionLength(req.getSessionLength());
        note.setTypeOfSession(req.getTypeOfSession());
        note.setSNotes(req.getSnotes());
        note.setONotes(req.getOnotes());
        note.setANotes(req.getAnotes());
        note.setPNotes(req.getPnotes());
        note.setConditions(req.getConditions());
        note.setMedications(req.getMedications());
        note.setMedicationNote(req.getMedicationNote());
        note.setGoals(req.getGoals());
        note.setDiet(req.getDiet());
        note.setActivityLevel(req.getActivityLevel());
        note.setHistoryOfConditions(req.getHistoryOfConditions());
        note.setQuickNotes(req.getQuickNotes());
        note.setAge(req.getAge());
        note.setActiveStatus(req.isActiveStatus());

        svc.save(note);
        logger.info("Saving SOAP note with patient ID: {}", note.getPatient().getId());
        logger.info("Therapist ID: {}", note.getTherapist().getId());


        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SimpleResponse("SOAP note created successfully"));
    }


    /**
     * Update an existing SOAP note. Only SENIOR and ADMIN allowed.
     */
    @PreAuthorize("hasAnyRole('SENIOR', 'ADMIN')")
    @PutMapping("{id}")
    public ResponseEntity<SimpleResponse> update(@PathVariable Long id, @RequestBody SoapNote n) {
        svc.update(id, n);
        return ResponseEntity.ok(new SimpleResponse("SOAP note updated successfully"));
    }

    /**
     * Get a SOAP note by ID. All roles can view.
     */
    @PreAuthorize("hasAnyRole('JUNIOR', 'SENIOR', 'ADMIN')")
    @GetMapping("{id}")
    public SoapNote get(@PathVariable Long id) {
        return svc.findById(id);
    }

    /**
     * List all active SOAP notes. All roles can view their assigned data.
     */
    @PreAuthorize("hasAnyRole('JUNIOR', 'SENIOR', 'ADMIN')")
    @GetMapping
    public Page<SoapNote> list(@RequestParam(defaultValue = "0") int page,
                               @RequestParam(defaultValue = "10") int size,
                               @RequestParam(required = false) String q) {
        Pageable pageable = PageRequest.of(page, size);
        return svc.findActive(q, pageable);
    }

    /**
     * Soft-delete a SOAP note by ID. Only SENIOR and ADMIN allowed.
     */
    @PreAuthorize("hasAnyRole('SENIOR', 'ADMIN')")
    @DeleteMapping("{id}")
    public ResponseEntity<SimpleResponse> delete(@PathVariable Long id) {
        svc.delete(id);
        return ResponseEntity.ok(new SimpleResponse("SOAP note deleted successfully"));
    }
}
