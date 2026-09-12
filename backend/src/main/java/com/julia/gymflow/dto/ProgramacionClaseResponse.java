package com.julia.gymflow.dto;

import com.julia.gymflow.entity.ProgramacionClase;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

public class ProgramacionClaseResponse {

    private final Long id;
    private final Long gimnasioId;
    private final Long entrenadorId;
    private final String nombreEntrenador;
    private final String nombre;
    private final String descripcion;
    private final String imagenUrl;
    private final Integer duracionMinutos;
    private final Integer capacidadMaxima;
    private final LocalDate fechaInicio;
    private final boolean activa;
    private final LocalDateTime fechaCreacion;
    private final LocalDateTime fechaActualizacion;
    private final List<ReglaProgramacionClaseResponse> reglas;
    private final long sesionesFuturas;
    private final List<ClaseResponse> proximasSesiones;

    public ProgramacionClaseResponse(
            ProgramacionClase programacion,
            long sesionesFuturas,
            List<ClaseResponse> proximasSesiones
    ) {
        id = programacion.getId();
        gimnasioId = programacion.getGimnasio().getId();
        entrenadorId = programacion.getEntrenador().getId();
        nombreEntrenador = programacion.getEntrenador().getNombre();
        nombre = programacion.getNombre();
        descripcion = programacion.getDescripcion();
        imagenUrl = programacion.getImagenUrl();
        duracionMinutos = programacion.getDuracionMinutos();
        capacidadMaxima = programacion.getCapacidadMaxima();
        fechaInicio = programacion.getFechaInicio();
        activa = programacion.isActiva();
        fechaCreacion = programacion.getFechaCreacion();
        fechaActualizacion = programacion.getFechaActualizacion();
        reglas = programacion.getReglas().stream()
                .map(ReglaProgramacionClaseResponse::new)
                .sorted(Comparator.comparing(ReglaProgramacionClaseResponse::getDiaSemana)
                        .thenComparing(ReglaProgramacionClaseResponse::getHora))
                .toList();
        this.sesionesFuturas = sesionesFuturas;
        this.proximasSesiones = proximasSesiones;
    }

    public Long getId() { return id; }
    public Long getGimnasioId() { return gimnasioId; }
    public Long getEntrenadorId() { return entrenadorId; }
    public String getNombreEntrenador() { return nombreEntrenador; }
    public String getNombre() { return nombre; }
    public String getDescripcion() { return descripcion; }
    public String getImagenUrl() { return imagenUrl; }
    public Integer getDuracionMinutos() { return duracionMinutos; }
    public Integer getCapacidadMaxima() { return capacidadMaxima; }
    public LocalDate getFechaInicio() { return fechaInicio; }
    public boolean isActiva() { return activa; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public List<ReglaProgramacionClaseResponse> getReglas() { return reglas; }
    public long getSesionesFuturas() { return sesionesFuturas; }
    public List<ClaseResponse> getProximasSesiones() { return proximasSesiones; }
}
