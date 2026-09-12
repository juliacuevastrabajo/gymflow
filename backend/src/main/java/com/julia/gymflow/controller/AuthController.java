package com.julia.gymflow.controller;

import com.julia.gymflow.dto.LoginRequest;
import com.julia.gymflow.dto.LoginResponse;
import com.julia.gymflow.dto.AuthSessionResponse;
import com.julia.gymflow.service.AuthService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/login")
	public LoginResponse login(@RequestBody LoginRequest request) {
		return authService.login(request);
	}

	@GetMapping("/me")
	public AuthSessionResponse me(
			@RequestHeader(value = "Authorization", required = false) String authorization
	) {
		return authService.obtenerSesionActual(authorization);
	}
}
