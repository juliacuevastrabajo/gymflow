package com.julia.gymflow.controller;

import org.springframework.web.bind.annotation.*;

import com.julia.gymflow.dto.ActualizarGimnasioRequest;
import com.julia.gymflow.dto.GimnasioResponse;
import com.julia.gymflow.service.GimnasioService;

import java.util.List;

@RestController
@RequestMapping("/api/gimnasios")
public class GimnasioController {

	private final GimnasioService gimnasioService;

	public GimnasioController(GimnasioService gimnasioService) {
		this.gimnasioService = gimnasioService;
	}

	@GetMapping
	public List<GimnasioResponse> listarGimnasios(
			@RequestHeader(value = "Authorization", required = false) String authorization
	) {
		return gimnasioService.listarGimnasios(authorization);
	}

	@GetMapping("/me")
	public GimnasioResponse obtenerMiGimnasio(
			@RequestHeader(value = "Authorization", required = false) String authorization
	) {
		return gimnasioService.obtenerMiGimnasio(authorization);
	}

	@GetMapping("/{id}")
	public GimnasioResponse buscarGimnasioPorId(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@PathVariable Long id
	) {
		return gimnasioService.buscarPorId(authorization, id);
	}

	@PostMapping
	public GimnasioResponse crearGimnasio(
			@RequestHeader(value = "Authorization", required = false) String authorization
	) {
		return gimnasioService.crearGimnasio(authorization);
	}

	@PutMapping("/{id}")
	public GimnasioResponse actualizarGimnasio(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@PathVariable Long id,
			@RequestBody ActualizarGimnasioRequest request
	) {
		return gimnasioService.actualizarGimnasio(authorization, id, request);
	}

	@DeleteMapping("/{id}")
	public void eliminarGimnasio(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@PathVariable Long id
	) {
		gimnasioService.eliminarGimnasio(authorization, id);
	}

}
