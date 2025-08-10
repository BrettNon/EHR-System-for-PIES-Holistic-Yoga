package com.pies.intake.controller;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pies.intake.model.IntakeForm;
import com.pies.intake.model.IntakeFormHealthHistory;
import com.pies.intake.payload.IntakeRequest;
import com.pies.intake.repository.IntakeRepository;
import com.pies.intake.service.IntakeService;
import com.pies.patient.model.Patient;
import com.pies.patient.payload.PatientRequest;
import com.pies.therapist.model.Therapist;
import com.pies.therapist.repository.TherapistRepository;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "IntakeForms")
@RestController
@RequestMapping("/intakes")
@RequiredArgsConstructor
public class IntakeController {

    private final IntakeService svc;
    private final TherapistRepository therapistRepository;
    private final IntakeRepository intakeFormRepository;
    
    private Patient mapPatientRequestToPatient(PatientRequest req, Therapist therapist) {
        Patient p = new Patient();
        p.setFirstName(req.getFirstName());
        p.setLastName(req.getLastName());
        p.setDateOfBirth(req.getDateOfBirth());
        p.setAddress(req.getAddress());
        p.setCity(req.getCity());
        p.setState(req.getState());
        p.setZipCode(req.getZipCode());
        p.setEmail(req.getEmail());
        p.setHomePhoneNumber(req.getHomePhoneNumber());
        p.setCellPhoneNumber(req.getCellPhoneNumber());
        p.setWorkPhoneNumber(req.getWorkPhoneNumber());
        p.setEmergencyContactName(req.getEmergencyContactName());
        p.setEmergencyContactPhone(req.getEmergencyContactPhone());
        p.setReferredBy(req.getReferredBy());
        p.setDateCreated(LocalDate.now());
        p.setActiveStatus(true);
        p.setTherapist(therapist);  // This links therapist_id in DB
        return p;
    }


    /** Simple response structure for success messages. */
    public record SimpleResponse(String message) {}
    

