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

    @Query("""
              SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
              FROM Appointment a
              WHERE a.therapistId = :therapistId
                AND a.activeStatus = true
                AND a.appointmentTime < :newEnd
                AND FUNCTION('DATE_ADD', a.appointmentTime, FUNCTION('INTERVAL', a.durationMinutes, 'MINUTE')) > :newStart
            """)
    boolean existsTherapistOverlap(
            @Param("therapistId") Long therapistId,
            @Param("newStart") LocalDateTime newStart,
            @Param("newEnd") LocalDateTime newEnd);

    @Query("""
              SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
              FROM Appointment a
              WHERE a.patientId = :patientId
                AND a.activeStatus = true
                AND a.appointmentTime < :newEnd
                AND FUNCTION('DATE_ADD', a.appointmentTime, FUNCTION('INTERVAL', a.durationMinutes, 'MINUTE')) > :newStart
            """)
    boolean existsPatientOverlap(
            @Param("patientId") Long patientId,
            @Param("newStart") LocalDateTime newStart,
            @Param("newEnd") LocalDateTime newEnd);
}