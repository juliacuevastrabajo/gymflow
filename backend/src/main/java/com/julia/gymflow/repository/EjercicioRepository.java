package com.julia.gymflow.repository;

import com.julia.gymflow.entity.Ejercicio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EjercicioRepository extends JpaRepository<Ejercicio, Long> {

    List<Ejercicio> findByGimnasioIdAndActivoTrueOrderByNombreAsc(Long gimnasioId);

    boolean existsByMultimediaUrl(String multimediaUrl);
}
