package com.pies.therapist.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pies.therapist.model.Therapist;
import com.pies.therapist.payload.TherapistSummary;
import com.pies.therapist.service.TherapistService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * REST endpoints for Therapist CRUD operations.
 */
@Tag(name = "Therapists")
@RestController
@RequestMapping("/therapists")
@RequiredArgsConstructor
public class TherapistController {

    private final TherapistService svc;

    /** Simple response structure for standardized success messages. */
    public record SimpleResponse(String message) {
    }

    /**
     * Creates a new therapist.
     * 
     * @param t Therapist payload.
     * @return SimpleResponse or error message.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<SimpleResponse> create(@RequestBody @Valid Therapist t) {
        svc.save(t);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SimpleResponse("Therapist created successfully"));
    }

    /**
     * Updates an existing therapist by ID.
     * 
     * @param id Therapist ID.
     * @param t  Therapist payload.
     * @return SimpleResponse.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'SENIOR')")
    @PutMapping("{id}")
    public ResponseEntity<SimpleResponse> update(@PathVariable Long id, @RequestBody Therapist t) {
        svc.update(id, t);
        return ResponseEntity.ok(new SimpleResponse("Therapist updated successfully"));
    }

    /**
     * Retrieves a therapist by ID.
     * 
     * @param id Therapist ID.
     * @return Therapist entity.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'SENIOR')")
    @GetMapping("{id}")
    public Therapist get(@PathVariable Long id) {
        return svc.findById(id);
    }

    /**
     * Retrieves a paginated list of active therapists, with optional search.
     * 
     * @param page Page number.
     * @param size Page size.
     * @param q    Search query (optional).
     * @return Page of Therapist entities.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'SENIOR')")
    @GetMapping
    public Page<Therapist> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q) {
        Pageable pageable = PageRequest.of(page, size);
        return svc.findActive(q, pageable);
    }

    /**
     * Soft-deletes a therapist by ID.
     * 
     * @param id Therapist ID.
     * @return SimpleResponse.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("{id}")
    public ResponseEntity<SimpleResponse> delete(@PathVariable Long id) {
        svc.delete(id);
        return ResponseEntity.ok(new SimpleResponse("Therapist deleted successfully"));
    }
    @GetMapping("/active")
    public List<TherapistSummary> getActiveTherapists() {
        return svc.getAllActiveTherapists().stream()
            .map(t -> new TherapistSummary(t.getId(), t.getFirstName() + " " + t.getLastName()))
            .toList();
    }

}
