package com.julia.gymflow.repository;

import com.julia.gymflow.entity.Pago;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PagoRepository extends JpaRepository<Pago, Long> {

    List<Pago> findByGimnasioId(Long gimnasioId);

    List<Pago> findByClienteId(Long clienteId);
}
