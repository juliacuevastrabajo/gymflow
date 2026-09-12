package com.julia.gymflow.dto;

import java.time.Instant;

public class InvitacionClienteResponse {

	private final Long id;
	private final String publicId;
	private final Long gimnasioId;
	private final String nombreGimnasio;
	private final Instant fechaCreacion;
	private final Instant fechaExpiracion;
	private final int limiteRegistros;
	private final int usosConsumidos;
	private final int usosDisponibles;
	private final EstadoInvitacionCliente estado;
	private final String token;

	public InvitacionClienteResponse(
			Long id,
			String publicId,
			Long gimnasioId,
			String nombreGimnasio,
			Instant fechaCreacion,
			Instant fechaExpiracion,
			int limiteRegistros,
			int usosConsumidos,
			EstadoInvitacionCliente estado,
			String token
	) {
		this.id = id;
		this.publicId = publicId;
		this.gimnasioId = gimnasioId;
		this.nombreGimnasio = nombreGimnasio;
		this.fechaCreacion = fechaCreacion;
		this.fechaExpiracion = fechaExpiracion;
		this.limiteRegistros = limiteRegistros;
		this.usosConsumidos = usosConsumidos;
		this.usosDisponibles = Math.max(0, limiteRegistros - usosConsumidos);
		this.estado = estado;
		this.token = token;
	}

	public Long getId() { return id; }
	public String getPublicId() { return publicId; }
	public Long getGimnasioId() { return gimnasioId; }
	public String getNombreGimnasio() { return nombreGimnasio; }
	public Instant getFechaCreacion() { return fechaCreacion; }
	public Instant getFechaExpiracion() { return fechaExpiracion; }
	public int getLimiteRegistros() { return limiteRegistros; }
	public int getUsosConsumidos() { return usosConsumidos; }
	public int getUsosDisponibles() { return usosDisponibles; }
	public EstadoInvitacionCliente getEstado() { return estado; }
	public String getToken() { return token; }
}
