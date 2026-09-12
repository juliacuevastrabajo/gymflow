package com.julia.gymflow.service;

import com.julia.gymflow.dto.MensajeRequest;
import com.julia.gymflow.dto.MensajeResponse;
import com.julia.gymflow.entity.EstadoMensaje;
import com.julia.gymflow.entity.FrecuenciaMensaje;
import com.julia.gymflow.entity.Mensaje;
import com.julia.gymflow.entity.PrioridadMensaje;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.TipoAudienciaMensaje;
import com.julia.gymflow.entity.TipoProgramacionMensaje;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.MensajeRepository;
import com.julia.gymflow.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
public class MensajeService {

    private final MensajeRepository mensajeRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuthTokenService authTokenService;
    private final MensajeDestinatarioService destinatarioService;

    public MensajeService(
            MensajeRepository mensajeRepository,
            UsuarioRepository usuarioRepository,
            AuthTokenService authTokenService,
            MensajeDestinatarioService destinatarioService
    ) {
        this.mensajeRepository = mensajeRepository;
        this.usuarioRepository = usuarioRepository;
        this.authTokenService = authTokenService;
        this.destinatarioService = destinatarioService;
    }

    @Transactional(readOnly = true)
    public List<MensajeResponse> listarMensajes(String authorizationHeader) {
        Usuario admin = exigirAdminActivo(authorizationHeader);
        return listarDelGimnasio(admin).stream()
                .map(mensaje -> respuesta(mensaje, admin))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MensajeResponse> listarMisMensajes(String authorizationHeader) {
        Usuario actor = obtenerActorActivo(authorizationHeader);
        return listarDelGimnasio(actor).stream()
                .filter(mensaje -> mensajeEsVisibleParaUsuario(mensaje, actor))
                .map(mensaje -> respuesta(mensaje, actor))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MensajeResponse> listarMensajesPorGimnasio(
            String authorizationHeader,
            Long gimnasioId
    ) {
        Usuario admin = exigirAdminActivo(authorizationHeader);
        if (!Objects.equals(admin.getGimnasio().getId(), gimnasioId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes consultar otro gimnasio.");
        }
        return listarDelGimnasio(admin).stream()
                .map(mensaje -> respuesta(mensaje, admin))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MensajeResponse> listarMensajesPorUsuario(
            String authorizationHeader,
            Long usuarioId
    ) {
        Usuario actor = obtenerActorActivo(authorizationHeader);
        if (!Objects.equals(actor.getId(), usuarioId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes consultar mensajes de otro usuario.");
        }
        return listarDelGimnasio(actor).stream()
                .filter(mensaje -> mensajeEsVisibleParaUsuario(mensaje, actor))
                .map(mensaje -> respuesta(mensaje, actor))
                .toList();
    }

    @Transactional
    public MensajeResponse crearMensaje(String authorizationHeader, MensajeRequest request) {
        Usuario actor = obtenerActorActivo(authorizationHeader);
        validarContenido(request);

        TipoAudienciaMensaje audiencia = request.getAudiencia() != null
                ? request.getAudiencia()
                : TipoAudienciaMensaje.TODOS;
        TipoProgramacionMensaje tipoProgramacion = request.getTipoProgramacion() != null
                ? request.getTipoProgramacion()
                : TipoProgramacionMensaje.AHORA;
        FrecuenciaMensaje frecuencia = request.getFrecuencia() != null
                ? request.getFrecuencia()
                : FrecuenciaMensaje.NINGUNA;
        PrioridadMensaje prioridad = request.getPrioridad() != null
                ? request.getPrioridad()
                : PrioridadMensaje.NORMAL;
        LinkedHashSet<Long> destinatariosSolicitados = request.getDestinatarioIds() == null
                ? new LinkedHashSet<>()
                : new LinkedHashSet<>(request.getDestinatarioIds());

        validarProgramacion(tipoProgramacion, frecuencia, request.getFechaProgramada());
        validarPermisosDeEnvio(actor, audiencia, destinatariosSolicitados, tipoProgramacion, request.isAutomatico());

        Mensaje mensajePadre = resolverMensajePadre(request.getMensajePadreId(), actor);
        LocalDateTime ahora = LocalDateTime.now();
        Mensaje mensaje = new Mensaje();
        mensaje.setAsunto(request.getAsunto().trim());
        mensaje.setTexto(request.getTexto().trim());
        mensaje.setAutomatico(request.isAutomatico() || tipoProgramacion != TipoProgramacionMensaje.AHORA);
        mensaje.setConversacionId(resolverConversacionId(request, mensajePadre));
        mensaje.setMensajePadreId(mensajePadre != null ? mensajePadre.getId() : null);
        mensaje.setAudiencia(audiencia);
        mensaje.setTipoProgramacion(tipoProgramacion);
        mensaje.setFrecuencia(tipoProgramacion == TipoProgramacionMensaje.RECURRENTE
                ? frecuencia
                : FrecuenciaMensaje.NINGUNA);
        mensaje.setPrioridad(prioridad);
        mensaje.setEstado(resolverEstado(tipoProgramacion));
        mensaje.setFechaCreacion(ahora);
        mensaje.setFechaProgramada(tipoProgramacion == TipoProgramacionMensaje.AHORA
                ? null
                : request.getFechaProgramada());
        mensaje.setFechaEnvio(tipoProgramacion == TipoProgramacionMensaje.AHORA ? ahora : null);
        mensaje.setGimnasio(actor.getGimnasio());
        mensaje.setRemitente(actor);
        mensaje.setActivo(true);

        if (tipoProgramacion == TipoProgramacionMensaje.AHORA) {
            mensaje.setDestinatarioIds(destinatarioService.resolver(
                    actor.getGimnasio(), audiencia, destinatariosSolicitados, true
            ));
            mensaje.setDestinatariosMaterializados(true);
        } else {
            mensaje.setDestinatarioIds(audiencia == TipoAudienciaMensaje.INDIVIDUAL
                    ? destinatarioService.resolver(actor.getGimnasio(), audiencia, destinatariosSolicitados, true)
                    : new LinkedHashSet<>());
            mensaje.setDestinatariosMaterializados(false);
        }

        return respuesta(mensajeRepository.save(mensaje), actor);
    }

    @Transactional
    public MensajeResponse pausarMensaje(String authorizationHeader, Long id) {
        Usuario admin = exigirAdminActivo(authorizationHeader);
        Mensaje mensaje = exigirMensajeAdministrable(id, admin);
        if (mensaje.getTipoProgramacion() == TipoProgramacionMensaje.AHORA) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Un mensaje enviado no se puede pausar.");
        }
        mensaje.setEstado(EstadoMensaje.PAUSADO);
        return respuesta(mensajeRepository.save(mensaje), admin);
    }

    @Transactional
    public MensajeResponse reanudarMensaje(String authorizationHeader, Long id) {
        Usuario admin = exigirAdminActivo(authorizationHeader);
        Mensaje mensaje = exigirMensajeAdministrable(id, admin);
        if (mensaje.getTipoProgramacion() == TipoProgramacionMensaje.RECURRENTE) {
            mensaje.setEstado(EstadoMensaje.ACTIVO);
        } else if (mensaje.getTipoProgramacion() == TipoProgramacionMensaje.FECHA) {
            mensaje.setEstado(EstadoMensaje.PROGRAMADO);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Un mensaje enviado no se puede reanudar.");
        }
        return respuesta(mensajeRepository.save(mensaje), admin);
    }

    @Transactional
    public void eliminarMensaje(String authorizationHeader, Long id) {
        Usuario admin = exigirAdminActivo(authorizationHeader);
        Mensaje mensaje = exigirMensajeAdministrable(id, admin);
        mensaje.setActivo(false);
        mensajeRepository.save(mensaje);
    }

    @Transactional
    public MensajeResponse marcarMensajeComoLeido(String authorizationHeader, Long id) {
        Usuario actor = obtenerActorActivo(authorizationHeader);
        Mensaje mensaje = mensajeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mensaje no encontrado."));

        if (!mensajeEsVisibleParaUsuario(mensaje, actor)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El mensaje no pertenece a este usuario.");
        }

        mensaje.getLeidoPorUsuarioIds().add(actor.getId());
        return respuesta(mensajeRepository.save(mensaje), actor);
    }

    @Transactional
    public MensajeResponse marcarMensajeComoLeidoLegacy(
            String authorizationHeader,
            Long id,
            Long usuarioId
    ) {
        Usuario actor = obtenerActorActivo(authorizationHeader);
        if (!Objects.equals(actor.getId(), usuarioId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes marcar mensajes de otro usuario.");
        }
        return marcarMensajeComoLeido(authorizationHeader, id);
    }

    @Transactional
    public void procesarMensajesPendientes() {
        LocalDateTime ahora = LocalDateTime.now();

        mensajeRepository.findPendientesParaProcesar(EstadoMensaje.PROGRAMADO, ahora)
                .forEach(mensaje -> enviarMensajeProgramado(mensaje, ahora));

        mensajeRepository.findPendientesParaProcesar(EstadoMensaje.ACTIVO, ahora).stream()
                .filter(mensaje -> mensaje.getTipoProgramacion() == TipoProgramacionMensaje.RECURRENTE)
                .forEach(mensaje -> procesarMensajeRecurrente(mensaje, ahora));
    }

    boolean mensajeEsVisibleParaUsuario(Mensaje mensaje, Usuario usuario) {
        if (!mensaje.isActivo()
                || mensaje.getGimnasio() == null
                || usuario.getGimnasio() == null
                || !Objects.equals(mensaje.getGimnasio().getId(), usuario.getGimnasio().getId())) {
            return false;
        }

        if (usuario.getRol() == RolUsuario.ADMIN) {
            return true;
        }

        if (mensaje.getEstado() != EstadoMensaje.ENVIADO || mensaje.getFechaEnvio() == null) {
            return false;
        }

        if (mensaje.getRemitente() != null && Objects.equals(mensaje.getRemitente().getId(), usuario.getId())) {
            return true;
        }

        if (mensaje.isDestinatariosMaterializados()) {
            return mensaje.getDestinatarioIds().contains(usuario.getId());
        }

        if (!mensaje.getDestinatarioIds().isEmpty() || mensaje.getAudiencia() == TipoAudienciaMensaje.INDIVIDUAL) {
            return mensaje.getDestinatarioIds().contains(usuario.getId());
        }

        // Compatibilidad no destructiva: solo los mensajes legacy sin snapshot usan audiencia.
        if (usuario.getFechaAlta() != null && mensaje.getFechaEnvio().isBefore(usuario.getFechaAlta())) {
            return false;
        }

        return coincideConAudienciaLegacy(mensaje.getAudiencia(), usuario.getRol());
    }

    private List<Mensaje> listarDelGimnasio(Usuario actor) {
        return mensajeRepository.findByGimnasioIdAndActivoTrueOrderByFechaCreacionDesc(
                actor.getGimnasio().getId()
        );
    }

    private MensajeResponse respuesta(Mensaje mensaje, Usuario actor) {
        return new MensajeResponse(mensaje, actor, actor.getRol() == RolUsuario.ADMIN);
    }

    private Usuario obtenerActorActivo(String authorizationHeader) {
        Long usuarioId = authTokenService.obtenerUsuarioId(authorizationHeader);
        Usuario actor = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion no valida."));
        if (!actor.isActivo()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La cuenta no esta activa.");
        }
        if (actor.getGimnasio() == null || actor.getGimnasio().getId() == null || !actor.getGimnasio().isActivo()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La cuenta no tiene un gimnasio activo.");
        }
        return actor;
    }

    private Usuario exigirAdminActivo(String authorizationHeader) {
        Usuario actor = obtenerActorActivo(authorizationHeader);
        if (actor.getRol() != RolUsuario.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo administracion puede realizar esta accion.");
        }
        return actor;
    }

    private Mensaje exigirMensajeAdministrable(Long id, Usuario admin) {
        Mensaje mensaje = mensajeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mensaje no encontrado."));
        if (mensaje.getGimnasio() == null
                || !Objects.equals(mensaje.getGimnasio().getId(), admin.getGimnasio().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes gestionar mensajes de otro gimnasio.");
        }
        return mensaje;
    }

    private Mensaje resolverMensajePadre(Long mensajePadreId, Usuario actor) {
        if (mensajePadreId == null) {
            return null;
        }
        Mensaje padre = mensajeRepository.findById(mensajePadreId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mensaje original no encontrado."));
        if (!mensajeEsVisibleParaUsuario(padre, actor)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes responder a este mensaje.");
        }
        return padre;
    }

    private void validarContenido(MensajeRequest request) {
        if (request == null || request.getAsunto() == null || request.getAsunto().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El asunto es obligatorio.");
        }
        if (request.getTexto() == null || request.getTexto().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El texto del mensaje es obligatorio.");
        }
    }

    private void validarProgramacion(
            TipoProgramacionMensaje tipo,
            FrecuenciaMensaje frecuencia,
            LocalDateTime fechaProgramada
    ) {
        if (tipo == TipoProgramacionMensaje.AHORA) {
            return;
        }
        if (fechaProgramada == null || !fechaProgramada.isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Elige una fecha futura.");
        }
        if (tipo == TipoProgramacionMensaje.RECURRENTE
                && (frecuencia == null || frecuencia == FrecuenciaMensaje.NINGUNA)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona la frecuencia de la automatizacion.");
        }
    }

    private void validarPermisosDeEnvio(
            Usuario actor,
            TipoAudienciaMensaje audiencia,
            Set<Long> destinatarios,
            TipoProgramacionMensaje tipoProgramacion,
            boolean automatico
    ) {
        if (actor.getRol() == RolUsuario.ADMIN) {
            if (audiencia == TipoAudienciaMensaje.INDIVIDUAL) {
                destinatarioService.resolver(actor.getGimnasio(), audiencia, destinatarios, true);
            }
            return;
        }

        if (!actor.getGimnasio().isMensajesUsuariosPermitidos()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Administracion no ha habilitado los mensajes.");
        }
        if (audiencia != TipoAudienciaMensaje.INDIVIDUAL || destinatarios.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo puedes enviar mensajes directos a administracion.");
        }
        if (automatico || tipoProgramacion != TipoProgramacionMensaje.AHORA) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo puedes enviar mensajes inmediatos.");
        }

        Set<Long> destinatariosValidos = destinatarioService.resolver(
                actor.getGimnasio(), audiencia, destinatarios, true
        );
        boolean todosAdministradores = usuarioRepository.findAllById(destinatariosValidos).stream()
                .allMatch(usuario -> usuario.getRol() == RolUsuario.ADMIN);
        if (!todosAdministradores) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo puedes escribir a administradores activos.");
        }
    }

    private EstadoMensaje resolverEstado(TipoProgramacionMensaje tipo) {
        if (tipo == TipoProgramacionMensaje.RECURRENTE) {
            return EstadoMensaje.ACTIVO;
        }
        if (tipo == TipoProgramacionMensaje.FECHA) {
            return EstadoMensaje.PROGRAMADO;
        }
        return EstadoMensaje.ENVIADO;
    }

    private String resolverConversacionId(MensajeRequest request, Mensaje mensajePadre) {
        if (mensajePadre != null && mensajePadre.getConversacionId() != null
                && !mensajePadre.getConversacionId().isBlank()) {
            return mensajePadre.getConversacionId();
        }
        if (request.getConversacionId() != null && !request.getConversacionId().isBlank()) {
            return request.getConversacionId().trim();
        }
        if (mensajePadre != null && mensajePadre.getId() != null) {
            return "mensaje-" + mensajePadre.getId();
        }
        return UUID.randomUUID().toString();
    }

    private void enviarMensajeProgramado(Mensaje mensaje, LocalDateTime ahora) {
        mensaje.setDestinatarioIds(destinatarioService.resolver(
                mensaje.getGimnasio(), mensaje.getAudiencia(), mensaje.getDestinatarioIds(), false
        ));
        mensaje.setDestinatariosMaterializados(true);
        mensaje.setEstado(EstadoMensaje.ENVIADO);
        mensaje.setFechaEnvio(ahora);
        mensajeRepository.save(mensaje);
    }

    private void procesarMensajeRecurrente(Mensaje regla, LocalDateTime ahora) {
        LocalDateTime ejecucionProgramada = regla.getFechaProgramada();
        Mensaje entrega = new Mensaje();
        entrega.setAsunto(regla.getAsunto());
        entrega.setTexto(regla.getTexto());
        entrega.setAutomatico(true);
        entrega.setConversacionId("automatizacion-" + regla.getId() + "-" + ejecucionProgramada);
        entrega.setMensajePadreId(regla.getId());
        entrega.setAudiencia(regla.getAudiencia());
        entrega.setTipoProgramacion(TipoProgramacionMensaje.AHORA);
        entrega.setFrecuencia(FrecuenciaMensaje.NINGUNA);
        entrega.setPrioridad(regla.getPrioridad());
        entrega.setEstado(EstadoMensaje.ENVIADO);
        entrega.setFechaCreacion(ahora);
        entrega.setFechaProgramada(ejecucionProgramada);
        entrega.setFechaEnvio(ahora);
        entrega.setGimnasio(regla.getGimnasio());
        entrega.setRemitente(regla.getRemitente());
        entrega.setDestinatarioIds(destinatarioService.resolver(
                regla.getGimnasio(), regla.getAudiencia(), regla.getDestinatarioIds(), false
        ));
        entrega.setDestinatariosMaterializados(true);
        entrega.setActivo(true);
        mensajeRepository.save(entrega);

        regla.setFechaProgramada(calcularProximaFecha(ejecucionProgramada, regla.getFrecuencia(), ahora));
        mensajeRepository.save(regla);
    }

    private LocalDateTime calcularProximaFecha(
            LocalDateTime fechaActual,
            FrecuenciaMensaje frecuencia,
            LocalDateTime ahora
    ) {
        LocalDateTime base = fechaActual != null ? fechaActual : ahora;
        if (frecuencia == FrecuenciaMensaje.DIARIA) {
            do {
                base = base.plusDays(1);
            } while (!base.isAfter(ahora));
            return base;
        }
        if (frecuencia == FrecuenciaMensaje.SEMANAL) {
            do {
                base = base.plusWeeks(1);
            } while (!base.isAfter(ahora));
            return base;
        }
        if (frecuencia == FrecuenciaMensaje.MENSUAL) {
            do {
                base = base.plusMonths(1);
            } while (!base.isAfter(ahora));
            return base;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La automatizacion no tiene frecuencia valida.");
    }

    private boolean coincideConAudienciaLegacy(TipoAudienciaMensaje audiencia, RolUsuario rol) {
        if (audiencia == TipoAudienciaMensaje.CLIENTES) {
            return rol == RolUsuario.CLIENTE;
        }
        if (audiencia == TipoAudienciaMensaje.ENTRENADORES) {
            return rol == RolUsuario.ENTRENADOR;
        }
        return audiencia == TipoAudienciaMensaje.TODOS
                && (rol == RolUsuario.CLIENTE || rol == RolUsuario.ENTRENADOR);
    }
}
