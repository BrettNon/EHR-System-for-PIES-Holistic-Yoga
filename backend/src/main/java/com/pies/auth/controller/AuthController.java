package com.pies.auth.controller;

import com.pies.auth.JwtService;
import com.pies.therapist.model.Therapist;
import com.pies.therapist.model.TherapistRole;
import com.pies.therapist.repository.TherapistRepository;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * Authentication endpoints for login and registration.
 * In development profile, login auto-registers unknown users.
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final TherapistRepository repo;
    private final JwtService jwt;
    private final PasswordEncoder encoder;
    private final Environment env;
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    // Request body for login
    record LoginReq(@NotBlank String username, @NotBlank String password) {
    }

    // Login response includes token and role
    record LoginResp(String token, TherapistRole role) {
    }

    // Request body for user registration
    record RegisterReq(@NotBlank String username,
                       @NotBlank String password,
                       String firstName,
                       String lastName,
                       String email,
                       TherapistRole role) {
    }

    /**
     * User login endpoint.
     * In dev profile, missing users are auto-registered. In prod, password is always verified.
     */
    @PostMapping("/login")
    public LoginResp login(@RequestBody LoginReq req) {
        Therapist u = repo.findByUsername(req.username()).orElse(null);

        // In dev: auto-register user if not found
        if (env.acceptsProfiles(Profiles.of("dev"))) {
            if (u == null) {
                u = new Therapist();
                u.setUsername(req.username());
                u.setPasswordHash("dummy");
                u.setFirstName("Dev");
                u.setLastName("User");
                u.setEmail(req.username() + "@dev.local");
                u.setRole(TherapistRole.ADMIN);
                u.setActiveStatus(true);
                u = repo.save(u);
            }
            return new LoginResp(jwt.generate(u), u.getRole());
        }

        // In prod: must exist, be active, and password must match
        if (u == null || !u.isActiveStatus())
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found or inactive");

        if (!encoder.matches(req.password(), u.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");

        logger.info("Login successful for {} with role {}", u.getUsername(), u.getRole());
        return new LoginResp(jwt.generate(u), u.getRole());
    }

    /**
     * Admin-only endpoint for registering new users.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/register")
    public Therapist register(@RequestBody RegisterReq req) {
        Therapist t = new Therapist();
        t.setUsername(req.username());
        t.setPasswordHash(encoder.encode(req.password()));
        t.setFirstName(req.firstName());
        t.setLastName(req.lastName());
        t.setEmail(req.email());
        t.setRole(req.role() == null ? TherapistRole.JUNIOR : req.role());
        t.setActiveStatus(true);
        return repo.save(t);
    }

    /**
     * Authenticated users can use this endpoint to get their own profile.
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public Therapist currentUser(Authentication authentication) {
        return repo.findByUsername(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
