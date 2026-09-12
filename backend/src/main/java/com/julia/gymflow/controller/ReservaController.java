package com.julia.gymflow.controller;

import com.julia.gymflow.dto.ReservaRequest;
import com.julia.gymflow.dto.ReservaResponse;
import com.julia.gymflow.service.ReservaService;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

	private final ReservaService reservaService;

	public ReservaController(ReservaService reservaService) {
		this.reservaService = reservaService;
	}

	@GetMapping
	public List<ReservaResponse> listarReservas(
			@RequestHeader(value = "Authorization", required = false) String authorization
	) {
		return reservaService.listarReservas(authorization);
	}

	@GetMapping("/me")
	public List<ReservaResponse> listarMisReservas(
			@RequestHeader(value = "Authorization", required = false) String authorization
	) {
		return reservaService.listarMisReservas(authorization);
	}

	@GetMapping("/clase/{claseId}")
	public List<ReservaResponse> listarReservasPorClase(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@PathVariable Long claseId
	) {
		return reservaService.listarReservasPorClase(authorization, claseId);
	}

	@GetMapping("/cliente/{clienteId}")
	public List<ReservaResponse> listarReservasPorCliente(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@PathVariable Long clienteId
	) {
		return reservaService.listarReservasPorCliente(authorization, clienteId);
	}

	@PostMapping
	public ReservaResponse crearReserva(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@Valid @RequestBody ReservaRequest request
	) {
		return reservaService.crearReserva(authorization, request);
	}

	@PutMapping("/{id}/cancelar")
	public ReservaResponse cancelarReserva(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@PathVariable Long id
	) {
		return reservaService.cancelarReserva(authorization, id);
	}
}
