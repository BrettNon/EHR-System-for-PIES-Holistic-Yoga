package com.pies.soap.payload;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SoapNoteRequest {
    private Long patientId;
    private Long therapistId;
    private String dateOfSession;
    private String timeOfSession;
    private String sessionLength;
    private String typeOfSession;
    private String conditions;
    private String medications;
    private String goals;
    private String diet;
    private String activityLevel;
    private String historyOfConditions;
    private String quickNotes;
    private int age;
    private boolean activeStatus;
    private String snotes;
    private String onotes;
    private String anotes;
    private String pnotes;
}
