package com.pies.appointment.repository;

import com.pies.appointment.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByTherapistIdAndActiveStatusTrueAndAppointmentTimeBetweenOrderByAppointmentTimeAsc(
            Long therapistId, LocalDateTime from, LocalDateTime to);

    List<Appointment> findByPatientIdAndActiveStatusTrueAndAppointmentTimeBetweenOrderByAppointmentTimeAsc(
            Long patientId, LocalDateTime from, LocalDateTime to);

    // ---- use COUNT(*) and return long ----
    @Query(value = """
        SELECT COUNT(*) 
        FROM appointments a
        WHERE a.therapist_id = :therapistId
          AND a.active_status = 1
          AND a.appointment_time < :newEnd
          AND TIMESTAMPADD(MINUTE, a.duration_minutes, a.appointment_time) > :newStart
        """, nativeQuery = true)
    long countTherapistOverlap(
            @Param("therapistId") Long therapistId,
            @Param("newStart") LocalDateTime newStart,
            @Param("newEnd") LocalDateTime newEnd);

    @Query(value = """
        SELECT COUNT(*) 
        FROM appointments a
        WHERE a.patient_id = :patientId
          AND a.active_status = 1
          AND a.appointment_time < :newEnd
          AND TIMESTAMPADD(MINUTE, a.duration_minutes, a.appointment_time) > :newStart
        """, nativeQuery = true)
    long countPatientOverlap(
            @Param("patientId") Long patientId,
            @Param("newStart") LocalDateTime newStart,
            @Param("newEnd") LocalDateTime newEnd);
}
