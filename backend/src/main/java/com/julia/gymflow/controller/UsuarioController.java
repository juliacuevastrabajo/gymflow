package com.julia.gymflow.controller;

import com.julia.gymflow.dto.ActualizarPerfilRequest;
import com.julia.gymflow.dto.CambiarPasswordRequest;
import com.julia.gymflow.dto.CrearUsuarioAdminRequest;
import com.julia.gymflow.dto.CrearUsuarioAdminResponse;
import com.julia.gymflow.dto.ImagenUrlRequest;
import com.julia.gymflow.dto.UsuarioResponse;
import com.julia.gymflow.service.UsuarioService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

	private final UsuarioService usuarioService;

	public UsuarioController(UsuarioService usuarioService) {
		this.usuarioService = usuarioService;
	}

	@GetMapping
	public List<UsuarioResponse> listarUsuarios(
			@RequestHeader(value = "Authorization", required = false) String authorization
	) {
		return usuarioService.listarUsuarios(authorization);
	}

	@GetMapping("/gimnasio/{gimnasioId}")
	public List<UsuarioResponse> listarUsuariosPorGimnasio(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@PathVariable Long gimnasioId
	) {
		return usuarioService.listarUsuariosPorGimnasio(authorization, gimnasioId);
	}

	@PostMapping
	public CrearUsuarioAdminResponse crearUsuario(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@RequestBody CrearUsuarioAdminRequest request
	) {
		return usuarioService.crearUsuario(authorization, request);
	}

	@PutMapping("/me")
	public UsuarioResponse actualizarMiPerfil(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@RequestBody ActualizarPerfilRequest request
	) {
		return usuarioService.actualizarMiPerfil(authorization, request);
	}

	@PutMapping("/me/password")
	public UsuarioResponse cambiarMiPassword(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@RequestBody CambiarPasswordRequest request
	) {
		return usuarioService.cambiarMiPassword(authorization, request);
	}

	@PutMapping("/{id}/foto")
	public UsuarioResponse actualizarFotoPerfil(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@PathVariable Long id,
			@RequestBody ImagenUrlRequest request
	) {
		return usuarioService.actualizarFotoPerfil(authorization, id, request.getUrl());
	}

	@DeleteMapping("/{id}")
	public UsuarioResponse desactivarUsuario(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@PathVariable Long id
	) {
		return usuarioService.desactivarUsuario(authorization, id);
	}
}
