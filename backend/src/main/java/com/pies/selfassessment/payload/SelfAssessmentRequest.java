package com.pies.selfassessment.payload;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SelfAssessmentRequest {
    @NotNull
    private Long patientId;

    @NotNull
    private Long therapistId;

    @NotNull
    private String dateOfSession;

    private String goalOfSession;
    private String assessment;
    private String notes;
}