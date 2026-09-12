package com.julia.gymflow.service;

import com.julia.gymflow.dto.LoginRequest;
import com.julia.gymflow.dto.LoginResponse;
import com.julia.gymflow.dto.AuthSessionResponse;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class AuthService {

	private final UsuarioRepository usuarioRepository;
	private final PasswordService passwordService;
	private final AuthTokenService authTokenService;

	public AuthService(
			UsuarioRepository usuarioRepository,
			PasswordService passwordService,
			AuthTokenService authTokenService
	) {
		this.usuarioRepository = usuarioRepository;
		this.passwordService = passwordService;
		this.authTokenService = authTokenService;
	}

	public LoginResponse login(LoginRequest request) {
		String email = request.getEmail() == null
				? ""
				: request.getEmail().trim().toLowerCase(Locale.ROOT);
		Usuario usuario = usuarioRepository.findByEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado."));

		if (!passwordService.matches(request.getPassword(), usuario.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Contrasena incorrecta.");
		}

		if (!usuario.isActivo()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario inactivo.");
		}

		if (passwordService.needsRehash(usuario.getPasswordHash())) {
			usuario.setPasswordHash(passwordService.hash(request.getPassword()));
			usuarioRepository.save(usuario);
		}

		return new LoginResponse(usuario, authTokenService.crearToken(usuario));
	}

	public AuthSessionResponse obtenerSesionActual(String authorizationHeader) {
		Long usuarioId = authTokenService.obtenerUsuarioId(authorizationHeader);
		Usuario usuario = usuarioRepository.findById(usuarioId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion no valida."));

		if (!usuario.isActivo()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario inactivo.");
		}

		return new AuthSessionResponse(usuario);
	}
}
