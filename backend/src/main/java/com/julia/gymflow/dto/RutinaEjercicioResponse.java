package com.julia.gymflow.dto;

import com.julia.gymflow.entity.RutinaEjercicio;

public class RutinaEjercicioResponse {

    private Long id;
    private Long rutinaId;
    private Integer orden;
    private Integer series;
    private String repeticiones;
    private Integer descansoSegundos;
    private Double peso;
    private String notas;
    private EjercicioResponse ejercicio;

    public RutinaEjercicioResponse(RutinaEjercicio rutinaEjercicio) {
        this.id = rutinaEjercicio.getId();
        this.orden = rutinaEjercicio.getOrden();
        this.series = rutinaEjercicio.getSeries();
        this.repeticiones = rutinaEjercicio.getRepeticiones();
        this.descansoSegundos = rutinaEjercicio.getDescansoSegundos();
        this.peso = rutinaEjercicio.getPeso();
        this.notas = rutinaEjercicio.getNotas();

        if (rutinaEjercicio.getRutina() != null) {
            this.rutinaId = rutinaEjercicio.getRutina().getId();
        }

        if (rutinaEjercicio.getEjercicio() != null) {
            this.ejercicio = new EjercicioResponse(rutinaEjercicio.getEjercicio());
        }
    }

    public Long getId() {
        return id;
    }

    public Long getRutinaId() {
        return rutinaId;
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

    public EjercicioResponse getEjercicio() {
        return ejercicio;
    }
}
