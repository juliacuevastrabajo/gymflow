package com.julia.gymflow.repository;

import com.julia.gymflow.entity.Clase;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClaseRepository extends JpaRepository<Clase, Long> {

    List<Clase> findByGimnasioId(Long gimnasioId);

    List<Clase> findByEntrenadorId(Long entrenadorId);

    List<Clase> findByActivaTrue();

    List<Clase> findByGimnasioIdAndActivaTrue(Long gimnasioId);

    List<Clase> findByEntrenadorIdAndActivaTrue(Long entrenadorId);

    boolean existsByImagenUrl(String imagenUrl);

    List<Clase> findByGimnasioIdOrderByFechaHoraAsc(Long gimnasioId);

    List<Clase> findByGimnasioIdAndActivaTrueOrderByFechaHoraAsc(Long gimnasioId);

    List<Clase> findByEntrenadorIdAndActivaTrueOrderByFechaHoraAsc(Long entrenadorId);

    List<Clase> findByProgramacionIdOrderByFechaHoraAsc(Long programacionId);

    List<Clase> findByProgramacionIdAndFechaHoraBetweenOrderByFechaHoraAsc(
            Long programacionId,
            LocalDateTime desde,
            LocalDateTime hasta
    );

    List<Clase> findByProgramacionIsNullOrderByIdAsc();

    long countByProgramacionIdAndActivaTrueAndFechaHoraAfter(Long programacionId, LocalDateTime fechaHora);

    List<Clase> findTop6ByProgramacionIdAndActivaTrueAndFechaHoraAfterOrderByFechaHoraAsc(
            Long programacionId,
            LocalDateTime fechaHora
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select clase from Clase clase where clase.id = :id")
    Optional<Clase> findByIdForUpdate(@Param("id") Long id);
}
