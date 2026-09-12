package com.julia.gymflow.repository;

import com.julia.gymflow.entity.Mensaje;
import com.julia.gymflow.entity.EstadoMensaje;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MensajeRepository extends JpaRepository<Mensaje, Long> {

    List<Mensaje> findByGimnasioIdAndActivoTrueOrderByFechaCreacionDesc(Long gimnasioId);

    List<Mensaje> findByActivoTrueOrderByFechaCreacionDesc();

    List<Mensaje> findByActivoTrueAndEstadoAndFechaProgramadaLessThanEqual(
            EstadoMensaje estado,
            LocalDateTime fechaProgramada
    );

    boolean existsByBienvenidaUsuarioId(Long bienvenidaUsuarioId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select m from Mensaje m
            where m.activo = true
              and m.estado = :estado
              and m.fechaProgramada <= :ahora
            order by m.fechaProgramada asc, m.id asc
            """)
    List<Mensaje> findPendientesParaProcesar(
            @Param("estado") EstadoMensaje estado,
            @Param("ahora") LocalDateTime ahora
    );
}
