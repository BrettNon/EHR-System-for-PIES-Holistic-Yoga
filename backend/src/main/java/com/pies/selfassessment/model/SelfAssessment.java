package com.pies.selfassessment.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.pies.patient.model.Patient;
import com.pies.therapist.model.Therapist;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "self_assessments")
@Getter
@Setter
@NoArgsConstructor
public class SelfAssessment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "therapist_id", nullable = false)
    private Therapist therapist;

    private LocalDate dateOfSession;
    private String goalOfSession;
    private String assessment;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private boolean activeStatus = true;
}