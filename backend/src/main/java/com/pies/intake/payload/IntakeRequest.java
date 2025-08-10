package com.pies.intake.payload;

import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.pies.patient.payload.PatientRequest;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class IntakeRequest {
    private PatientRequest patient;
    private Long therapistId;
    private LocalDate intakeDate;

    private Boolean practicedYogaBefore;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate lastPracticedDate;
    private String yogaFrequency;

    private List<String> yogaStyles;
    private String yogaStyleOther;
    private List<String> yogaGoals;
    private String yogaGoalsOther;
    private String yogaGoalsExplanation;
    private List<String> yogaInterests;
    private String yogaInterestsOther;

    private String activityLevel;
    private Integer stressLevel;

    private HealthHistoryRequest healthHistory;
}
