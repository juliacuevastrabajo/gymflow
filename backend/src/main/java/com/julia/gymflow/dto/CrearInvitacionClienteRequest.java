package com.julia.gymflow.dto;

public class CrearInvitacionClienteRequest {

	private CaducidadInvitacionCliente caducidad;
	private Integer limiteRegistros;

	public CaducidadInvitacionCliente getCaducidad() {
		return caducidad;
	}

	public void setCaducidad(CaducidadInvitacionCliente caducidad) {
		this.caducidad = caducidad;
	}

	public Integer getLimiteRegistros() {
		return limiteRegistros;
	}

	public void setLimiteRegistros(Integer limiteRegistros) {
		this.limiteRegistros = limiteRegistros;
	}
}
