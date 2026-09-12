package com.julia.gymflow.dto;

public class RutinaRequest {

    private String nombre;
    private String descripcion;
    private String nivel;
    private Integer duracionEstimadaMinutos;

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

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public void setNivel(String nivel) {
        this.nivel = nivel;
    }

    public void setDuracionEstimadaMinutos(Integer duracionEstimadaMinutos) {
        this.duracionEstimadaMinutos = duracionEstimadaMinutos;
    }
}
