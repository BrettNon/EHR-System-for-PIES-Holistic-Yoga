package com.pies.therapist.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pies.therapist.model.Therapist;

/**
 * Data access layer for Therapist entity
 */
public interface TherapistRepository extends JpaRepository<Therapist, Long> {

    /**
     * Used by authentication & login
     */
    Optional<Therapist> findByUsername(String username);

    Page<Therapist> findByActiveStatusTrue(Pageable pageable);

    @Query("select t from Therapist t where t.activeStatus=true and " +
            "(lower(t.firstName) like lower(concat('%', :q, '%')) " +
            "or lower(t.lastName) like lower(concat('%', :q, '%')))")
    Page<Therapist> search(@Param("q") String q, Pageable pageable);


    List<Therapist> findByActiveStatusTrue();



}