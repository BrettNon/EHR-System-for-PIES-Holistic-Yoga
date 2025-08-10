package com.pies.appointment.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long id;

    @Column(name = "therapist_id", nullable = false)
    @NotNull
    private Long therapistId;

    @Column(name = "patient_id", nullable = false)
    @NotNull
    private Long patientId;

    @Column(name = "appointment_time", nullable = false)
    @NotNull
    private LocalDateTime appointmentTime;

    @Column(name = "duration_minutes", nullable = false)
    @Min(15)
    @Max(480)
    private Integer durationMinutes = 60;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "active_status", nullable = false)
    private boolean activeStatus = true;
}