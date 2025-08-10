package com.pies.intake.payload;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.pies.patient.payload.PatientRequest;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

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

    @Pattern(
            regexp = "Sedentary/Very inactive|Somewhat inactive|Average|Somewhat active|Extremely active",
            message = "Invalid activity level")
    private String activityLevel;

    @Min(value = 1, message = "Stress level must be between 1 and 10")
    @Max(value = 10, message = "Stress level must be between 1 and 10")
    private Integer stressLevel;

    private HealthHistoryRequest healthHistory;
}
