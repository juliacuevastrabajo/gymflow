package com.julia.gymflow.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rutinas")
public class Rutina {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "gimnasio_id", nullable = false)
    private Gimnasio gimnasio;

    @Column(nullable = false)
    private String nombre;

    @Column(length = 1600)
    private String descripcion;

    private String nivel;

    private Integer duracionEstimadaMinutos;

    @ManyToOne
    @JoinColumn(name = "creador_id", nullable = false)
    private Usuario creador;

    private LocalDateTime fechaCreacion;

    private boolean activa = true;

    public Rutina() {
    }

    public Long getId() {
        return id;
    }

    public Gimnasio getGimnasio() {
        return gimnasio;
    }

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

    public Usuario getCreador() {
        return creador;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public boolean isActiva() {
        return activa;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setGimnasio(Gimnasio gimnasio) {
        this.gimnasio = gimnasio;
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

    public void setCreador(Usuario creador) {
        this.creador = creador;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public void setActiva(boolean activa) {
        this.activa = activa;
    }
}
