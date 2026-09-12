package com.julia.gymflow.service;

import com.julia.gymflow.dto.ClaseResponse;
import com.julia.gymflow.dto.ProgramacionClaseRequest;
import com.julia.gymflow.dto.ProgramacionClaseResponse;
import com.julia.gymflow.dto.ReglaProgramacionClaseRequest;
import com.julia.gymflow.entity.Clase;
import com.julia.gymflow.entity.EstadoReserva;
import com.julia.gymflow.entity.FinalidadArchivo;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.ProgramacionClase;
import com.julia.gymflow.entity.ReglaProgramacionClase;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.ClaseRepository;
import com.julia.gymflow.repository.ProgramacionClaseRepository;
import com.julia.gymflow.repository.ReservaRepository;
import com.julia.gymflow.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
public class ProgramacionClaseService {

    private final ProgramacionClaseRepository programacionRepository;
    private final ClaseRepository claseRepository;
    private final ReservaRepository reservaRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuthTokenService authTokenService;
    private final ArchivoAsociacionService archivoAsociacionService;
    private final ProgramacionClaseMaterializadorService materializadorService;

    public ProgramacionClaseService(
            ProgramacionClaseRepository programacionRepository,
            ClaseRepository claseRepository,
            ReservaRepository reservaRepository,
            UsuarioRepository usuarioRepository,
            AuthTokenService authTokenService,
            ArchivoAsociacionService archivoAsociacionService,
            ProgramacionClaseMaterializadorService materializadorService
    ) {
        this.programacionRepository = programacionRepository;
        this.claseRepository = claseRepository;
        this.reservaRepository = reservaRepository;
        this.usuarioRepository = usuarioRepository;
        this.authTokenService = authTokenService;
        this.archivoAsociacionService = archivoAsociacionService;
        this.materializadorService = materializadorService;
    }

