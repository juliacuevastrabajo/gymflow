package com.julia.gymflow.dto;

import com.julia.gymflow.entity.RutinaAsignada;

import java.time.LocalDateTime;

public class RutinaAsignadaResponse {

    private Long id;
    private Long rutinaId;
    private Long clienteId;
    private String nombreCliente;
    private Long entrenadorId;
    private String nombreEntrenador;
    private LocalDateTime fechaAsignacion;
    private boolean activa;
    private RutinaResponse rutina;

    public RutinaAsignadaResponse(RutinaAsignada asignacion, RutinaResponse rutina) {
        this.id = asignacion.getId();
        this.fechaAsignacion = asignacion.getFechaAsignacion();
        this.activa = asignacion.isActiva();
        this.rutina = rutina;

        if (asignacion.getRutina() != null) {
            this.rutinaId = asignacion.getRutina().getId();
        }

        if (asignacion.getCliente() != null) {
            this.clienteId = asignacion.getCliente().getId();
            this.nombreCliente = asignacion.getCliente().getNombre();
        }

        if (asignacion.getEntrenador() != null) {
            this.entrenadorId = asignacion.getEntrenador().getId();
            this.nombreEntrenador = asignacion.getEntrenador().getNombre();
        }
    }

    public Long getId() {
        return id;
    }

    public Long getRutinaId() {
        return rutinaId;
    }

    public Long getClienteId() {
        return clienteId;
    }

    public String getNombreCliente() {
        return nombreCliente;
    }

    public Long getEntrenadorId() {
        return entrenadorId;
    }

    public String getNombreEntrenador() {
        return nombreEntrenador;
    }

    public LocalDateTime getFechaAsignacion() {
        return fechaAsignacion;
    }

    public boolean isActiva() {
        return activa;
    }

    public RutinaResponse getRutina() {
        return rutina;
    }
}
