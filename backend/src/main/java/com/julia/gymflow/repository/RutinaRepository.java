package com.julia.gymflow.repository;

import com.julia.gymflow.entity.Rutina;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RutinaRepository extends JpaRepository<Rutina, Long> {

    List<Rutina> findByGimnasioIdAndActivaTrueOrderByFechaCreacionDesc(Long gimnasioId);

    List<Rutina> findByGimnasioIdAndCreadorIdAndActivaTrueOrderByFechaCreacionDesc(
            Long gimnasioId,
            Long creadorId
    );
}
