package com.julia.gymflow.repository;

import com.julia.gymflow.entity.RutinaEjercicio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RutinaEjercicioRepository extends JpaRepository<RutinaEjercicio, Long> {

    List<RutinaEjercicio> findByRutinaIdOrderByOrdenAsc(Long rutinaId);

    long countByRutinaId(Long rutinaId);
}
