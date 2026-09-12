package com.julia.gymflow.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalTime;

@Entity
@Table(
        name = "reglas_programacion_clase",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_regla_programacion_dia_hora",
                columnNames = {"programacion_id", "dia_semana", "hora"}
        )
)
public class ReglaProgramacionClase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "programacion_id", nullable = false)
    private ProgramacionClase programacion;

    @Column(name = "dia_semana", nullable = false)
    private Integer diaSemana;

    @Column(nullable = false)
    private LocalTime hora;

    public Long getId() { return id; }
    public ProgramacionClase getProgramacion() { return programacion; }
    public Integer getDiaSemana() { return diaSemana; }
    public LocalTime getHora() { return hora; }

    public void setId(Long id) { this.id = id; }
    public void setProgramacion(ProgramacionClase programacion) { this.programacion = programacion; }
    public void setDiaSemana(Integer diaSemana) { this.diaSemana = diaSemana; }
    public void setHora(LocalTime hora) { this.hora = hora; }
}
