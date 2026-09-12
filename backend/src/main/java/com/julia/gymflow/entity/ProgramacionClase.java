package com.julia.gymflow.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "programaciones_clase")
public class ProgramacionClase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "gimnasio_id", nullable = false)
    private Gimnasio gimnasio;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entrenador_id", nullable = false)
    private Usuario entrenador;

    @Column(nullable = false)
    private String nombre;

    private String descripcion;

    private String imagenUrl;

    @Column(nullable = false)
    private Integer duracionMinutos;

    @Column(nullable = false)
    private Integer capacidadMaxima;

    @Column(nullable = false)
    private LocalDate fechaInicio;

    @Column(nullable = false)
    private boolean activa = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(nullable = false)
    private LocalDateTime fechaActualizacion;

    @Column(name = "legacy_fingerprint", unique = true, length = 64)
    private String legacyFingerprint;

    @OneToMany(mappedBy = "programacion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReglaProgramacionClase> reglas = new ArrayList<>();

    @PrePersist
    void prePersist() {
        LocalDateTime ahora = LocalDateTime.now();
        fechaCreacion = fechaCreacion == null ? ahora : fechaCreacion;
        fechaActualizacion = ahora;
    }

    @PreUpdate
    void preUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }

    public void reemplazarReglas(List<ReglaProgramacionClase> nuevasReglas) {
        reglas.clear();
        nuevasReglas.forEach(regla -> {
            regla.setProgramacion(this);
            reglas.add(regla);
        });
    }

    public Long getId() { return id; }
    public Gimnasio getGimnasio() { return gimnasio; }
    public Usuario getEntrenador() { return entrenador; }
    public String getNombre() { return nombre; }
    public String getDescripcion() { return descripcion; }
    public String getImagenUrl() { return imagenUrl; }
    public Integer getDuracionMinutos() { return duracionMinutos; }
    public Integer getCapacidadMaxima() { return capacidadMaxima; }
    public LocalDate getFechaInicio() { return fechaInicio; }
    public boolean isActiva() { return activa; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public String getLegacyFingerprint() { return legacyFingerprint; }
    public List<ReglaProgramacionClase> getReglas() { return reglas; }

    public void setId(Long id) { this.id = id; }
    public void setGimnasio(Gimnasio gimnasio) { this.gimnasio = gimnasio; }
    public void setEntrenador(Usuario entrenador) { this.entrenador = entrenador; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public void setImagenUrl(String imagenUrl) { this.imagenUrl = imagenUrl; }
    public void setDuracionMinutos(Integer duracionMinutos) { this.duracionMinutos = duracionMinutos; }
    public void setCapacidadMaxima(Integer capacidadMaxima) { this.capacidadMaxima = capacidadMaxima; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }
    public void setActiva(boolean activa) { this.activa = activa; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }
    public void setLegacyFingerprint(String legacyFingerprint) { this.legacyFingerprint = legacyFingerprint; }
}
