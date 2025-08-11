CREATE TABLE appointments (
                              id BIGINT AUTO_INCREMENT PRIMARY KEY,
                              therapist_id BIGINT NOT NULL,
                              patient_id BIGINT NOT NULL,
                              appointment_time DATETIME NOT NULL,
                              duration_minutes INT NOT NULL DEFAULT 60,
                              notes TEXT,
                              active_status BOOLEAN NOT NULL DEFAULT TRUE,
                              CONSTRAINT fk_appointments_therapist FOREIGN KEY (therapist_id) REFERENCES therapists(id),
                              CONSTRAINT fk_appointments_patient   FOREIGN KEY (patient_id)   REFERENCES patients(id)
);