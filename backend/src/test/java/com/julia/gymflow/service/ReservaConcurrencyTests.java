package com.julia.gymflow.service;

import com.julia.gymflow.dto.ReservaRequest;
import com.julia.gymflow.entity.Clase;
import com.julia.gymflow.entity.EstadoReserva;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.ClaseRepository;
import com.julia.gymflow.repository.GimnasioRepository;
import com.julia.gymflow.repository.ReservaRepository;
import com.julia.gymflow.repository.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(properties =
        "spring.datasource.url=jdbc:h2:mem:reservas-concurrency;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
class ReservaConcurrencyTests {

    @Autowired private ReservaService reservaService;
    @Autowired private AuthTokenService authTokenService;
    @Autowired private GimnasioRepository gimnasioRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ClaseRepository claseRepository;
    @Autowired private ReservaRepository reservaRepository;

    @AfterEach
    void limpiar() {
        reservaRepository.deleteAllInBatch();
        claseRepository.deleteAllInBatch();
        usuarioRepository.deleteAllInBatch();
        gimnasioRepository.deleteAllInBatch();
    }

    @Test
    void dosClientesCompitenPorLaUltimaPlazaYSoloUnoReserva() throws Exception {
        Gimnasio gimnasio = new Gimnasio();
        gimnasio.setNombre("Gym concurrencia");
        gimnasio.setSlug("gym-concurrencia-" + System.nanoTime());
        gimnasio.setActivo(true);
        gimnasio = gimnasioRepository.saveAndFlush(gimnasio);
        Usuario entrenador = usuario(gimnasio, RolUsuario.ENTRENADOR, "trainer-concurrente");
        Usuario primero = usuario(gimnasio, RolUsuario.CLIENTE, "cliente-uno");
        Usuario segundo = usuario(gimnasio, RolUsuario.CLIENTE, "cliente-dos");
        Clase clase = new Clase();
        clase.setNombre("Ultima plaza");
        clase.setFechaHora(LocalDateTime.now().plusDays(2));
        clase.setDuracionMinutos(45);
        clase.setCapacidadMaxima(1);
        clase.setGimnasio(gimnasio);
        clase.setEntrenador(entrenador);
        clase.setActiva(true);
        clase = claseRepository.saveAndFlush(clase);

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            Future<Boolean> primeraPeticion = executor.submit(intentarReserva(ready, start, primero, clase.getId()));
            Future<Boolean> segundaPeticion = executor.submit(intentarReserva(ready, start, segundo, clase.getId()));
            assertTrue(ready.await(5, TimeUnit.SECONDS));
            start.countDown();

            int exitos = (primeraPeticion.get(10, TimeUnit.SECONDS) ? 1 : 0)
                    + (segundaPeticion.get(10, TimeUnit.SECONDS) ? 1 : 0);
            assertEquals(1, exitos);
        } finally {
            executor.shutdownNow();
        }

        assertEquals(1, reservaRepository.countByClaseIdAndEstado(clase.getId(), EstadoReserva.RESERVADA));
        assertEquals(1, reservaRepository.findByClaseId(clase.getId()).size());
    }

    private Callable<Boolean> intentarReserva(
            CountDownLatch ready,
            CountDownLatch start,
            Usuario cliente,
            Long claseId
    ) {
        return () -> {
            ready.countDown();
            start.await(5, TimeUnit.SECONDS);
            ReservaRequest request = new ReservaRequest();
            request.setClaseId(claseId);
            try {
                reservaService.crearReserva("Bearer " + authTokenService.crearToken(cliente), request);
                return true;
            } catch (ResponseStatusException error) {
                return false;
            }
        };
    }

    private Usuario usuario(Gimnasio gimnasio, RolUsuario rol, String clave) {
        Usuario usuario = new Usuario();
        usuario.setNombre(clave);
        usuario.setEmail(clave + "-" + System.nanoTime() + "@gymflow.test");
        usuario.setRol(rol);
        usuario.setActivo(true);
        usuario.setGimnasio(gimnasio);
        return usuarioRepository.saveAndFlush(usuario);
    }
}