    @Transactional(readOnly = true)
    public List<ProgramacionClaseResponse> listar(String authorizationHeader) {
        Usuario actor = exigirAdminActivo(authorizationHeader);
        return programacionRepository.findByGimnasioIdOrderByNombreAsc(actor.getGimnasio().getId())
                .stream()
                .map(this::crearResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProgramacionClaseResponse consultar(String authorizationHeader, Long id) {
        Usuario actor = exigirAdminActivo(authorizationHeader);
        ProgramacionClase programacion = exigirProgramacionPropia(id, actor.getGimnasio());
        return crearResponse(programacion);
    }

    @Transactional
    public ProgramacionClaseResponse crear(String authorizationHeader, ProgramacionClaseRequest request) {
        Usuario actor = exigirAdminActivo(authorizationHeader);
        validarDatosGenerales(request, true);
        Gimnasio gimnasio = actor.getGimnasio();
        Usuario entrenador = obtenerEntrenador(request.getEntrenadorId(), gimnasio);
        LocalDate fechaInicio = request.getFechaInicio() == null ? LocalDate.now() : request.getFechaInicio();
        if (fechaInicio.isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de inicio no puede estar en el pasado.");
        }

        ProgramacionClase programacion = new ProgramacionClase();
        programacion.setGimnasio(gimnasio);
        programacion.setEntrenador(entrenador);
        programacion.setNombre(request.getNombre().trim());
        programacion.setDescripcion(limpiarOpcional(request.getDescripcion()));
        programacion.setImagenUrl(archivoAsociacionService.asociarImagen(
                request.getImagenUrl(), null, FinalidadArchivo.PORTADA_CLASE, actor, gimnasio
        ));
        programacion.setDuracionMinutos(request.getDuracionMinutos());
        programacion.setCapacidadMaxima(request.getCapacidadMaxima());
        programacion.setFechaInicio(fechaInicio);
        programacion.setActiva(true);
        programacion.reemplazarReglas(crearReglas(request.getReglas()));
        programacion = programacionRepository.saveAndFlush(programacion);

        materializadorService.materializar(programacion.getId());
        return crearResponse(programacionRepository.findById(programacion.getId()).orElseThrow());
    }

    @Transactional
    public ProgramacionClaseResponse actualizar(
            String authorizationHeader,
            Long id,
            ProgramacionClaseRequest request
    ) {
        Usuario actor = exigirAdminActivo(authorizationHeader);
        validarDatosGenerales(request, false);
        ProgramacionClase programacion = programacionRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Programacion no encontrada."));
        if (!Objects.equals(programacion.getGimnasio().getId(), actor.getGimnasio().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La programacion pertenece a otro gimnasio.");
        }
        if (!programacion.isActiva()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La programacion esta desactivada.");
        }

        Usuario entrenador = request.getEntrenadorId() == null
                ? programacion.getEntrenador()
                : obtenerEntrenador(request.getEntrenadorId(), actor.getGimnasio());
        LocalDate nuevaFechaInicio = request.getFechaInicio() == null
                ? programacion.getFechaInicio()
                : request.getFechaInicio();
        Set<ClaveRegla> nuevasClaves = request.getReglas() == null
                ? clavesActuales(programacion)
                : validarYCrearClaves(request.getReglas());
        LocalDateTime ahora = LocalDateTime.now();
        List<Clase> sesiones = claseRepository.findByProgramacionIdOrderByFechaHoraAsc(id);
        Integer nuevaCapacidad = valorPositivoOActual(
                request.getCapacidadMaxima(), programacion.getCapacidadMaxima(), "capacidad"
        );

        validarRetiradaSinReservas(sesiones, nuevasClaves, nuevaFechaInicio, ahora);
        validarCapacidadFutura(sesiones, nuevaCapacidad, ahora);

        programacion.setNombre(valorObligatorioOActual(request.getNombre(), programacion.getNombre()));
        programacion.setDescripcion(request.getDescripcion() == null
                ? programacion.getDescripcion()
                : limpiarOpcional(request.getDescripcion()));
        programacion.setImagenUrl(request.getImagenUrl() == null
                ? programacion.getImagenUrl()
                : archivoAsociacionService.asociarImagen(
                        request.getImagenUrl(),
                        programacion.getImagenUrl(),
                        FinalidadArchivo.PORTADA_CLASE,
                        actor,
                        actor.getGimnasio()
                ));
        programacion.setDuracionMinutos(valorPositivoOActual(
                request.getDuracionMinutos(), programacion.getDuracionMinutos(), "duracion"
        ));
        programacion.setCapacidadMaxima(nuevaCapacidad);
        programacion.setEntrenador(entrenador);
        programacion.setFechaInicio(nuevaFechaInicio);
        if (request.getReglas() != null) {
            sincronizarReglas(programacion, nuevasClaves);
        }
        programacionRepository.saveAndFlush(programacion);

        for (Clase sesion : sesiones) {
            if (sesion.getFechaHora() == null || !sesion.getFechaHora().isAfter(ahora)) {
                continue;
            }
            ClaveRegla clave = ClaveRegla.desde(sesion.getFechaHora());
            boolean debeContinuar = !sesion.getFechaHora().toLocalDate().isBefore(nuevaFechaInicio)
                    && nuevasClaves.contains(clave);
            if (!debeContinuar) {
                sesion.setActiva(false);
                continue;
            }
            copiarDatos(programacion, sesion);
        }
        claseRepository.saveAll(sesiones);
        claseRepository.flush();
        materializadorService.materializar(id);
        return crearResponse(programacionRepository.findById(id).orElseThrow());
    }

    @Transactional
    public ProgramacionClaseResponse desactivar(String authorizationHeader, Long id) {
        Usuario actor = exigirAdminActivo(authorizationHeader);
        ProgramacionClase programacion = programacionRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Programacion no encontrada."));
        if (!Objects.equals(programacion.getGimnasio().getId(), actor.getGimnasio().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La programacion pertenece a otro gimnasio.");
        }

        LocalDateTime ahora = LocalDateTime.now();
        List<Clase> futuras = claseRepository.findByProgramacionIdOrderByFechaHoraAsc(id).stream()
                .filter(clase -> clase.isActiva()
                        && clase.getFechaHora() != null
                        && clase.getFechaHora().isAfter(ahora))
                .toList();
        exigirSinReservasActivas(futuras);
        futuras.forEach(clase -> clase.setActiva(false));
        claseRepository.saveAll(futuras);
        programacion.setActiva(false);
        programacionRepository.saveAndFlush(programacion);
        return crearResponse(programacion);
    }

    private void validarRetiradaSinReservas(
            List<Clase> sesiones,
            Set<ClaveRegla> nuevasClaves,
            LocalDate fechaInicio,
            LocalDateTime ahora
    ) {
        List<Clase> afectadas = sesiones.stream()
                .filter(Clase::isActiva)
                .filter(clase -> clase.getFechaHora() != null && clase.getFechaHora().isAfter(ahora))
                .filter(clase -> clase.getFechaHora().toLocalDate().isBefore(fechaInicio)
                        || !nuevasClaves.contains(ClaveRegla.desde(clase.getFechaHora())))
                .toList();
        exigirSinReservasActivas(afectadas);
    }

    private void exigirSinReservasActivas(List<Clase> sesiones) {
        boolean hayReservas = sesiones.stream().anyMatch(clase ->
                reservaRepository.existsByClaseIdAndEstado(clase.getId(), EstadoReserva.RESERVADA)
        );
        if (hayReservas) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Hay reservas activas en sesiones afectadas. Cancelalas o reasignalas antes de cambiar el horario."
            );
        }
    }

    private void validarCapacidadFutura(
            List<Clase> sesiones,
            Integer nuevaCapacidad,
            LocalDateTime ahora
    ) {
        boolean superaCapacidad = sesiones.stream()
                .filter(Clase::isActiva)
                .filter(clase -> clase.getFechaHora() != null && clase.getFechaHora().isAfter(ahora))
                .anyMatch(clase -> reservaRepository.countByClaseIdAndEstado(
                        clase.getId(), EstadoReserva.RESERVADA
                ) > nuevaCapacidad);
        if (superaCapacidad) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La capacidad no puede ser inferior a las reservas activas de una sesion futura."
            );
        }
    }

