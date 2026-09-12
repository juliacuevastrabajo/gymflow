package com.julia.gymflow.repository;

import com.julia.gymflow.entity.EstadoReserva;
import com.julia.gymflow.entity.Reserva;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {

	List<Reserva> findByClaseId(Long claseId);

	List<Reserva> findByClienteId(Long clienteId);

	long countByClaseIdAndEstado(Long claseId, EstadoReserva estado);

	boolean existsByClaseIdAndClienteIdAndEstado(Long claseId, Long clienteId, EstadoReserva estado);

	boolean existsByClaseIdAndEstado(Long claseId, EstadoReserva estado);

	List<Reserva> findByClaseGimnasioIdOrderByFechaReservaDesc(Long gimnasioId);

	List<Reserva> findByClaseEntrenadorIdOrderByFechaReservaDesc(Long entrenadorId);

	List<Reserva> findByClienteIdOrderByFechaReservaDesc(Long clienteId);

	List<Reserva> findByClaseIdOrderByFechaReservaDesc(Long claseId);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select reserva from Reserva reserva where reserva.id = :id")
	Optional<Reserva> findByIdForUpdate(@Param("id") Long id);
}
