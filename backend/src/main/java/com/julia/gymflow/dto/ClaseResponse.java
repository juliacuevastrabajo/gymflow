package com.julia.gymflow.dto;

import com.julia.gymflow.entity.Clase;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

public class ClaseResponse {

	private Long id;
	private String nombre;
	private String descripcion;
	private String imagenUrl;
	private LocalDateTime fechaHora;
	private Integer duracionMinutos;
	private Integer capacidadMaxima;
	private boolean activa;
	private Long gimnasioId;
	private String nombreGimnasio;
	private Long entrenadorId;
	private String nombreEntrenador;
	private Long programacionId;
	private boolean programacionActiva;
	private LocalDate programacionFechaInicio;
	private List<ReglaProgramacionClaseResponse> reglasProgramacion;

	public ClaseResponse(Clase clase) {
		this.id = clase.getId();
		this.nombre = clase.getNombre();
		this.descripcion = clase.getDescripcion();
		this.imagenUrl = clase.getImagenUrl();
		this.fechaHora = clase.getFechaHora();
		this.duracionMinutos = clase.getDuracionMinutos();
		this.capacidadMaxima = clase.getCapacidadMaxima();
		this.activa = clase.isActiva();

		if (clase.getGimnasio() != null) {
			this.gimnasioId = clase.getGimnasio().getId();
			this.nombreGimnasio = clase.getGimnasio().getNombre();
		}

		if (clase.getEntrenador() != null) {
			this.entrenadorId = clase.getEntrenador().getId();
			this.nombreEntrenador = clase.getEntrenador().getNombre();
		}

		if (clase.getProgramacion() != null) {
			this.programacionId = clase.getProgramacion().getId();
			this.programacionActiva = clase.getProgramacion().isActiva();
			this.programacionFechaInicio = clase.getProgramacion().getFechaInicio();
			this.reglasProgramacion = clase.getProgramacion().getReglas().stream()
					.map(ReglaProgramacionClaseResponse::new)
					.sorted(Comparator.comparing(ReglaProgramacionClaseResponse::getDiaSemana)
							.thenComparing(ReglaProgramacionClaseResponse::getHora))
					.toList();
		}
	}

	public Long getId() {
		return id;
	}

	public String getNombre() {
		return nombre;
	}

	public String getDescripcion() {
		return descripcion;
	}

	public String getImagenUrl() {
		return imagenUrl;
	}

	public LocalDateTime getFechaHora() {
		return fechaHora;
	}

	public Integer getDuracionMinutos() {
		return duracionMinutos;
	}

	public Integer getCapacidadMaxima() {
		return capacidadMaxima;
	}

	public boolean isActiva() {
		return activa;
	}

	public Long getGimnasioId() {
		return gimnasioId;
	}

	public String getNombreGimnasio() {
		return nombreGimnasio;
	}

	public Long getEntrenadorId() {
		return entrenadorId;
	}

	public String getNombreEntrenador() {
		return nombreEntrenador;
	}

	public Long getProgramacionId() {
		return programacionId;
	}

	public boolean isProgramacionActiva() {
		return programacionActiva;
	}

	public LocalDate getProgramacionFechaInicio() {
		return programacionFechaInicio;
	}

	public List<ReglaProgramacionClaseResponse> getReglasProgramacion() {
		return reglasProgramacion;
	}
}
