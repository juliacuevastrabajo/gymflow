package com.julia.gymflow.dto;

import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;

public class UsuarioResponse {

	private Long id;
	private String nombre;
	private String email;
	private String fotoPerfilUrl;
	private RolUsuario rol;
	private boolean activo;
	private Long gimnasioId;
	private String nombreGimnasio;

	public UsuarioResponse(Usuario usuario) {
		this.id = usuario.getId();
		this.nombre = usuario.getNombre();
		this.email = usuario.getEmail();
		this.fotoPerfilUrl = usuario.getFotoPerfilUrl();
		this.rol = usuario.getRol();
		this.activo = usuario.isActivo();

		if (usuario.getGimnasio() != null) {
			this.gimnasioId = usuario.getGimnasio().getId();
			this.nombreGimnasio = usuario.getGimnasio().getNombre();
		}
	}

	public Long getId() {
		return id;
	}

	public String getNombre() {
		return nombre;
	}

	public String getEmail() {
		return email;
	}

	public String getFotoPerfilUrl() {
		return fotoPerfilUrl;
	}

	public RolUsuario getRol() {
		return rol;
	}

	public boolean isActivo() {
		return activo;
	}

	public Long getGimnasioId() {
		return gimnasioId;
	}

	public String getNombreGimnasio() {
		return nombreGimnasio;
	}
}
