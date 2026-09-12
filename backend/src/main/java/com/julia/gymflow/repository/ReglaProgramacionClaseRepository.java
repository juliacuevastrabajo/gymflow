package com.julia.gymflow.repository;

import com.julia.gymflow.entity.ReglaProgramacionClase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReglaProgramacionClaseRepository extends JpaRepository<ReglaProgramacionClase, Long> {
    List<ReglaProgramacionClase> findByProgramacionIdOrderByDiaSemanaAscHoraAsc(Long programacionId);
}
