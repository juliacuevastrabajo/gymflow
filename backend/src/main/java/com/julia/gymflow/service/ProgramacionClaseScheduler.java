package com.julia.gymflow.service;

import com.julia.gymflow.repository.ProgramacionClaseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProgramacionClaseScheduler {

    private static final Logger log = LoggerFactory.getLogger(ProgramacionClaseScheduler.class);

    private final ProgramacionClaseRepository programacionRepository;
    private final ProgramacionClaseMaterializadorService materializadorService;
    private final ClaseLegacyBackfillService backfillService;

    public ProgramacionClaseScheduler(
            ProgramacionClaseRepository programacionRepository,
            ProgramacionClaseMaterializadorService materializadorService,
            ClaseLegacyBackfillService backfillService
    ) {
        this.programacionRepository = programacionRepository;
        this.materializadorService = materializadorService;
        this.backfillService = backfillService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void recuperarAlArrancar() {
        ClaseLegacyBackfillService.ResultadoBackfill resultado = backfillService.ejecutar();
        log.info(
                "Backfill de clases completado: programaciones={}, sesiones vinculadas={}, grupos legacy conservados={}",
                resultado.programacionesCreadas(),
                resultado.sesionesVinculadas(),
                resultado.gruposAmbiguos()
        );
        extenderHorizonte();
    }

    @Scheduled(fixedDelayString = "${gymflow.clases.materialization-delay-ms:21600000}")
    public void extenderHorizonte() {
        List<Long> ids = programacionRepository.findByActivaTrue().stream()
                .map(programacion -> programacion.getId())
                .toList();
        for (Long id : ids) {
            try {
                materializadorService.materializar(id);
            } catch (RuntimeException error) {
                log.error("No se pudo extender la programacion de clase {}.", id, error);
            }
        }
    }
}
