package com.pies.appointment.controller;

import com.pies.appointment.model.Appointment;
import com.pies.appointment.payload.AppointmentCreateRequest;
import com.pies.appointment.service.AppointmentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Tag(name = "Appointments")
@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService svc;

    public record SimpleResponse(String message) {
    }

    @PreAuthorize("hasAnyRole('JUNIOR', 'SENIOR', 'ADMIN')")
    @PostMapping
    public ResponseEntity<SimpleResponse> create(@RequestBody @Valid AppointmentCreateRequest req) {
        svc.create(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new SimpleResponse("Appointment created successfully"));
    }

    @PreAuthorize("hasAnyRole('JUNIOR', 'SENIOR', 'ADMIN')")
    @GetMapping("/therapist/{therapistId}")
    public List<Appointment> listByTherapist(@PathVariable Long therapistId,
                                             @RequestParam String from,
                                             @RequestParam String to) {
        return svc.listByTherapist(therapistId, LocalDateTime.parse(from), LocalDateTime.parse(to));
    }

    @PreAuthorize("hasAnyRole('JUNIOR', 'SENIOR', 'ADMIN')")
    @GetMapping("/patient/{patientId}")
    public List<Appointment> listByPatient(@PathVariable Long patientId,
                                           @RequestParam String from,
                                           @RequestParam String to) {
        return svc.listByPatient(patientId, LocalDateTime.parse(from), LocalDateTime.parse(to));
    }

    @PreAuthorize("hasAnyRole('SENIOR', 'ADMIN')")
    @DeleteMapping("{id}")
    public ResponseEntity<SimpleResponse> cancel(@PathVariable Long id) {
        svc.cancel(id);
        return ResponseEntity.ok(new SimpleResponse("Appointment cancelled successfully"));
    }
}