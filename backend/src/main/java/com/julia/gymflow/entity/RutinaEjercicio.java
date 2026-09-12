package com.julia.gymflow.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "rutina_ejercicios")
public class RutinaEjercicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "rutina_id", nullable = false)
    private Rutina rutina;

    @ManyToOne
    @JoinColumn(name = "ejercicio_id", nullable = false)
    private Ejercicio ejercicio;

    @Column(name = "orden_ejercicio")
    private Integer orden;

    private Integer series;

    private String repeticiones;

    private Integer descansoSegundos;

    private Double peso;

    @Column(length = 1200)
    private String notas;

    public RutinaEjercicio() {
    }

    public Long getId() {
        return id;
    }

    public Rutina getRutina() {
        return rutina;
    }

    public Ejercicio getEjercicio() {
        return ejercicio;
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

    public void setId(Long id) {
        this.id = id;
    }

    public void setRutina(Rutina rutina) {
        this.rutina = rutina;
    }

    public void setEjercicio(Ejercicio ejercicio) {
        this.ejercicio = ejercicio;
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
