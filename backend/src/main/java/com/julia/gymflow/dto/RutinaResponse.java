package com.julia.gymflow.dto;

import com.julia.gymflow.entity.Rutina;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class RutinaResponse {

    private Long id;
    private Long gimnasioId;
    private String nombreGimnasio;
    private String nombre;
    private String descripcion;
    private String nivel;
    private Integer duracionEstimadaMinutos;
    private Long creadorId;
    private String nombreCreador;
    private LocalDateTime fechaCreacion;
    private boolean activa;
    private List<RutinaEjercicioResponse> ejercicios = new ArrayList<>();
    private int totalAsignacionesActivas;

    public RutinaResponse(
            Rutina rutina,
            List<RutinaEjercicioResponse> ejercicios,
            int totalAsignacionesActivas
    ) {
        this.id = rutina.getId();
        this.nombre = rutina.getNombre();
        this.descripcion = rutina.getDescripcion();
        this.nivel = rutina.getNivel();
        this.duracionEstimadaMinutos = rutina.getDuracionEstimadaMinutos();
        this.fechaCreacion = rutina.getFechaCreacion();
        this.activa = rutina.isActiva();
        this.ejercicios = ejercicios != null ? ejercicios : new ArrayList<>();
        this.totalAsignacionesActivas = totalAsignacionesActivas;

        if (rutina.getGimnasio() != null) {
            this.gimnasioId = rutina.getGimnasio().getId();
            this.nombreGimnasio = rutina.getGimnasio().getNombre();
        }

        if (rutina.getCreador() != null) {
            this.creadorId = rutina.getCreador().getId();
            this.nombreCreador = rutina.getCreador().getNombre();
        }
    }

    public Long getId() {
        return id;
    }

    public Long getGimnasioId() {
        return gimnasioId;
    }

    public String getNombreGimnasio() {
        return nombreGimnasio;
    }

    public String getNombre() {
        return nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public String getNivel() {
        return nivel;
    }

    public Integer getDuracionEstimadaMinutos() {
        return duracionEstimadaMinutos;
    }

    public Long getCreadorId() {
        return creadorId;
    }

    public String getNombreCreador() {
        return nombreCreador;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public boolean isActiva() {
        return activa;
    }

    public List<RutinaEjercicioResponse> getEjercicios() {
        return ejercicios;
    }

    public int getTotalAsignacionesActivas() {
        return totalAsignacionesActivas;
    }
}
