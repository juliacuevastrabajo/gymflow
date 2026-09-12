package com.julia.gymflow.controller;

import com.julia.gymflow.dto.CrearInvitacionClienteRequest;
import com.julia.gymflow.dto.InvitacionClienteResponse;
import com.julia.gymflow.dto.LoginResponse;
import com.julia.gymflow.dto.RegistroInvitacionClienteRequest;
import com.julia.gymflow.dto.ValidacionInvitacionClienteResponse;
import com.julia.gymflow.service.InvitacionClienteService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/invitaciones-clientes")
public class InvitacionClienteController {

	private final InvitacionClienteService invitacionClienteService;

	public InvitacionClienteController(InvitacionClienteService invitacionClienteService) {
		this.invitacionClienteService = invitacionClienteService;
	}

	@PostMapping
	public InvitacionClienteResponse crear(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@RequestBody CrearInvitacionClienteRequest request
	) {
		return invitacionClienteService.crear(authorization, request);
	}

	@GetMapping
	public List<InvitacionClienteResponse> listar(
			@RequestHeader(value = "Authorization", required = false) String authorization
	) {
		return invitacionClienteService.listar(authorization);
	}

	@PostMapping("/{id}/revocar")
	public InvitacionClienteResponse revocar(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@PathVariable Long id
	) {
		return invitacionClienteService.revocar(authorization, id);
	}

	@GetMapping("/validar")
	public ValidacionInvitacionClienteResponse validar(@RequestParam String token) {
		return invitacionClienteService.validar(token);
	}

	@PostMapping("/registrar")
	public LoginResponse registrar(@RequestBody RegistroInvitacionClienteRequest request) {
		return invitacionClienteService.registrar(request);
	}
}
