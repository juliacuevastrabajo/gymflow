package com.julia.gymflow.dto;

import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;

public class LoginResponse {

	private Long id;
	private String nombre;
	private String email;
	private String fotoPerfilUrl;
	private RolUsuario rol;
	private Long gimnasioId;
	private String nombreGimnasio;
	private String token;

	public LoginResponse(Usuario usuario, String token) {
		this.id = usuario.getId();
		this.nombre = usuario.getNombre();
		this.email = usuario.getEmail();
		this.fotoPerfilUrl = usuario.getFotoPerfilUrl();
		this.rol = usuario.getRol();
		this.token = token;

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

	public Long getGimnasioId() {
		return gimnasioId;
	}

	public String getNombreGimnasio() {
		return nombreGimnasio;
	}

	public String getToken() {
		return token;
	}
}
