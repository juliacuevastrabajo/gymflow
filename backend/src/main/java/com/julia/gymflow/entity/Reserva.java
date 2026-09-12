package com.julia.gymflow.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservas")
public class Reserva {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private LocalDateTime fechaReserva;

	@Enumerated(EnumType.STRING)
	private EstadoReserva estado;

	@ManyToOne
	@JoinColumn(name = "clase_id")
	private Clase clase;

	@ManyToOne
	@JoinColumn(name = "cliente_id")
	private Usuario cliente;

	public Reserva() {
	}

	public Long getId() {
		return id;
	}

	public LocalDateTime getFechaReserva() {
		return fechaReserva;
	}

	public EstadoReserva getEstado() {
		return estado;
	}

	public Clase getClase() {
		return clase;
	}

	public Usuario getCliente() {
		return cliente;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public void setFechaReserva(LocalDateTime fechaReserva) {
		this.fechaReserva = fechaReserva;
	}

	public void setEstado(EstadoReserva estado) {
		this.estado = estado;
	}

	public void setClase(Clase clase) {
		this.clase = clase;
	}

	public void setCliente(Usuario cliente) {
		this.cliente = cliente;
	}
}
