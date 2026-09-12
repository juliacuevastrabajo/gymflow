package com.julia.gymflow.dto;

public class ActualizarPerfilRequest {

	private String nombre;
	private String email;

	public String getNombre() {
		return nombre;
	}

	public String getEmail() {
		return email;
	}

	public void setNombre(String nombre) {
		this.nombre = nombre;
	}

	public void setEmail(String email) {
		this.email = email;
	}
}
