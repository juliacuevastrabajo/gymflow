package com.julia.gymflow.dto;

import com.julia.gymflow.entity.TipoMultimediaEjercicio;

public class EjercicioRequest {

    private String nombre;
    private String descripcion;
    private TipoMultimediaEjercicio tipoMultimedia;
    private String multimediaUrl;

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

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public void setTipoMultimedia(TipoMultimediaEjercicio tipoMultimedia) {
        this.tipoMultimedia = tipoMultimedia;
    }

    public void setMultimediaUrl(String multimediaUrl) {
        this.multimediaUrl = multimediaUrl;
    }
}
