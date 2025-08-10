package com.pies.patient.payload;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PatientRequest {

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    private LocalDate dateOfBirth;
    private String address;
    private String city;
    private String state;
    private String zipCode;

    @Email
    private String email;

    private String homePhoneNumber;
    private String cellPhoneNumber;
    private String workPhoneNumber;

    private String emergencyContactName;
    private String emergencyContactPhone;
    private String referredBy;

    // OPTIONAL ATP
    private Long therapistId;

}
