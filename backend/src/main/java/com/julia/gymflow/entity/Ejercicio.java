package com.julia.gymflow.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "ejercicios")
public class Ejercicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "gimnasio_id", nullable = false)
    private Gimnasio gimnasio;

    @Column(nullable = false)
    private String nombre;

    @Column(length = 1200)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    private TipoMultimediaEjercicio tipoMultimedia = TipoMultimediaEjercicio.NINGUNO;

    private String multimediaUrl;

    private boolean activo = true;

    public Ejercicio() {
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

    public TipoMultimediaEjercicio getTipoMultimedia() {
        return tipoMultimedia;
    }

    public String getMultimediaUrl() {
        return multimediaUrl;
    }

    public boolean isActivo() {
        return activo;
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

    public void setTipoMultimedia(TipoMultimediaEjercicio tipoMultimedia) {
        this.tipoMultimedia = tipoMultimedia;
    }

    public void setMultimediaUrl(String multimediaUrl) {
        this.multimediaUrl = multimediaUrl;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }
}
