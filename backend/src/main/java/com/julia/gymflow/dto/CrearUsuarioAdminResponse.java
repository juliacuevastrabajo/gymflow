package com.julia.gymflow.dto;

public class CrearUsuarioAdminResponse {

	private final UsuarioResponse usuario;
	private final String passwordInicial;

	public CrearUsuarioAdminResponse(UsuarioResponse usuario, String passwordInicial) {
		this.usuario = usuario;
		this.passwordInicial = passwordInicial;
	}

	public UsuarioResponse getUsuario() {
		return usuario;
	}

	public String getPasswordInicial() {
		return passwordInicial;
	}
}
