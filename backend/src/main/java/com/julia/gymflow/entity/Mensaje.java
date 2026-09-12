package com.julia.gymflow.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "mensajes")
public class Mensaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 140)
    private String asunto;

    @Column(columnDefinition = "TEXT")
    private String texto;

    private boolean automatico;

    @Column(length = 80)
    private String conversacionId;

    private Long mensajePadreId;

    @Enumerated(EnumType.STRING)
    private TipoAudienciaMensaje audiencia = TipoAudienciaMensaje.TODOS;

    @Enumerated(EnumType.STRING)
    private EstadoMensaje estado = EstadoMensaje.ENVIADO;

    @Enumerated(EnumType.STRING)
    private TipoProgramacionMensaje tipoProgramacion = TipoProgramacionMensaje.AHORA;

    @Enumerated(EnumType.STRING)
    private FrecuenciaMensaje frecuencia = FrecuenciaMensaje.NINGUNA;

    @Enumerated(EnumType.STRING)
    private PrioridadMensaje prioridad = PrioridadMensaje.NORMAL;

    private LocalDateTime fechaCreacion;

    private LocalDateTime fechaProgramada;

    private LocalDateTime fechaEnvio;

    private boolean activo = true;

    @Column(name = "destinatarios_materializados")
    private Boolean destinatariosMaterializados;

    @Column(name = "bienvenida_usuario_id", unique = true)
    private Long bienvenidaUsuarioId;

    @ManyToOne
    @JoinColumn(name = "gimnasio_id")
    private Gimnasio gimnasio;

    @ManyToOne
    @JoinColumn(name = "remitente_id")
    private Usuario remitente;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "mensaje_destinatarios", joinColumns = @JoinColumn(name = "mensaje_id"))
    @Column(name = "usuario_id")
    private Set<Long> destinatarioIds = new LinkedHashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "mensaje_leidos", joinColumns = @JoinColumn(name = "mensaje_id"))
    @Column(name = "usuario_id")
    private Set<Long> leidoPorUsuarioIds = new LinkedHashSet<>();

    public Mensaje() {
    }

    public Long getId() {
        return id;
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

    public EstadoMensaje getEstado() {
        return estado;
    }

    public TipoProgramacionMensaje getTipoProgramacion() {
        return tipoProgramacion;
    }

    public FrecuenciaMensaje getFrecuencia() {
        return frecuencia;
    }

    public PrioridadMensaje getPrioridad() {
        return prioridad != null ? prioridad : PrioridadMensaje.NORMAL;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public LocalDateTime getFechaProgramada() {
        return fechaProgramada;
    }

    public LocalDateTime getFechaEnvio() {
        return fechaEnvio;
    }

    public boolean isActivo() {
        return activo;
    }

    public boolean isDestinatariosMaterializados() {
        return Boolean.TRUE.equals(destinatariosMaterializados);
    }

    public Boolean getDestinatariosMaterializados() {
        return destinatariosMaterializados;
    }

    public Long getBienvenidaUsuarioId() {
        return bienvenidaUsuarioId;
    }

    public Gimnasio getGimnasio() {
        return gimnasio;
    }

    public Usuario getRemitente() {
        return remitente;
    }

    public Set<Long> getDestinatarioIds() {
        return destinatarioIds;
    }

    public Set<Long> getLeidoPorUsuarioIds() {
        return leidoPorUsuarioIds;
    }

    public void setId(Long id) {
        this.id = id;
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

    public void setEstado(EstadoMensaje estado) {
        this.estado = estado;
    }

    public void setTipoProgramacion(TipoProgramacionMensaje tipoProgramacion) {
        this.tipoProgramacion = tipoProgramacion;
    }

    public void setFrecuencia(FrecuenciaMensaje frecuencia) {
        this.frecuencia = frecuencia;
    }

    public void setPrioridad(PrioridadMensaje prioridad) {
        this.prioridad = prioridad != null ? prioridad : PrioridadMensaje.NORMAL;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public void setFechaProgramada(LocalDateTime fechaProgramada) {
        this.fechaProgramada = fechaProgramada;
    }

    public void setFechaEnvio(LocalDateTime fechaEnvio) {
        this.fechaEnvio = fechaEnvio;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public void setDestinatariosMaterializados(Boolean destinatariosMaterializados) {
        this.destinatariosMaterializados = destinatariosMaterializados;
    }

    public void setBienvenidaUsuarioId(Long bienvenidaUsuarioId) {
        this.bienvenidaUsuarioId = bienvenidaUsuarioId;
    }

    public void setGimnasio(Gimnasio gimnasio) {
        this.gimnasio = gimnasio;
    }

    public void setRemitente(Usuario remitente) {
        this.remitente = remitente;
    }

    public void setDestinatarioIds(Set<Long> destinatarioIds) {
        this.destinatarioIds = destinatarioIds;
    }

    public void setLeidoPorUsuarioIds(Set<Long> leidoPorUsuarioIds) {
        this.leidoPorUsuarioIds = leidoPorUsuarioIds;
    }
}
