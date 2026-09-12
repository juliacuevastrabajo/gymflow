package com.julia.gymflow.dto;

import com.julia.gymflow.entity.Ejercicio;
import com.julia.gymflow.entity.TipoMultimediaEjercicio;

public class EjercicioResponse {

    private Long id;
    private Long gimnasioId;
    private String nombre;
    private String descripcion;
    private TipoMultimediaEjercicio tipoMultimedia;
    private String multimediaUrl;
    private boolean activo;

    public EjercicioResponse(Ejercicio ejercicio) {
        this.id = ejercicio.getId();
        this.nombre = ejercicio.getNombre();
        this.descripcion = ejercicio.getDescripcion();
        this.tipoMultimedia = ejercicio.getTipoMultimedia();
        this.multimediaUrl = ejercicio.getMultimediaUrl();
        this.activo = ejercicio.isActivo();

        if (ejercicio.getGimnasio() != null) {
            this.gimnasioId = ejercicio.getGimnasio().getId();
        }
    }

    public Long getId() {
        return id;
    }

    public Long getGimnasioId() {
        return gimnasioId;
    }

    public String getNombre() {
        return nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public TipoMultimediaEjercicio getTipoMultimedia() {
        return tipoMultimedia;
    }

    public String getMultimediaUrl() {
        return multimediaUrl;
    }

    public boolean isActivo() {
        return activo;
    }
}
