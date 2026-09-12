package com.julia.gymflow.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rutina_asignaciones")
public class RutinaAsignada {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "rutina_id", nullable = false)
    private Rutina rutina;

    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    private Usuario cliente;

    @ManyToOne
    @JoinColumn(name = "entrenador_id", nullable = false)
    private Usuario entrenador;

    private LocalDateTime fechaAsignacion;

    private boolean activa = true;

    public RutinaAsignada() {
    }

    public Long getId() {
        return id;
    }

    public Rutina getRutina() {
        return rutina;
    }

    public Usuario getCliente() {
        return cliente;
    }

    public Usuario getEntrenador() {
        return entrenador;
    }

    public LocalDateTime getFechaAsignacion() {
        return fechaAsignacion;
    }

    public boolean isActiva() {
        return activa;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setRutina(Rutina rutina) {
        this.rutina = rutina;
    }

    public void setCliente(Usuario cliente) {
        this.cliente = cliente;
    }

    public void setEntrenador(Usuario entrenador) {
        this.entrenador = entrenador;
    }

    public void setFechaAsignacion(LocalDateTime fechaAsignacion) {
        this.fechaAsignacion = fechaAsignacion;
    }

    public void setActiva(boolean activa) {
        this.activa = activa;
    }
}
