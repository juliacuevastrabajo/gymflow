package com.julia.gymflow.dto;

import com.julia.gymflow.entity.EstadoMensaje;
import com.julia.gymflow.entity.FrecuenciaMensaje;
import com.julia.gymflow.entity.Mensaje;
import com.julia.gymflow.entity.PrioridadMensaje;
import com.julia.gymflow.entity.TipoAudienciaMensaje;
import com.julia.gymflow.entity.TipoProgramacionMensaje;
import com.julia.gymflow.entity.Usuario;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class MensajeResponse {

    private Long id;
    private String asunto;
    private String texto;
    private boolean automatico;
    private String conversacionId;
    private Long mensajePadreId;
    private TipoAudienciaMensaje audiencia;
    private EstadoMensaje estado;
    private TipoProgramacionMensaje tipoProgramacion;
    private FrecuenciaMensaje frecuencia;
    private PrioridadMensaje prioridad;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaProgramada;
    private LocalDateTime fechaEnvio;
    private Long gimnasioId;
    private String nombreGimnasio;
    private Long remitenteId;
    private String nombreRemitente;
    private List<Long> destinatarioIds;
    private List<Long> leidoPorUsuarioIds;
    private List<Long> interlocutorIds;
    private boolean leidoPorMi;
    private int destinatariosCount;

    public MensajeResponse(Mensaje mensaje) {
        this(mensaje, null, true);
    }

    public MensajeResponse(Mensaje mensaje, Usuario actor, boolean incluirListasPrivadas) {
        this.id = mensaje.getId();
        this.asunto = mensaje.getAsunto();
        this.texto = mensaje.getTexto();
        this.automatico = mensaje.isAutomatico();
        this.conversacionId = mensaje.getConversacionId();
        this.mensajePadreId = mensaje.getMensajePadreId();
        this.audiencia = mensaje.getAudiencia();
        this.estado = mensaje.getEstado();
        this.tipoProgramacion = mensaje.getTipoProgramacion();
        this.frecuencia = mensaje.getFrecuencia();
        this.prioridad = mensaje.getPrioridad();
        this.fechaCreacion = mensaje.getFechaCreacion();
        this.fechaProgramada = mensaje.getFechaProgramada();
        this.fechaEnvio = mensaje.getFechaEnvio();
        this.destinatariosCount = mensaje.getDestinatarioIds().size();

        if (incluirListasPrivadas) {
            this.destinatarioIds = new ArrayList<>(mensaje.getDestinatarioIds());
            this.leidoPorUsuarioIds = new ArrayList<>(mensaje.getLeidoPorUsuarioIds());
        }

        if (actor != null) {
            this.leidoPorMi = mensaje.getLeidoPorUsuarioIds().contains(actor.getId())
                    || (mensaje.getRemitente() != null && mensaje.getRemitente().getId().equals(actor.getId()));
            if (!incluirListasPrivadas) {
                this.interlocutorIds = resolverInterlocutores(mensaje, actor);
            }
        }

        if (mensaje.getGimnasio() != null) {
            this.gimnasioId = mensaje.getGimnasio().getId();
            this.nombreGimnasio = mensaje.getGimnasio().getNombre();
        }

        if (mensaje.getRemitente() != null) {
            this.remitenteId = mensaje.getRemitente().getId();
            this.nombreRemitente = mensaje.getRemitente().getNombre();
        }
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
        return prioridad;
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

    public Long getGimnasioId() {
        return gimnasioId;
    }

    public String getNombreGimnasio() {
        return nombreGimnasio;
    }

    public Long getRemitenteId() {
        return remitenteId;
    }

    public String getNombreRemitente() {
        return nombreRemitente;
    }

    public List<Long> getDestinatarioIds() {
        return destinatarioIds;
    }

    public List<Long> getLeidoPorUsuarioIds() {
        return leidoPorUsuarioIds;
    }

    public List<Long> getInterlocutorIds() {
        return interlocutorIds;
    }

    public boolean isLeidoPorMi() {
        return leidoPorMi;
    }

    public int getDestinatariosCount() {
        return destinatariosCount;
    }

    private List<Long> resolverInterlocutores(Mensaje mensaje, Usuario actor) {
        if (mensaje.getRemitente() != null && mensaje.getRemitente().getId().equals(actor.getId())) {
            return mensaje.getDestinatarioIds().stream()
                    .filter(id -> !id.equals(actor.getId()))
                    .toList();
        }

        if (mensaje.getRemitente() != null) {
            return List.of(mensaje.getRemitente().getId());
        }

        return List.of();
    }
}
