package com.julia.gymflow.dto;

import com.julia.gymflow.entity.EstadoReserva;
import com.julia.gymflow.entity.Reserva;

import java.time.LocalDateTime;

public class ReservaResponse {

	private Long id;
	private LocalDateTime fechaReserva;
	private EstadoReserva estado;

	private Long claseId;
	private String nombreClase;

	private Long clienteId;
	private String nombreCliente;

	private Long gimnasioId;
	private String nombreGimnasio;

	public ReservaResponse(Reserva reserva) {
		this.id = reserva.getId();
		this.fechaReserva = reserva.getFechaReserva();
		this.estado = reserva.getEstado();

		if (reserva.getClase() != null) {
			this.claseId = reserva.getClase().getId();
			this.nombreClase = reserva.getClase().getNombre();

			if (reserva.getClase().getGimnasio() != null) {
				this.gimnasioId = reserva.getClase().getGimnasio().getId();
				this.nombreGimnasio = reserva.getClase().getGimnasio().getNombre();
			}
		}

		if (reserva.getCliente() != null) {
			this.clienteId = reserva.getCliente().getId();
			this.nombreCliente = reserva.getCliente().getNombre();
		}
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

	public Long getClaseId() {
		return claseId;
	}

	public String getNombreClase() {
		return nombreClase;
	}

	public Long getClienteId() {
		return clienteId;
	}

	public String getNombreCliente() {
		return nombreCliente;
	}

	public Long getGimnasioId() {
		return gimnasioId;
	}

	public String getNombreGimnasio() {
		return nombreGimnasio;
	}
}
