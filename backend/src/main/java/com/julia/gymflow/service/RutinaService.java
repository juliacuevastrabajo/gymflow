package com.julia.gymflow.service;

import com.julia.gymflow.dto.EjercicioRequest;
import com.julia.gymflow.dto.EjercicioResponse;
import com.julia.gymflow.dto.RutinaAsignacionRequest;
import com.julia.gymflow.dto.RutinaAsignadaResponse;
import com.julia.gymflow.dto.RutinaEjercicioRequest;
import com.julia.gymflow.dto.RutinaEjercicioResponse;
import com.julia.gymflow.dto.RutinaOrdenRequest;
import com.julia.gymflow.dto.RutinaRequest;
import com.julia.gymflow.dto.RutinaResponse;
import com.julia.gymflow.entity.Ejercicio;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Rutina;
import com.julia.gymflow.entity.RutinaAsignada;
import com.julia.gymflow.entity.RutinaEjercicio;
import com.julia.gymflow.entity.TipoMultimediaEjercicio;
import com.julia.gymflow.entity.TipoArchivoSubido;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.EjercicioRepository;
import com.julia.gymflow.repository.RutinaAsignadaRepository;
import com.julia.gymflow.repository.RutinaEjercicioRepository;
import com.julia.gymflow.repository.RutinaRepository;
import com.julia.gymflow.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
public class RutinaService {

    private final RutinaRepository rutinaRepository;
    private final EjercicioRepository ejercicioRepository;
    private final RutinaEjercicioRepository rutinaEjercicioRepository;
    private final RutinaAsignadaRepository rutinaAsignadaRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuthTokenService authTokenService;
    private final ArchivoAsociacionService archivoAsociacionService;
    private final ArchivoReferenciaService archivoReferenciaService;

    public RutinaService(
            RutinaRepository rutinaRepository,
            EjercicioRepository ejercicioRepository,
            RutinaEjercicioRepository rutinaEjercicioRepository,
            RutinaAsignadaRepository rutinaAsignadaRepository,
            UsuarioRepository usuarioRepository,
            AuthTokenService authTokenService,
            ArchivoAsociacionService archivoAsociacionService,
            ArchivoReferenciaService archivoReferenciaService
    ) {
        this.rutinaRepository = rutinaRepository;
        this.ejercicioRepository = ejercicioRepository;
        this.rutinaEjercicioRepository = rutinaEjercicioRepository;
        this.rutinaAsignadaRepository = rutinaAsignadaRepository;
        this.usuarioRepository = usuarioRepository;
        this.authTokenService = authTokenService;
        this.archivoAsociacionService = archivoAsociacionService;
        this.archivoReferenciaService = archivoReferenciaService;
    }

    public List<RutinaResponse> listarRutinas(String authorizationHeader) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
        Gimnasio gimnasio = obtenerGimnasioUsuario(actor);

        if (actor.getRol() == RolUsuario.ADMIN) {
            return rutinaRepository
                    .findByGimnasioIdAndActivaTrueOrderByFechaCreacionDesc(gimnasio.getId())
                    .stream()
                    .map(this::toRutinaResponse)
                    .toList();
        }

        if (actor.getRol() == RolUsuario.ENTRENADOR) {
            return rutinaRepository
                    .findByGimnasioIdAndCreadorIdAndActivaTrueOrderByFechaCreacionDesc(gimnasio.getId(), actor.getId())
                    .stream()
                    .map(this::toRutinaResponse)
                    .toList();
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Los clientes consultan rutinas desde sus asignaciones.");
    }

    public RutinaResponse consultarRutina(String authorizationHeader, Long rutinaId) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
        Rutina rutina = obtenerRutinaActiva(rutinaId);
        validarPuedeVerRutina(actor, rutina);

