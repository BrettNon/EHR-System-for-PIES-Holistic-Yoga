package com.pies.patient.payload;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

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
    @Pattern(regexp = "^[A-Z]{2}$", message = "State code must be 2 letters")
    private String state;

    @Pattern(regexp = "^\\d{5}(?:-\\d{4})?$", message = "Invalid ZIP code")
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
