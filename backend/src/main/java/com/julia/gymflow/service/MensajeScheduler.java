package com.julia.gymflow.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class MensajeScheduler {

    private final MensajeService mensajeService;

    public MensajeScheduler(MensajeService mensajeService) {
        this.mensajeService = mensajeService;
    }

    @Scheduled(fixedDelay = 60000)
    public void procesarMensajesPendientes() {
        mensajeService.procesarMensajesPendientes();
    }
}
