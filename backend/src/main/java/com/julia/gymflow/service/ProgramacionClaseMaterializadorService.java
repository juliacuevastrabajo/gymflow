package com.julia.gymflow.service;

import com.julia.gymflow.entity.Clase;
import com.julia.gymflow.entity.ProgramacionClase;
import com.julia.gymflow.entity.ReglaProgramacionClase;
import com.julia.gymflow.repository.ClaseRepository;
import com.julia.gymflow.repository.ProgramacionClaseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class ProgramacionClaseMaterializadorService {

    public static final int HORIZONTE_SEMANAS = 12;

    private final ProgramacionClaseRepository programacionRepository;
    private final ClaseRepository claseRepository;

    public ProgramacionClaseMaterializadorService(
            ProgramacionClaseRepository programacionRepository,
            ClaseRepository claseRepository
    ) {
        this.programacionRepository = programacionRepository;
        this.claseRepository = claseRepository;
    }

    @Transactional
    public int materializar(Long programacionId) {
        return materializar(programacionId, LocalDateTime.now());
    }

    @Transactional
    public int materializar(Long programacionId, LocalDateTime ahora) {
        ProgramacionClase programacion = programacionRepository.findByIdForUpdate(programacionId)
                .orElseThrow(() -> new IllegalArgumentException("Programacion no encontrada."));

        if (!programacion.isActiva() || programacion.getReglas().isEmpty()) {
            return 0;
        }

        LocalDate inicioSemana = ahora.toLocalDate()
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate finHorizonte = inicioSemana
                .plusWeeks(HORIZONTE_SEMANAS)
                .plusDays(6);
        LocalDate inicioGeneracion = programacion.getFechaInicio().isAfter(ahora.toLocalDate())
                ? programacion.getFechaInicio()
                : ahora.toLocalDate();

        List<Clase> sesionesExistentes = claseRepository
                .findByProgramacionIdAndFechaHoraBetweenOrderByFechaHoraAsc(
                        programacionId,
                        inicioGeneracion.atStartOfDay(),
                        finHorizonte.atTime(LocalTime.MAX)
                );
        Set<LocalDateTime> fechasExistentes = new HashSet<>();
        sesionesExistentes.stream()
                .map(Clase::getFechaHora)
                .forEach(fechasExistentes::add);

        List<ReglaProgramacionClase> reglas = List.copyOf(programacion.getReglas());
        List<Clase> nuevasSesiones = new java.util.ArrayList<>();
        for (LocalDate fecha = inicioGeneracion; !fecha.isAfter(finHorizonte); fecha = fecha.plusDays(1)) {
            int diaSemanaIso = fecha.getDayOfWeek().getValue();
            for (ReglaProgramacionClase regla : reglas) {
                if (!regla.getDiaSemana().equals(diaSemanaIso)) {
                    continue;
                }

                LocalDateTime fechaHora = LocalDateTime.of(fecha, regla.getHora());
                if (fechaHora.isBefore(ahora) || !fechasExistentes.add(fechaHora)) {
                    continue;
                }

                Clase clase = crearSesion(programacion, fechaHora);
                nuevasSesiones.add(clase);
            }
        }

        if (!nuevasSesiones.isEmpty()) {
            claseRepository.saveAllAndFlush(nuevasSesiones);
        }
        return nuevasSesiones.size();
    }

    private Clase crearSesion(ProgramacionClase programacion, LocalDateTime fechaHora) {
        Clase clase = new Clase();
        clase.setNombre(programacion.getNombre());
        clase.setDescripcion(programacion.getDescripcion());
        clase.setImagenUrl(programacion.getImagenUrl());
        clase.setFechaHora(fechaHora);
        clase.setDuracionMinutos(programacion.getDuracionMinutos());
        clase.setCapacidadMaxima(programacion.getCapacidadMaxima());
        clase.setGimnasio(programacion.getGimnasio());
        clase.setEntrenador(programacion.getEntrenador());
        clase.setProgramacion(programacion);
        clase.setActiva(true);
        return clase;
    }
}
