package com.julia.gymflow.repository;

import com.julia.gymflow.entity.ArchivoSubido;
import com.julia.gymflow.entity.EstadoArchivoSubido;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ArchivoSubidoRepository extends JpaRepository<ArchivoSubido, Long> {

    Optional<ArchivoSubido> findByUrl(String url);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from ArchivoSubido a where a.estado = :estado and a.fechaEstado < :limite order by a.fechaEstado")
    List<ArchivoSubido> bloquearTemporalesCaducados(
            @Param("estado") EstadoArchivoSubido estado,
            @Param("limite") LocalDateTime limite
    );
}
