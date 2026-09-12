package com.julia.gymflow.dto;

import jakarta.validation.constraints.NotNull;

public class ReservaRequest {

	@NotNull(message = "Selecciona una clase.")
	private Long claseId;
	private Long clienteId;

	public Long getClaseId() {
		return claseId;
	}

	public Long getClienteId() {
		return clienteId;
	}

	public void setClaseId(Long claseId) {
		this.claseId = claseId;
	}

	public void setClienteId(Long clienteId) {
		this.clienteId = clienteId;
	}
}
