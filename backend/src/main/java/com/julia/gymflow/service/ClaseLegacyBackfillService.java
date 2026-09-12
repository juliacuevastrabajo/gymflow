package com.julia.gymflow.service;

import com.julia.gymflow.entity.Clase;
import com.julia.gymflow.entity.ProgramacionClase;
import com.julia.gymflow.entity.ReglaProgramacionClase;
import com.julia.gymflow.repository.ClaseRepository;
import com.julia.gymflow.repository.ProgramacionClaseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
public class ClaseLegacyBackfillService {

    private static final Logger log = LoggerFactory.getLogger(ClaseLegacyBackfillService.class);

    private final ClaseRepository claseRepository;
    private final ProgramacionClaseRepository programacionRepository;

    public ClaseLegacyBackfillService(
            ClaseRepository claseRepository,
            ProgramacionClaseRepository programacionRepository
    ) {
        this.claseRepository = claseRepository;
        this.programacionRepository = programacionRepository;
    }

    @Transactional
    public ResultadoBackfill ejecutar() {
        List<Clase> legacy = claseRepository.findByProgramacionIsNullOrderByIdAsc();
        Map<ClaveLegacy, List<Clase>> grupos = new LinkedHashMap<>();
        for (Clase clase : legacy) {
            if (clase.getGimnasio() == null || clase.getEntrenador() == null) {
                continue;
            }
            grupos.computeIfAbsent(ClaveLegacy.desde(clase), ignored -> new ArrayList<>()).add(clase);
        }

        int programacionesCreadas = 0;
        int sesionesVinculadas = 0;
        int gruposAmbiguos = 0;
        for (Map.Entry<ClaveLegacy, List<Clase>> entry : grupos.entrySet()) {
            List<Clase> sesiones = entry.getValue();
            String motivoAmbiguo = validarGrupo(sesiones);
            if (motivoAmbiguo != null) {
                gruposAmbiguos++;
                log.warn("Clase legacy conservada sin programacion: grupo='{}', motivo={}",
                        entry.getKey().nombre(), motivoAmbiguo);
                continue;
            }

            String fingerprint = fingerprint(entry.getKey());
            ProgramacionClase programacion = programacionRepository
                    .findByLegacyFingerprint(fingerprint)
                    .orElse(null);
            if (programacion == null) {
                programacion = crearProgramacion(entry.getKey(), sesiones, fingerprint);
                programacion = programacionRepository.saveAndFlush(programacion);
                programacionesCreadas++;
            }

            for (Clase clase : sesiones) {
                clase.setProgramacion(programacion);
            }
            claseRepository.saveAll(sesiones);
            sesionesVinculadas += sesiones.size();
        }

        return new ResultadoBackfill(programacionesCreadas, sesionesVinculadas, gruposAmbiguos);
    }

    private String validarGrupo(List<Clase> sesiones) {
        if (sesiones.size() < 2) {
            return "solo existe una sesion y no demuestra recurrencia";
        }
        if (sesiones.stream().anyMatch(clase -> clase.getFechaHora() == null)) {
            return "contiene una sesion sin fecha";
        }
        Set<LocalDateTime> fechas = new HashSet<>();
        if (sesiones.stream().map(Clase::getFechaHora).anyMatch(fecha -> !fechas.add(fecha))) {
            return "contiene dos sesiones con la misma fecha y hora";
        }
        if (sesiones.stream().noneMatch(Clase::isActiva)) {
            return null;
        }
        if (sesiones.stream().filter(Clase::isActiva).map(Clase::getFechaHora).findAny().isEmpty()) {
            return "no contiene reglas activas seguras";
        }
        return null;
    }

    private ProgramacionClase crearProgramacion(
            ClaveLegacy clave,
            List<Clase> sesiones,
            String fingerprint
    ) {
        Clase primera = sesiones.get(0);
        ProgramacionClase programacion = new ProgramacionClase();
        programacion.setGimnasio(primera.getGimnasio());
        programacion.setEntrenador(primera.getEntrenador());
        programacion.setNombre(primera.getNombre());
        programacion.setDescripcion(primera.getDescripcion());
        programacion.setImagenUrl(primera.getImagenUrl());
        programacion.setDuracionMinutos(primera.getDuracionMinutos());
        programacion.setCapacidadMaxima(primera.getCapacidadMaxima());
        programacion.setFechaInicio(sesiones.stream()
                .map(Clase::getFechaHora)
                .filter(Objects::nonNull)
                .map(LocalDateTime::toLocalDate)
                .min(java.util.Comparator.naturalOrder())
                .orElseThrow());
        programacion.setActiva(sesiones.stream().anyMatch(Clase::isActiva));
        programacion.setLegacyFingerprint(fingerprint);

        List<Clase> fuenteReglas = programacion.isActiva()
                ? sesiones.stream().filter(Clase::isActiva).toList()
                : sesiones;
        Set<String> reglasUnicas = new HashSet<>();
        List<ReglaProgramacionClase> reglas = fuenteReglas.stream()
                .filter(clase -> clase.getFechaHora() != null)
                .filter(clase -> reglasUnicas.add(
                        clase.getFechaHora().getDayOfWeek().getValue() + "@" + clase.getFechaHora().toLocalTime()
                ))
                .map(clase -> {
                    ReglaProgramacionClase regla = new ReglaProgramacionClase();
                    regla.setDiaSemana(clase.getFechaHora().getDayOfWeek().getValue());
                    regla.setHora(clase.getFechaHora().toLocalTime());
                    return regla;
                })
                .toList();
        programacion.reemplazarReglas(reglas);
        return programacion;
    }

    private String fingerprint(ClaveLegacy clave) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(clave.canonica().getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception error) {
            throw new IllegalStateException("No se pudo identificar la clase legacy.", error);
        }
    }

    public record ResultadoBackfill(
            int programacionesCreadas,
            int sesionesVinculadas,
            int gruposAmbiguos
    ) {}

    private record ClaveLegacy(
            Long gimnasioId,
            Long entrenadorId,
            String nombre,
            String descripcion,
            Integer duracion,
            Integer capacidad,
            String imagen
    ) {
        static ClaveLegacy desde(Clase clase) {
            return new ClaveLegacy(
                    clase.getGimnasio().getId(),
                    clase.getEntrenador().getId(),
                    limpiar(clase.getNombre()),
                    limpiar(clase.getDescripcion()),
                    clase.getDuracionMinutos(),
                    clase.getCapacidadMaxima(),
                    limpiar(clase.getImagenUrl())
            );
        }

        String canonica() {
            return String.join("|",
                    String.valueOf(gimnasioId),
                    String.valueOf(entrenadorId),
                    nombre,
                    descripcion,
                    String.valueOf(duracion),
                    String.valueOf(capacidad),
                    imagen
            );
        }

        private static String limpiar(String valor) {
            return valor == null ? "" : valor.trim().toLowerCase(Locale.ROOT);
        }
    }
}
