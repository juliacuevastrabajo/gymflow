package com.julia.gymflow.dto;

import java.time.LocalDateTime;

public class ClaseRequest {

	private String nombre;
	private String descripcion;
	private String imagenUrl;
	private LocalDateTime fechaHora;
	private Integer duracionMinutos;
	private Integer capacidadMaxima;
	private Long gimnasioId;
	private Long entrenadorId;

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

	public Long getGimnasioId() {
		return gimnasioId;
	}

	public Long getEntrenadorId() {
		return entrenadorId;
	}

	public void setNombre(String nombre) {
		this.nombre = nombre;
	}

	public void setDescripcion(String descripcion) {
		this.descripcion = descripcion;
	}

	public void setImagenUrl(String imagenUrl) {
		this.imagenUrl = imagenUrl;
	}

	public void setFechaHora(LocalDateTime fechaHora) {
		this.fechaHora = fechaHora;
	}

	public void setDuracionMinutos(Integer duracionMinutos) {
		this.duracionMinutos = duracionMinutos;
	}

	public void setCapacidadMaxima(Integer capacidadMaxima) {
		this.capacidadMaxima = capacidadMaxima;
	}

	public void setGimnasioId(Long gimnasioId) {
		this.gimnasioId = gimnasioId;
	}

	public void setEntrenadorId(Long entrenadorId) {
		this.entrenadorId = entrenadorId;
	}
}
