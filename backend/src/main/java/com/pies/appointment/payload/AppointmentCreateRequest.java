package com.pies.appointment.payload;

import java.time.LocalDateTime;

public record AppointmentCreateRequest(
        Long therapistId,
        Long patientId,
        LocalDateTime appointmentTime,
        Integer durationMinutes,
        String notes
) {
}