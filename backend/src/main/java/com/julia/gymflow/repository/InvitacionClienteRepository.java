package com.julia.gymflow.repository;

import com.julia.gymflow.entity.InvitacionCliente;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InvitacionClienteRepository extends JpaRepository<InvitacionCliente, Long> {

	List<InvitacionCliente> findByGimnasioIdOrderByFechaCreacionDesc(Long gimnasioId);

	Optional<InvitacionCliente> findByPublicId(String publicId);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select invitacion from InvitacionCliente invitacion where invitacion.publicId = :publicId")
	Optional<InvitacionCliente> findByPublicIdForUpdate(@Param("publicId") String publicId);
}
