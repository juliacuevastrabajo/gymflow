package com.julia.gymflow.dto;

public class RutinaEjercicioRequest {

    private Long ejercicioId;
    private Integer orden;
    private Integer series;
    private String repeticiones;
    private Integer descansoSegundos;
    private Double peso;
    private String notas;

    public Long getEjercicioId() {
        return ejercicioId;
    }

    public Integer getOrden() {
        return orden;
    }

    public Integer getSeries() {
        return series;
    }

    public String getRepeticiones() {
        return repeticiones;
    }

    public Integer getDescansoSegundos() {
        return descansoSegundos;
    }

    public Double getPeso() {
        return peso;
    }

    public String getNotas() {
        return notas;
    }

    public void setEjercicioId(Long ejercicioId) {
        this.ejercicioId = ejercicioId;
    }

    public void setOrden(Integer orden) {
        this.orden = orden;
    }

    public void setSeries(Integer series) {
        this.series = series;
    }

    public void setRepeticiones(String repeticiones) {
        this.repeticiones = repeticiones;
    }

    public void setDescansoSegundos(Integer descansoSegundos) {
        this.descansoSegundos = descansoSegundos;
    }

    public void setPeso(Double peso) {
        this.peso = peso;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }
}
