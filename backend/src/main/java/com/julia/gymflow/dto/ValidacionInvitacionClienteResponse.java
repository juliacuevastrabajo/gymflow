package com.julia.gymflow.dto;

import java.time.Instant;

public class ValidacionInvitacionClienteResponse {

	private final boolean valida;
	private final EstadoInvitacionCliente estado;
	private final String mensaje;
	private final String nombreGimnasio;
	private final Instant fechaExpiracion;
	private final Integer usosDisponibles;

	public ValidacionInvitacionClienteResponse(
			boolean valida,
			EstadoInvitacionCliente estado,
			String mensaje,
			String nombreGimnasio,
			Instant fechaExpiracion,
			Integer usosDisponibles
	) {
		this.valida = valida;
		this.estado = estado;
		this.mensaje = mensaje;
		this.nombreGimnasio = nombreGimnasio;
		this.fechaExpiracion = fechaExpiracion;
		this.usosDisponibles = usosDisponibles;
	}

	public boolean isValida() { return valida; }
	public EstadoInvitacionCliente getEstado() { return estado; }
	public String getMensaje() { return mensaje; }
	public String getNombreGimnasio() { return nombreGimnasio; }
	public Instant getFechaExpiracion() { return fechaExpiracion; }
	public Integer getUsosDisponibles() { return usosDisponibles; }
}