        return toRutinaResponse(rutina);
    }

    public RutinaResponse crearRutina(String authorizationHeader, RutinaRequest request) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
        validarAdminOEntrenador(actor);
        Gimnasio gimnasio = obtenerGimnasioUsuario(actor);

        Rutina rutina = new Rutina();
        aplicarDatosRutina(rutina, request);
        rutina.setGimnasio(gimnasio);
        rutina.setCreador(actor);
        rutina.setFechaCreacion(LocalDateTime.now());
        rutina.setActiva(true);

        return toRutinaResponse(rutinaRepository.save(rutina));
    }

    public RutinaResponse actualizarRutina(String authorizationHeader, Long rutinaId, RutinaRequest request) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
        Rutina rutina = obtenerRutinaActiva(rutinaId);
        validarPuedeGestionarRutina(actor, rutina);

        aplicarDatosRutina(rutina, request);
        return toRutinaResponse(rutinaRepository.save(rutina));
    }

    public RutinaResponse desactivarRutina(String authorizationHeader, Long rutinaId) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
        Rutina rutina = obtenerRutinaActiva(rutinaId);
        validarPuedeGestionarRutina(actor, rutina);

        rutina.setActiva(false);
        rutinaAsignadaRepository.findByRutinaIdAndActivaTrueOrderByFechaAsignacionDesc(rutina.getId())
                .forEach((asignacion) -> {
                    asignacion.setActiva(false);
                    rutinaAsignadaRepository.save(asignacion);
                });

        return toRutinaResponse(rutinaRepository.save(rutina));
    }

    public List<EjercicioResponse> listarEjercicios(String authorizationHeader) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
        validarAdminOEntrenador(actor);
        Gimnasio gimnasio = obtenerGimnasioUsuario(actor);

        return ejercicioRepository
                .findByGimnasioIdAndActivoTrueOrderByNombreAsc(gimnasio.getId())
                .stream()
                .map(EjercicioResponse::new)
                .toList();
    }

    @Transactional
    public EjercicioResponse crearEjercicio(String authorizationHeader, EjercicioRequest request) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
        validarAdminOEntrenador(actor);
        Gimnasio gimnasio = obtenerGimnasioUsuario(actor);

        Ejercicio ejercicio = new Ejercicio();
        aplicarDatosEjercicio(ejercicio, request, actor, gimnasio);
        ejercicio.setGimnasio(gimnasio);
        ejercicio.setActivo(true);

        return new EjercicioResponse(ejercicioRepository.save(ejercicio));
    }

    @Transactional
    public EjercicioResponse actualizarEjercicio(String authorizationHeader, Long ejercicioId, EjercicioRequest request) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
        validarAdminOEntrenador(actor);
        Ejercicio ejercicio = obtenerEjercicioActivo(ejercicioId);
        validarMismoGimnasio(actor, ejercicio.getGimnasio());

        String multimediaAnterior = ejercicio.getMultimediaUrl();

        aplicarDatosEjercicio(ejercicio, request, actor, ejercicio.getGimnasio());
        Ejercicio guardado = ejercicioRepository.save(ejercicio);
        if (!Objects.equals(multimediaAnterior, ejercicio.getMultimediaUrl())) {
            archivoReferenciaService.liberarSiNoReferenciado(multimediaAnterior);
        }
        return new EjercicioResponse(guardado);
    }

    public EjercicioResponse desactivarEjercicio(String authorizationHeader, Long ejercicioId) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
        validarAdminOEntrenador(actor);
        Ejercicio ejercicio = obtenerEjercicioActivo(ejercicioId);
        validarMismoGimnasio(actor, ejercicio.getGimnasio());

        ejercicio.setActivo(false);
        return new EjercicioResponse(ejercicioRepository.save(ejercicio));
    }

    @Transactional
    public RutinaResponse agregarEjercicioARutina(
            String authorizationHeader,
            Long rutinaId,
            RutinaEjercicioRequest request
    ) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
        Rutina rutina = obtenerRutinaActiva(rutinaId);
        validarPuedeGestionarRutina(actor, rutina);
        Ejercicio ejercicio = obtenerEjercicioActivo(request.getEjercicioId());
        validarEjercicioDeRutina(rutina, ejercicio);

        RutinaEjercicio rutinaEjercicio = new RutinaEjercicio();
        rutinaEjercicio.setRutina(rutina);
        rutinaEjercicio.setEjercicio(ejercicio);
        aplicarDatosRutinaEjercicio(
                rutinaEjercicio,
                request,
                (int) rutinaEjercicioRepository.countByRutinaId(rutinaId) + 1
        );

        rutinaEjercicioRepository.save(rutinaEjercicio);
        normalizarOrdenRutina(rutinaId);
        return toRutinaResponse(rutina);
    }

    @Transactional
    public RutinaResponse actualizarEjercicioDeRutina(
            String authorizationHeader,
            Long rutinaId,
            Long rutinaEjercicioId,
            RutinaEjercicioRequest request
    ) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
        Rutina rutina = obtenerRutinaActiva(rutinaId);
        validarPuedeGestionarRutina(actor, rutina);
        RutinaEjercicio rutinaEjercicio = obtenerRutinaEjercicioDeRutina(rutinaId, rutinaEjercicioId);

        if (request.getEjercicioId() != null) {
            Ejercicio ejercicio = obtenerEjercicioActivo(request.getEjercicioId());
            validarEjercicioDeRutina(rutina, ejercicio);
            rutinaEjercicio.setEjercicio(ejercicio);
        }

        aplicarDatosRutinaEjercicio(rutinaEjercicio, request, rutinaEjercicio.getOrden());
        rutinaEjercicioRepository.save(rutinaEjercicio);
        normalizarOrdenRutina(rutinaId);
        return toRutinaResponse(rutina);
    }

    @Transactional
    public RutinaResponse eliminarEjercicioDeRutina(
            String authorizationHeader,
            Long rutinaId,
            Long rutinaEjercicioId
    ) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
        Rutina rutina = obtenerRutinaActiva(rutinaId);
        validarPuedeGestionarRutina(actor, rutina);
        RutinaEjercicio rutinaEjercicio = obtenerRutinaEjercicioDeRutina(rutinaId, rutinaEjercicioId);

        rutinaEjercicioRepository.delete(rutinaEjercicio);
        normalizarOrdenRutina(rutinaId);
        return toRutinaResponse(rutina);
    }

    @Transactional
    public RutinaResponse cambiarOrdenEjercicios(
            String authorizationHeader,
            Long rutinaId,
            RutinaOrdenRequest request
    ) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
        Rutina rutina = obtenerRutinaActiva(rutinaId);
        validarPuedeGestionarRutina(actor, rutina);
        List<RutinaEjercicio> ejercicios = rutinaEjercicioRepository.findByRutinaIdOrderByOrdenAsc(rutinaId);
        List<Long> idsOrdenados = request.getRutinaEjercicioIds();

        if (idsOrdenados == null || idsOrdenados.size() != ejercicios.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El orden debe incluir todos los ejercicios de la rutina.");
        }

        Set<Long> idsActuales = new HashSet<>(ejercicios.stream().map(RutinaEjercicio::getId).toList());
        Set<Long> idsSolicitados = new HashSet<>(idsOrdenados);

        if (!idsActuales.equals(idsSolicitados)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El orden contiene ejercicios que no pertenecen a la rutina.");
        }

        for (int index = 0; index < idsOrdenados.size(); index++) {
            Long ejercicioId = idsOrdenados.get(index);
            RutinaEjercicio item = ejercicios.stream()
                    .filter((rutinaEjercicio) -> Objects.equals(rutinaEjercicio.getId(), ejercicioId))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Orden no valido."));
            item.setOrden(index + 1);
            rutinaEjercicioRepository.save(item);
        }

        return toRutinaResponse(rutina);
    }

    public List<RutinaAsignadaResponse> asignarRutina(
            String authorizationHeader,
            Long rutinaId,
            RutinaAsignacionRequest request
    ) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
        Rutina rutina = obtenerRutinaActiva(rutinaId);
        validarPuedeGestionarRutina(actor, rutina);

        if (request.getClienteIds() == null || request.getClienteIds().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona al menos un cliente.");
        }

        List<RutinaAsignadaResponse> respuestas = new ArrayList<>();

        for (Long clienteId : request.getClienteIds()) {
            Usuario cliente = usuarioRepository.findById(clienteId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado con id: " + clienteId));

            validarClienteAsignable(rutina, cliente);

            RutinaAsignada asignacion = rutinaAsignadaRepository
                    .findByRutinaIdAndClienteIdAndActivaTrue(rutina.getId(), cliente.getId())
                    .orElseGet(() -> {
                        RutinaAsignada nuevaAsignacion = new RutinaAsignada();
                        nuevaAsignacion.setRutina(rutina);
                        nuevaAsignacion.setCliente(cliente);
                        nuevaAsignacion.setEntrenador(actor);
                        nuevaAsignacion.setFechaAsignacion(LocalDateTime.now());
                        nuevaAsignacion.setActiva(true);
                        return rutinaAsignadaRepository.save(nuevaAsignacion);
                    });

            respuestas.add(toRutinaAsignadaResponse(asignacion));
        }

        return respuestas;
    }

    public List<RutinaAsignadaResponse> listarAsignacionesRutina(String authorizationHeader, Long rutinaId) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
        Rutina rutina = obtenerRutinaActiva(rutinaId);
        validarPuedeGestionarRutina(actor, rutina);

        return rutinaAsignadaRepository
                .findByRutinaIdAndActivaTrueOrderByFechaAsignacionDesc(rutina.getId())
                .stream()
                .map(this::toRutinaAsignadaResponse)
                .toList();
    }

    public RutinaAsignadaResponse retirarAsignacion(String authorizationHeader, Long asignacionId) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
        RutinaAsignada asignacion = rutinaAsignadaRepository.findById(asignacionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Asignación no encontrada con id: " + asignacionId));
        Rutina rutina = asignacion.getRutina();
        validarPuedeGestionarRutina(actor, rutina);

        asignacion.setActiva(false);
        return toRutinaAsignadaResponse(rutinaAsignadaRepository.save(asignacion));
    }

    public List<RutinaAsignadaResponse> listarRutinasAsignadasCliente(String authorizationHeader) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);

        if (actor.getRol() != RolUsuario.CLIENTE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el cliente puede consultar sus rutinas asignadas.");
        }

        Gimnasio gimnasio = obtenerGimnasioUsuario(actor);

        return rutinaAsignadaRepository
                .findByClienteIdAndActivaTrueOrderByFechaAsignacionDesc(actor.getId())
                .stream()
                .filter((asignacion) ->
                        asignacion.getRutina() != null
                                && asignacion.getRutina().isActiva()
                                && mismoGimnasio(gimnasio, asignacion.getRutina().getGimnasio())
                )
                .map(this::toRutinaAsignadaResponse)
                .toList();
    }

    private Usuario obtenerUsuarioAutenticado(String authorizationHeader) {
        Long usuarioId = authTokenService.obtenerUsuarioId(authorizationHeader);

        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesión no válida."));
    }

    private Gimnasio obtenerGimnasioUsuario(Usuario usuario) {
        if (usuario.getGimnasio() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El usuario no tiene gimnasio asociado.");
        }

        return usuario.getGimnasio();
    }

    private Rutina obtenerRutinaActiva(Long rutinaId) {
        return rutinaRepository.findById(rutinaId)
                .filter(Rutina::isActiva)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rutina no encontrada con id: " + rutinaId));
    }

    private Ejercicio obtenerEjercicioActivo(Long ejercicioId) {
        if (ejercicioId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un ejercicio.");
        }

        return ejercicioRepository.findById(ejercicioId)
                .filter(Ejercicio::isActivo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ejercicio no encontrado con id: " + ejercicioId));
    }

    private RutinaEjercicio obtenerRutinaEjercicioDeRutina(Long rutinaId, Long rutinaEjercicioId) {
        return rutinaEjercicioRepository.findById(rutinaEjercicioId)
                .filter((rutinaEjercicio) ->
                        rutinaEjercicio.getRutina() != null
                                && Objects.equals(rutinaEjercicio.getRutina().getId(), rutinaId)
                )
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ejercicio de rutina no encontrado."));
    }

    private void validarAdminOEntrenador(Usuario actor) {
        if (actor.getRol() != RolUsuario.ADMIN && actor.getRol() != RolUsuario.ENTRENADOR) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permisos para gestionar rutinas.");
        }
    }

    private void validarPuedeVerRutina(Usuario actor, Rutina rutina) {
        validarMismoGimnasio(actor, rutina.getGimnasio());

        if (actor.getRol() == RolUsuario.ADMIN) {
            return;
        }

        if (actor.getRol() == RolUsuario.ENTRENADOR && Objects.equals(rutina.getCreador().getId(), actor.getId())) {
            return;
        }

        if (actor.getRol() == RolUsuario.CLIENTE &&
                rutinaAsignadaRepository.existsByRutinaIdAndClienteIdAndActivaTrue(rutina.getId(), actor.getId())) {
            return;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes acceso a esta rutina.");
    }

    private void validarPuedeGestionarRutina(Usuario actor, Rutina rutina) {
        validarMismoGimnasio(actor, rutina.getGimnasio());

        if (actor.getRol() == RolUsuario.ADMIN) {
            return;
        }

        if (actor.getRol() == RolUsuario.ENTRENADOR && Objects.equals(rutina.getCreador().getId(), actor.getId())) {
            return;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes gestionar esta rutina.");
    }

    private void validarMismoGimnasio(Usuario actor, Gimnasio gimnasio) {
        if (!mismoGimnasio(obtenerGimnasioUsuario(actor), gimnasio)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El recurso pertenece a otro gimnasio.");
        }
    }

    private boolean mismoGimnasio(Gimnasio gimnasioA, Gimnasio gimnasioB) {
        return gimnasioA != null
                && gimnasioB != null
                && Objects.equals(gimnasioA.getId(), gimnasioB.getId());
    }

    private void validarEjercicioDeRutina(Rutina rutina, Ejercicio ejercicio) {
        if (!mismoGimnasio(rutina.getGimnasio(), ejercicio.getGimnasio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El ejercicio no pertenece al gimnasio de la rutina.");
        }
    }

    private void validarClienteAsignable(Rutina rutina, Usuario cliente) {
        if (!cliente.isActivo() || cliente.getRol() != RolUsuario.CLIENTE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo puedes asignar rutinas a clientes activos.");
        }

        if (!mismoGimnasio(rutina.getGimnasio(), cliente.getGimnasio())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El cliente pertenece a otro gimnasio.");
        }
    }

    private void aplicarDatosRutina(Rutina rutina, RutinaRequest request) {
        String nombre = limpiarTexto(request.getNombre(), "El nombre de la rutina es obligatorio.", 120);

        rutina.setNombre(nombre);
        rutina.setDescripcion(limpiarTextoOpcional(request.getDescripcion(), 1600));
        rutina.setNivel(limpiarTextoOpcional(request.getNivel(), 60));

        if (request.getDuracionEstimadaMinutos() != null && request.getDuracionEstimadaMinutos() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La duración estimada no puede ser negativa.");
        }

        rutina.setDuracionEstimadaMinutos(request.getDuracionEstimadaMinutos());
    }

    private void aplicarDatosEjercicio(
            Ejercicio ejercicio,
            EjercicioRequest request,
            Usuario actor,
            Gimnasio gimnasio
    ) {
        String nombre = limpiarTexto(request.getNombre(), "El nombre del ejercicio es obligatorio.", 120);
        TipoMultimediaEjercicio tipo = request.getTipoMultimedia() != null
                ? request.getTipoMultimedia()
                : TipoMultimediaEjercicio.NINGUNO;

        ejercicio.setNombre(nombre);
        ejercicio.setDescripcion(limpiarTextoOpcional(request.getDescripcion(), 1200));
        String multimediaUrl = tipo == TipoMultimediaEjercicio.NINGUNO
                ? null
                : archivoAsociacionService.asociarMultimedia(
                        limpiarTextoOpcional(request.getMultimediaUrl(), 1000),
                        ejercicio.getMultimediaUrl(),
                        tipo == TipoMultimediaEjercicio.VIDEO
                                ? TipoArchivoSubido.VIDEO
                                : TipoArchivoSubido.IMAGEN,
                        actor,
                        gimnasio
                );
        ejercicio.setTipoMultimedia(tipo);
        ejercicio.setMultimediaUrl(multimediaUrl);
    }

    private void aplicarDatosRutinaEjercicio(
            RutinaEjercicio rutinaEjercicio,
            RutinaEjercicioRequest request,
            Integer ordenPorDefecto
    ) {
        Integer orden = request.getOrden() != null ? request.getOrden() : ordenPorDefecto;
        if (orden == null || orden < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El orden debe ser mayor que cero.");
        }

        if (request.getSeries() != null && request.getSeries() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las series no pueden ser negativas.");
        }

        if (request.getDescansoSegundos() != null && request.getDescansoSegundos() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El descanso no puede ser negativo.");
        }

        if (request.getPeso() != null && request.getPeso() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El peso no puede ser negativo.");
        }

        rutinaEjercicio.setOrden(orden);
        rutinaEjercicio.setSeries(request.getSeries());
        rutinaEjercicio.setRepeticiones(limpiarTextoOpcional(request.getRepeticiones(), 60));
        rutinaEjercicio.setDescansoSegundos(request.getDescansoSegundos());
        rutinaEjercicio.setPeso(request.getPeso());
        rutinaEjercicio.setNotas(limpiarTextoOpcional(request.getNotas(), 1200));
    }

    private void normalizarOrdenRutina(Long rutinaId) {
        List<RutinaEjercicio> ejercicios = rutinaEjercicioRepository.findByRutinaIdOrderByOrdenAsc(rutinaId);

        for (int index = 0; index < ejercicios.size(); index++) {
            RutinaEjercicio ejercicio = ejercicios.get(index);
            ejercicio.setOrden(index + 1);
            rutinaEjercicioRepository.save(ejercicio);
        }
    }

    private RutinaResponse toRutinaResponse(Rutina rutina) {
        List<RutinaEjercicioResponse> ejercicios = rutinaEjercicioRepository
                .findByRutinaIdOrderByOrdenAsc(rutina.getId())
                .stream()
                .map(RutinaEjercicioResponse::new)
                .toList();
        int asignacionesActivas = rutinaAsignadaRepository
                .findByRutinaIdAndActivaTrueOrderByFechaAsignacionDesc(rutina.getId())
                .size();

        return new RutinaResponse(rutina, ejercicios, asignacionesActivas);
    }

    private RutinaAsignadaResponse toRutinaAsignadaResponse(RutinaAsignada asignacion) {
        return new RutinaAsignadaResponse(asignacion, toRutinaResponse(asignacion.getRutina()));
    }

    private String limpiarTexto(String valor, String mensajeError, int maximo) {
        if (valor == null || valor.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, mensajeError);
        }

        String limpio = valor.trim();
        if (limpio.length() > maximo) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El texto supera el máximo de " + maximo + " caracteres.");
        }

        return limpio;
    }

    private String limpiarTextoOpcional(String valor, int maximo) {
        if (valor == null || valor.trim().isEmpty()) {
            return null;
        }

        String limpio = valor.trim();
        if (limpio.length() > maximo) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El texto supera el máximo de " + maximo + " caracteres.");
        }

        return limpio;
    }
}
