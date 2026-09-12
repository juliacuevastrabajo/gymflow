package com.julia.gymflow.dto;

import com.julia.gymflow.entity.EstadoMensaje;
import com.julia.gymflow.entity.FrecuenciaMensaje;
import com.julia.gymflow.entity.PrioridadMensaje;
import com.julia.gymflow.entity.TipoAudienciaMensaje;
import com.julia.gymflow.entity.TipoProgramacionMensaje;

import java.time.LocalDateTime;
import java.util.List;

public class MensajeRequest {

    private Long gimnasioId;
    private Long remitenteId;
    private String asunto;
    private String texto;
    private boolean automatico;
    private String conversacionId;
    private Long mensajePadreId;
    private TipoAudienciaMensaje audiencia;
    private TipoProgramacionMensaje tipoProgramacion;
    private FrecuenciaMensaje frecuencia;
    private PrioridadMensaje prioridad;
    private EstadoMensaje estado;
    private LocalDateTime fechaProgramada;
    private List<Long> destinatarioIds;

    public Long getGimnasioId() {
        return gimnasioId;
    }

    public Long getRemitenteId() {
        return remitenteId;
    }

    public String getAsunto() {
        return asunto;
    }

    public String getTexto() {
        return texto;
    }

    public boolean isAutomatico() {
        return automatico;
    }

    public String getConversacionId() {
        return conversacionId;
    }

    public Long getMensajePadreId() {
        return mensajePadreId;
    }

    public TipoAudienciaMensaje getAudiencia() {
        return audiencia;
    }

    public TipoProgramacionMensaje getTipoProgramacion() {
        return tipoProgramacion;
    }

    public FrecuenciaMensaje getFrecuencia() {
        return frecuencia;
    }

    public PrioridadMensaje getPrioridad() {
        return prioridad;
    }

    public EstadoMensaje getEstado() {
        return estado;
    }

    public LocalDateTime getFechaProgramada() {
        return fechaProgramada;
    }

    public List<Long> getDestinatarioIds() {
        return destinatarioIds;
    }

    public void setGimnasioId(Long gimnasioId) {
        this.gimnasioId = gimnasioId;
    }

    public void setRemitenteId(Long remitenteId) {
        this.remitenteId = remitenteId;
    }

    public void setAsunto(String asunto) {
        this.asunto = asunto;
    }

    public void setTexto(String texto) {
        this.texto = texto;
    }

    public void setAutomatico(boolean automatico) {
        this.automatico = automatico;
    }

    public void setConversacionId(String conversacionId) {
        this.conversacionId = conversacionId;
    }

    public void setMensajePadreId(Long mensajePadreId) {
        this.mensajePadreId = mensajePadreId;
    }

    public void setAudiencia(TipoAudienciaMensaje audiencia) {
        this.audiencia = audiencia;
    }

    public void setTipoProgramacion(TipoProgramacionMensaje tipoProgramacion) {
        this.tipoProgramacion = tipoProgramacion;
    }

    public void setFrecuencia(FrecuenciaMensaje frecuencia) {
        this.frecuencia = frecuencia;
    }

    public void setPrioridad(PrioridadMensaje prioridad) {
        this.prioridad = prioridad;
    }

    public void setEstado(EstadoMensaje estado) {
        this.estado = estado;
    }

    public void setFechaProgramada(LocalDateTime fechaProgramada) {
        this.fechaProgramada = fechaProgramada;
    }

    public void setDestinatarioIds(List<Long> destinatarioIds) {
        this.destinatarioIds = destinatarioIds;
    }
}
