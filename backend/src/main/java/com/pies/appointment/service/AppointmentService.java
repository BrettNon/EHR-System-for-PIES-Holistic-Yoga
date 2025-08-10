package com.pies.appointment.service;

import com.pies.appointment.model.Appointment;
import com.pies.appointment.payload.AppointmentCreateRequest;
import com.pies.appointment.repository.AppointmentRepository;
import com.pies.audit.service.AuditLogService;
import com.pies.patient.repository.PatientRepository;
import com.pies.therapist.repository.TherapistRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepo;
    private final TherapistRepository therapistRepo;
    private final PatientRepository patientRepo;
    private final AuditLogService audit;

    @Transactional
    public Appointment create(AppointmentCreateRequest req) {
        if (!therapistRepo.existsById(req.therapistId())) {
            throw new IllegalArgumentException("Therapist not found: " + req.therapistId());
        }
        if (!patientRepo.existsById(req.patientId())) {
            throw new IllegalArgumentException("Patient not found: " + req.patientId());
        }

        LocalDateTime start = req.appointmentTime();
        LocalDateTime end = start.plusMinutes(req.durationMinutes() == null ? 60 : req.durationMinutes());

        if (appointmentRepo.existsTherapistOverlap(req.therapistId(), start, end)) {
            throw new IllegalStateException("Therapist time conflict.");
        }
        if (appointmentRepo.existsPatientOverlap(req.patientId(), start, end)) {
            throw new IllegalStateException("Patient time conflict.");
        }

        Appointment a = new Appointment();
        a.setTherapistId(req.therapistId());
        a.setPatientId(req.patientId());
        a.setAppointmentTime(start);
        a.setDurationMinutes(req.durationMinutes() == null ? 60 : req.durationMinutes());
        a.setNotes(req.notes());
        a.setActiveStatus(true);
        Appointment saved = appointmentRepo.save(a);
        audit.record("CREATE", "Appointment", saved.getId());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Appointment> listByTherapist(Long therapistId, LocalDateTime from, LocalDateTime to) {
        return appointmentRepo.findByTherapistIdAndActiveStatusTrueAndAppointmentTimeBetweenOrderByAppointmentTimeAsc(therapistId, from, to);
    }

    @Transactional(readOnly = true)
    public List<Appointment> listByPatient(Long patientId, LocalDateTime from, LocalDateTime to) {
        return appointmentRepo.findByPatientIdAndActiveStatusTrueAndAppointmentTimeBetweenOrderByAppointmentTimeAsc(patientId, from, to);
    }

    @Transactional
    public void cancel(Long id) {
        Appointment a = findById(id);
        a.setActiveStatus(false);
        appointmentRepo.save(a);
        audit.record("DELETE", "Appointment", id);
    }

    public Appointment findById(Long id) {
        Appointment a = appointmentRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Appointment " + id + " not found"));
        if (!a.isActiveStatus()) {
            throw new EntityNotFoundException("Appointment " + id + " not found");
        }
        return a;
    }
}