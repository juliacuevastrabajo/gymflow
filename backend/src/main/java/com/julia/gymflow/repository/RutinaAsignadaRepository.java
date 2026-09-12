package com.julia.gymflow.repository;

import com.julia.gymflow.entity.RutinaAsignada;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RutinaAsignadaRepository extends JpaRepository<RutinaAsignada, Long> {

    List<RutinaAsignada> findByRutinaIdAndActivaTrueOrderByFechaAsignacionDesc(Long rutinaId);

    List<RutinaAsignada> findByClienteIdAndActivaTrueOrderByFechaAsignacionDesc(Long clienteId);

    Optional<RutinaAsignada> findByRutinaIdAndClienteIdAndActivaTrue(Long rutinaId, Long clienteId);

    boolean existsByRutinaIdAndClienteIdAndActivaTrue(Long rutinaId, Long clienteId);
}
