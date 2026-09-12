package com.julia.gymflow.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "clases",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_clase_programacion_fecha",
                columnNames = {"programacion_id", "fecha_hora"}
        )
)
public class Clase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;

    private String descripcion;

    private String imagenUrl;

    private LocalDateTime fechaHora;

    private Integer duracionMinutos;

    private Integer capacidadMaxima;

    private boolean activa = true;

    @ManyToOne
    @JoinColumn(name = "gimnasio_id")
    private Gimnasio gimnasio;

    @ManyToOne
    @JoinColumn(name = "entrenador_id")
    private Usuario entrenador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "programacion_id")
    private ProgramacionClase programacion;

    public Clase() {
    }

    public Long getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public String getImagenUrl() {
        return imagenUrl;
    }

    public LocalDateTime getFechaHora() {
        return fechaHora;
    }

    public Integer getDuracionMinutos() {
        return duracionMinutos;
    }

    public Integer getCapacidadMaxima() {
        return capacidadMaxima;
    }

    public boolean isActiva() {
        return activa;
    }

    public Gimnasio getGimnasio() {
        return gimnasio;
    }

    public Usuario getEntrenador() {
        return entrenador;
    }

    public ProgramacionClase getProgramacion() {
        return programacion;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public void setImagenUrl(String imagenUrl) {
        this.imagenUrl = imagenUrl;
    }

    public void setFechaHora(LocalDateTime fechaHora) {
        this.fechaHora = fechaHora;
    }

    public void setDuracionMinutos(Integer duracionMinutos) {
        this.duracionMinutos = duracionMinutos;
    }

    public void setCapacidadMaxima(Integer capacidadMaxima) {
        this.capacidadMaxima = capacidadMaxima;
    }

    public void setActiva(boolean activa) {
        this.activa = activa;
    }

    public void setGimnasio(Gimnasio gimnasio) {
        this.gimnasio = gimnasio;
    }

    public void setEntrenador(Usuario entrenador) {
        this.entrenador = entrenador;
    }

    public void setProgramacion(ProgramacionClase programacion) {
        this.programacion = programacion;
    }
}