    @PreAuthorize("hasAnyRole('JUNIOR', 'SENIOR', 'ADMIN')")
    @PostMapping
    public ResponseEntity<?> createIntake(@RequestBody IntakeRequest request) {
        // 1. Find and assign therapist
        Therapist therapist = therapistRepository.findById(request.getTherapistId())
                .orElseThrow(() -> new RuntimeException("Therapist not found"));

        // 2. Create IntakeForm from request
        IntakeForm form = new IntakeForm();
        Patient patient = mapPatientRequestToPatient(request.getPatient(), therapist);
        form.setPatient(patient);
        form.setTherapist(therapist);
        form.setDateSubmitted(request.getIntakeDate());
        form.setPracticedYogaBefore(request.getPracticedYogaBefore());
        form.setLastPracticedDate(request.getLastPracticedDate());
        form.setYogaFrequency(request.getYogaFrequency());

        // Handle lists safely
        form.setYogaStyles(Optional.ofNullable(request.getYogaStyles()).map(l -> String.join(",", l)).orElse(""));
        form.setYogaStyleOther(request.getYogaStyleOther());
        form.setYogaGoals(Optional.ofNullable(request.getYogaGoals()).map(l -> String.join(",", l)).orElse(""));
        form.setYogaGoalsOther(request.getYogaGoalsOther());
        form.setYogaGoalsExplanation(request.getYogaGoalsExplanation());
        form.setYogaInterests(Optional.ofNullable(request.getYogaInterests()).map(l -> String.join(",", l)).orElse(""));
        form.setYogaInterestsOther(request.getYogaInterestsOther());

        form.setActivityLevel(request.getActivityLevel());
        form.setStressLevel(request.getStressLevel());

        // 3. Map health history if provided
        IntakeFormHealthHistory history = null;
        if (request.getHealthHistory() != null) {
            history = new IntakeFormHealthHistory();
            history.setAnxietyDepression(request.getHealthHistory().getAnxietyDepression());
            history.setArthritisBursitis(request.getHealthHistory().getArthritisBursitis());
            history.setAsthma(request.getHealthHistory().getAsthma());
            history.setAutoimmune(request.getHealthHistory().getAutoimmune());
            history.setBackProblems(request.getHealthHistory().getBackProblems());
            history.setBloodPressure(request.getHealthHistory().getBloodPressure());
            history.setBrokenBones(request.getHealthHistory().getBrokenBones());
            history.setCancer(request.getHealthHistory().getCancer());
            history.setDiabetes(request.getHealthHistory().getDiabetes());
            history.setDiscProblems(request.getHealthHistory().getDiscProblems());
            history.setHeartConditions(request.getHealthHistory().getHeartConditions());
            history.setInsomnia(request.getHealthHistory().getInsomnia());
            history.setMuscleStrain(request.getHealthHistory().getMuscleStrain());
            history.setNumbnessTingling(request.getHealthHistory().getNumbnessTingling());
            history.setOsteoporosis(request.getHealthHistory().getOsteoporosis());
            history.setPregnancy(request.getHealthHistory().getPregnancy());
            history.setPregnancyEdd(request.getHealthHistory().getPregnancyEdd());
            history.setScoliosis(request.getHealthHistory().getScoliosis());
            history.setSeizures(request.getHealthHistory().getSeizures());
            history.setStroke(request.getHealthHistory().getStroke());
            history.setSurgery(request.getHealthHistory().getSurgery());
            history.setMedications(request.getHealthHistory().getMedications());
            history.setMedicationsList(request.getHealthHistory().getMedicationsList());
            history.setAdditionalNotes(request.getHealthHistory().getAdditionalNotes());
            history.setOtherConditionsExplanation(request.getHealthHistory().getOtherConditionsExplanation());
        }

        // SO MUCH DEBUGGING HERE - RIP 4 HOURS, GONE BUT NOT FORGOTTEN
       try {
            //System.out.println(">>> Assigned therapist ID: " + therapist.getId());
            //System.out.println(">>> Form therapist ID before save: " + form.getTherapist());
            IntakeForm saved = svc.save(form, history);
            //System.out.println(">>> Form saved, preparing to return response");
            return new ResponseEntity<>("OK", HttpStatus.OK);
        } catch (Exception e) {
            //e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "status", 500,
                "message", e.getMessage()
            ));
        }

        
        // 4. Save everything via service
        ///IntakeForm saved = svc.save(form, history);
        ///return ResponseEntity.ok(saved);
    }

    @PreAuthorize("hasAnyRole('SENIOR', 'ADMIN')")
    @PutMapping("{id}")
    public ResponseEntity<SimpleResponse> update(@PathVariable Long id, @RequestBody IntakeForm f) {
        svc.update(id, f);
        return ResponseEntity.ok(new SimpleResponse("Intake form updated successfully"));
    }

    @PreAuthorize("hasAnyRole('JUNIOR', 'SENIOR', 'ADMIN')")
    @GetMapping("{id}")
    public IntakeForm get(@PathVariable Long id) {
        return svc.findById(id);
    }

    @PreAuthorize("hasAnyRole('JUNIOR', 'SENIOR', 'ADMIN')")
    @GetMapping
    public Page<IntakeForm> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q) {
        Pageable pageable = PageRequest.of(page, size);
        return svc.findActive(q, pageable);
    }

    @PreAuthorize("hasAnyRole('SENIOR', 'ADMIN')")
    @DeleteMapping("{id}")
    public ResponseEntity<SimpleResponse> delete(@PathVariable Long id) {
        svc.delete(id);
        return ResponseEntity.ok(new SimpleResponse("Intake form deleted successfully"));
    }
    
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('JUNIOR', 'SENIOR', 'ADMIN')")
    public ResponseEntity<IntakeForm> getByPatientId(@PathVariable Long patientId) {
        return intakeFormRepository.findTopByPatientIdAndActiveStatusTrueOrderByIdDesc(patientId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
