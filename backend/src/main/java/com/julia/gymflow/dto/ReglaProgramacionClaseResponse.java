package com.julia.gymflow.dto;

import com.julia.gymflow.entity.ReglaProgramacionClase;

import java.time.LocalTime;

public class ReglaProgramacionClaseResponse {

    private final Long id;
    private final Integer diaSemana;
    private final LocalTime hora;

    public ReglaProgramacionClaseResponse(ReglaProgramacionClase regla) {
        id = regla.getId();
        diaSemana = regla.getDiaSemana();
        hora = regla.getHora();
    }

    public Long getId() { return id; }
    public Integer getDiaSemana() { return diaSemana; }
    public LocalTime getHora() { return hora; }
}
