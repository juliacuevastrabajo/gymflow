package com.julia.gymflow.controller;

import com.julia.gymflow.dto.ClaseRequest;
import com.julia.gymflow.dto.ClaseResponse;
import com.julia.gymflow.dto.ProgramacionClaseRequest;
import com.julia.gymflow.dto.ProgramacionClaseResponse;
import com.julia.gymflow.service.ClaseService;
import com.julia.gymflow.service.ProgramacionClaseService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clases")
public class ClaseController {

	private final ClaseService claseService;
	private final ProgramacionClaseService programacionClaseService;

	public ClaseController(ClaseService claseService, ProgramacionClaseService programacionClaseService) {
		this.claseService = claseService;
		this.programacionClaseService = programacionClaseService;
	}

	@GetMapping
	public List<ClaseResponse> listarClases(
			@RequestHeader(value = "Authorization", required = false) String authorization
	) {
		return claseService.listarClases(authorization);
	}

	@GetMapping("/gimnasio/{gimnasioId}")
	public List<ClaseResponse> listarClasesPorGimnasio(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@PathVariable Long gimnasioId
	) {
		return claseService.listarClasesPorGimnasio(authorization, gimnasioId);
	}

	@GetMapping("/programaciones")
	public List<ProgramacionClaseResponse> listarProgramaciones(
			@RequestHeader(value = "Authorization", required = false) String authorization
	) {
		return programacionClaseService.listar(authorization);
	}

	@GetMapping("/programaciones/{id}")
	public ProgramacionClaseResponse consultarProgramacion(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@PathVariable Long id
	) {
		return programacionClaseService.consultar(authorization, id);
	}

	@PostMapping("/programaciones")
	public ProgramacionClaseResponse crearProgramacion(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@RequestBody ProgramacionClaseRequest request
	) {
		return programacionClaseService.crear(authorization, request);
	}

	@PutMapping("/programaciones/{id}")
	public ProgramacionClaseResponse actualizarProgramacion(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@PathVariable Long id,
			@RequestBody ProgramacionClaseRequest request
	) {
		return programacionClaseService.actualizar(authorization, id, request);
	}

	@DeleteMapping("/programaciones/{id}")
	public ProgramacionClaseResponse desactivarProgramacion(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@PathVariable Long id
	) {
		return programacionClaseService.desactivar(authorization, id);
	}

	@PostMapping
	public ClaseResponse crearClase(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@RequestBody ClaseRequest request
	) {
		return claseService.crearClase(authorization, request);
	}

	@PutMapping("/{id}")
	public ClaseResponse actualizarClase(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@PathVariable Long id,
			@RequestBody ClaseRequest request
	) {
		return claseService.actualizarClase(authorization, id, request);
	}

	@DeleteMapping("/{id}")
	public ClaseResponse desactivarClase(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@PathVariable Long id
	) {
		return claseService.desactivarClase(authorization, id);
	}
}
