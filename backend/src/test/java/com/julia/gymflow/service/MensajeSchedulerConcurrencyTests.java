package com.julia.gymflow.service;

import com.julia.gymflow.entity.EstadoMensaje;
import com.julia.gymflow.entity.FrecuenciaMensaje;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.Mensaje;
import com.julia.gymflow.entity.PrioridadMensaje;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.TipoAudienciaMensaje;
import com.julia.gymflow.entity.TipoProgramacionMensaje;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.GimnasioRepository;
import com.julia.gymflow.repository.MensajeRepository;
import com.julia.gymflow.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
class MensajeSchedulerConcurrencyTests {

    @Autowired
    private MensajeService mensajeService;
    @Autowired
    private MensajeRepository mensajeRepository;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private GimnasioRepository gimnasioRepository;

    @Test
    void dosProcesadoresConcurrentesNoDuplicanLaMismaEjecucion() throws Exception {
        String suffix = String.valueOf(System.nanoTime());
        Gimnasio gimnasio = new Gimnasio();
        gimnasio.setNombre("Gym scheduler " + suffix);
        gimnasio.setSlug("gym-scheduler-" + suffix);
        gimnasio.setActivo(true);
        gimnasio = gimnasioRepository.saveAndFlush(gimnasio);

        Usuario cliente = new Usuario();
        cliente.setNombre("Cliente scheduler");
        cliente.setEmail("cliente-scheduler-" + suffix + "@example.com");
        cliente.setPasswordHash(new PasswordService().hash("Password8"));
        cliente.setRol(RolUsuario.CLIENTE);
        cliente.setActivo(true);
        cliente.setFechaAlta(LocalDateTime.now());
        cliente.setGimnasio(gimnasio);
        usuarioRepository.saveAndFlush(cliente);

        Mensaje regla = new Mensaje();
        regla.setAsunto("Recordatorio");
        regla.setTexto("Contenido recurrente");
        regla.setAutomatico(true);
        regla.setAudiencia(TipoAudienciaMensaje.CLIENTES);
        regla.setEstado(EstadoMensaje.ACTIVO);
        regla.setTipoProgramacion(TipoProgramacionMensaje.RECURRENTE);
        regla.setFrecuencia(FrecuenciaMensaje.DIARIA);
        regla.setPrioridad(PrioridadMensaje.NORMAL);
        regla.setFechaCreacion(LocalDateTime.now().minusDays(1));
        regla.setFechaProgramada(LocalDateTime.now().minusSeconds(1));
        regla.setGimnasio(gimnasio);
        regla.setDestinatariosMaterializados(false);
        regla.setActivo(true);
        regla = mensajeRepository.saveAndFlush(regla);
        Long reglaId = regla.getId();

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            Future<?> first = executor.submit(() -> ejecutar(ready, start));
            Future<?> second = executor.submit(() -> ejecutar(ready, start));
            ready.await(5, TimeUnit.SECONDS);
            start.countDown();
            first.get(10, TimeUnit.SECONDS);
            second.get(10, TimeUnit.SECONDS);
        } finally {
            executor.shutdownNow();
        }

        List<Mensaje> mensajes = mensajeRepository
                .findByGimnasioIdAndActivoTrueOrderByFechaCreacionDesc(gimnasio.getId());
        long entregas = mensajes.stream()
                .filter(mensaje -> reglaId.equals(mensaje.getMensajePadreId()))
                .count();
        assertEquals(1, entregas);
    }

    private void ejecutar(CountDownLatch ready, CountDownLatch start) {
        try {
            ready.countDown();
            start.await(5, TimeUnit.SECONDS);
            mensajeService.procesarMensajesPendientes();
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(error);
        }
    }
}
