package com.julia.gymflow.repository;

import com.julia.gymflow.entity.ProgramacionClase;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProgramacionClaseRepository extends JpaRepository<ProgramacionClase, Long> {

    List<ProgramacionClase> findByGimnasioIdOrderByNombreAsc(Long gimnasioId);

    List<ProgramacionClase> findByActivaTrue();

    Optional<ProgramacionClase> findByLegacyFingerprint(String legacyFingerprint);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from ProgramacionClase p where p.id = :id")
    Optional<ProgramacionClase> findByIdForUpdate(@Param("id") Long id);
}