    private void sincronizarReglas(ProgramacionClase programacion, Set<ClaveRegla> nuevasClaves) {
        Map<ClaveRegla, ReglaProgramacionClase> actuales = new HashMap<>();
        programacion.getReglas().forEach(regla -> actuales.put(ClaveRegla.desde(regla), regla));

        Iterator<ReglaProgramacionClase> iterator = programacion.getReglas().iterator();
        while (iterator.hasNext()) {
            ReglaProgramacionClase regla = iterator.next();
            if (!nuevasClaves.contains(ClaveRegla.desde(regla))) {
                iterator.remove();
            }
        }
        for (ClaveRegla clave : nuevasClaves) {
            if (actuales.containsKey(clave)) {
                continue;
            }
            ReglaProgramacionClase regla = new ReglaProgramacionClase();
            regla.setProgramacion(programacion);
            regla.setDiaSemana(clave.diaSemana());
            regla.setHora(clave.hora());
            programacion.getReglas().add(regla);
        }
    }

    private void copiarDatos(ProgramacionClase programacion, Clase clase) {
        clase.setNombre(programacion.getNombre());
        clase.setDescripcion(programacion.getDescripcion());
        clase.setImagenUrl(programacion.getImagenUrl());
        clase.setDuracionMinutos(programacion.getDuracionMinutos());
        clase.setCapacidadMaxima(programacion.getCapacidadMaxima());
        clase.setGimnasio(programacion.getGimnasio());
        clase.setEntrenador(programacion.getEntrenador());
    }

    private List<ReglaProgramacionClase> crearReglas(List<ReglaProgramacionClaseRequest> requests) {
        return validarYCrearClaves(requests).stream().map(clave -> {
            ReglaProgramacionClase regla = new ReglaProgramacionClase();
            regla.setDiaSemana(clave.diaSemana());
            regla.setHora(clave.hora());
            return regla;
        }).toList();
    }

