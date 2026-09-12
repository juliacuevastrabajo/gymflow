package com.julia.gymflow.dto;

import java.time.LocalDate;
import java.util.List;

public class ProgramacionClaseRequest {

    private String nombre;
    private String descripcion;
    private String imagenUrl;
    private Integer duracionMinutos;
    private Integer capacidadMaxima;
    private Long entrenadorId;
    private LocalDate fechaInicio;
    private List<ReglaProgramacionClaseRequest> reglas;

    public String getNombre() { return nombre; }
    public String getDescripcion() { return descripcion; }
    public String getImagenUrl() { return imagenUrl; }
    public Integer getDuracionMinutos() { return duracionMinutos; }
    public Integer getCapacidadMaxima() { return capacidadMaxima; }
    public Long getEntrenadorId() { return entrenadorId; }
    public LocalDate getFechaInicio() { return fechaInicio; }
    public List<ReglaProgramacionClaseRequest> getReglas() { return reglas; }

    public void setNombre(String nombre) { this.nombre = nombre; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public void setImagenUrl(String imagenUrl) { this.imagenUrl = imagenUrl; }
    public void setDuracionMinutos(Integer duracionMinutos) { this.duracionMinutos = duracionMinutos; }
    public void setCapacidadMaxima(Integer capacidadMaxima) { this.capacidadMaxima = capacidadMaxima; }
    public void setEntrenadorId(Long entrenadorId) { this.entrenadorId = entrenadorId; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }
    public void setReglas(List<ReglaProgramacionClaseRequest> reglas) { this.reglas = reglas; }
}
