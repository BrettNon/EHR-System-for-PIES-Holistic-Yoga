package com.pies.soap.model;

import java.time.LocalDate;
import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.pies.patient.model.Patient;
import com.pies.therapist.model.Therapist;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "soap_notes")
@Getter
@Setter
@NoArgsConstructor
public class SoapNote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "therapist_id")
    private Therapist therapist;

    private LocalDate dateOfSession;
    private String sessionLength;
    private String typeOfSession;
    private String sNotes;
    private String oNotes;
    private String aNotes;
    private String pNotes;
    private String conditions;
    private String medications;
    private String goals;
    private String diet;
    private String activityLevel;
    private String historyOfConditions;
    private String quickNotes;
    private Integer age;
    
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime timeOfSession;


    private boolean activeStatus = true;
}