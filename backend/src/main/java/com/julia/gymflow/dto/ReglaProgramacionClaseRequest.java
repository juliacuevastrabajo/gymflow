package com.julia.gymflow.dto;

import java.time.LocalTime;

public class ReglaProgramacionClaseRequest {

    private Integer diaSemana;
    private LocalTime hora;

    public Integer getDiaSemana() { return diaSemana; }
    public LocalTime getHora() { return hora; }
    public void setDiaSemana(Integer diaSemana) { this.diaSemana = diaSemana; }
    public void setHora(LocalTime hora) { this.hora = hora; }
}