    private Set<ClaveRegla> validarYCrearClaves(List<ReglaProgramacionClaseRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Anade al menos un dia y una hora.");
        }
        Set<ClaveRegla> claves = new HashSet<>();
        for (ReglaProgramacionClaseRequest request : requests) {
            if (request == null || request.getDiaSemana() == null || request.getHora() == null
                    || request.getDiaSemana() < 1 || request.getDiaSemana() > 7) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El horario semanal no es valido.");
            }
            if (!claves.add(new ClaveRegla(request.getDiaSemana(), request.getHora()))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El horario semanal contiene duplicados.");
            }
        }
        return claves;
    }

    private Set<ClaveRegla> clavesActuales(ProgramacionClase programacion) {
        Set<ClaveRegla> claves = new HashSet<>();
        programacion.getReglas().forEach(regla -> claves.add(ClaveRegla.desde(regla)));
        return claves;
    }

    private void validarDatosGenerales(ProgramacionClaseRequest request, boolean reglasObligatorias) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Faltan los datos de la clase.");
        }
        if (reglasObligatorias || request.getReglas() != null) {
            validarYCrearClaves(request.getReglas());
        }
        if (reglasObligatorias && (request.getNombre() == null || request.getNombre().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre es obligatorio.");
        }
        if (reglasObligatorias && (request.getDuracionMinutos() == null || request.getDuracionMinutos() <= 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La duracion debe ser mayor que cero.");
        }
        if (reglasObligatorias && (request.getCapacidadMaxima() == null || request.getCapacidadMaxima() <= 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La capacidad debe ser mayor que cero.");
        }
    }

    private Usuario exigirAdminActivo(String authorizationHeader) {
        Long usuarioId = authTokenService.obtenerUsuarioId(authorizationHeader);
        Usuario actor = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion no valida."));
        if (!actor.isActivo() || actor.getRol() != RolUsuario.ADMIN || actor.getGimnasio() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo administracion puede gestionar clases.");
        }
        return actor;
    }

    private ProgramacionClase exigirProgramacionPropia(Long id, Gimnasio gimnasio) {
        ProgramacionClase programacion = programacionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Programacion no encontrada."));
        if (!Objects.equals(programacion.getGimnasio().getId(), gimnasio.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La programacion pertenece a otro gimnasio.");
        }
        return programacion;
    }

    private Usuario obtenerEntrenador(Long entrenadorId, Gimnasio gimnasio) {
        if (entrenadorId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un entrenador.");
        }
        Usuario entrenador = usuarioRepository.findById(entrenadorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Entrenador no encontrado."));
        if (!entrenador.isActivo() || entrenador.getRol() != RolUsuario.ENTRENADOR) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un entrenador activo.");
        }
        if (entrenador.getGimnasio() == null
                || !Objects.equals(entrenador.getGimnasio().getId(), gimnasio.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El entrenador pertenece a otro gimnasio.");
        }
        return entrenador;
    }

    private ProgramacionClaseResponse crearResponse(ProgramacionClase programacion) {
        LocalDateTime ahora = LocalDateTime.now();
        long sesionesFuturas = claseRepository
                .countByProgramacionIdAndActivaTrueAndFechaHoraAfter(programacion.getId(), ahora);
        List<ClaseResponse> proximas = claseRepository
                .findTop6ByProgramacionIdAndActivaTrueAndFechaHoraAfterOrderByFechaHoraAsc(
                        programacion.getId(), ahora
                )
                .stream()
                .map(ClaseResponse::new)
                .toList();
        return new ProgramacionClaseResponse(programacion, sesionesFuturas, proximas);
    }

    private String valorObligatorioOActual(String valor, String actual) {
        if (valor == null) {
            return actual;
        }
        if (valor.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre es obligatorio.");
        }
        return valor.trim();
    }

    private Integer valorPositivoOActual(Integer valor, Integer actual, String campo) {
        if (valor == null) {
            return actual;
        }
        if (valor <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La " + campo + " debe ser mayor que cero.");
        }
        return valor;
    }

    private String limpiarOpcional(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }

    private record ClaveRegla(Integer diaSemana, LocalTime hora) {
        static ClaveRegla desde(ReglaProgramacionClase regla) {
            return new ClaveRegla(regla.getDiaSemana(), regla.getHora());
        }

        static ClaveRegla desde(LocalDateTime fechaHora) {
            return new ClaveRegla(fechaHora.getDayOfWeek().getValue(), fechaHora.toLocalTime());
        }
    }
}
