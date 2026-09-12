package com.julia.gymflow.service;

import com.julia.gymflow.dto.ClaseRequest;
import com.julia.gymflow.dto.ReservaRequest;
import com.julia.gymflow.entity.Clase;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.ProgramacionClase;
import com.julia.gymflow.entity.ReglaProgramacionClase;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.ClaseRepository;
import com.julia.gymflow.repository.GimnasioRepository;
import com.julia.gymflow.repository.ProgramacionClaseRepository;
import com.julia.gymflow.repository.ReglaProgramacionClaseRepository;
import com.julia.gymflow.repository.ReservaRepository;
import com.julia.gymflow.repository.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class ClaseLegacyMutationTests {

    @Autowired private ClaseService claseService;
    @Autowired private ReservaService reservaService;
    @Autowired private AuthTokenService authTokenService;
    @Autowired private ClaseRepository claseRepository;
    @Autowired private ReservaRepository reservaRepository;
    @Autowired private ReglaProgramacionClaseRepository reglaRepository;
    @Autowired private ProgramacionClaseRepository programacionRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private GimnasioRepository gimnasioRepository;

    @AfterEach
    void limpiarSesionesDePrueba() {
        reservaRepository.deleteAllInBatch();
        claseRepository.deleteAllInBatch();
        reglaRepository.deleteAllInBatch();
        programacionRepository.deleteAllInBatch();
    }

    @Test
    void rechazaCrearUnaSesionPasadaSinPersistirla() {
        Contexto contexto = contexto("crear-pasada");
        long clasesAntes = claseRepository.count();
        ClaseRequest request = request(contexto, LocalDateTime.now().minusMinutes(1));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> claseService.crearClase(bearer(contexto.admin()), request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertEquals(clasesAntes, claseRepository.count());
    }

    @Test
    void rechazaEditarYDesactivarUnaSesionHistoricaSinMutarla() {
        Contexto contexto = contexto("historica");
        Clase historica = sesion(contexto, LocalDateTime.now().minusDays(2), null);
        ClaseRequest request = request(contexto, LocalDateTime.now().plusDays(3));
        request.setNombre("Nombre no permitido");

        ResponseStatusException edicion = assertThrows(
                ResponseStatusException.class,
                () -> claseService.actualizarClase(bearer(contexto.admin()), historica.getId(), request)
        );
        ResponseStatusException desactivacion = assertThrows(
                ResponseStatusException.class,
                () -> claseService.desactivarClase(bearer(contexto.admin()), historica.getId())
        );

        assertEquals(HttpStatus.CONFLICT, edicion.getStatusCode());
        assertEquals(HttpStatus.CONFLICT, desactivacion.getStatusCode());
        Clase sinCambios = claseRepository.findById(historica.getId()).orElseThrow();
        assertEquals("Sesion legacy", sinCambios.getNombre());
        assertTrue(Duration.between(historica.getFechaHora(), sinCambios.getFechaHora())
                .abs().toNanos() <= 1_000);
        assertTrue(sinCambios.isActiva());
    }

    @Test
    void rechazaModificarYDesactivarDirectamenteUnaSesionRecurrente() {
        Contexto contexto = contexto("recurrente");
        ProgramacionClase programacion = programacion(contexto);
        Clase recurrente = sesion(contexto, LocalDateTime.now().plusDays(2), programacion);
        ClaseRequest request = request(contexto, LocalDateTime.now().plusDays(3));

        ResponseStatusException edicion = assertThrows(
                ResponseStatusException.class,
                () -> claseService.actualizarClase(bearer(contexto.admin()), recurrente.getId(), request)
        );
        ResponseStatusException desactivacion = assertThrows(
                ResponseStatusException.class,
                () -> claseService.desactivarClase(bearer(contexto.admin()), recurrente.getId())
        );

        assertEquals(HttpStatus.CONFLICT, edicion.getStatusCode());
        assertEquals(HttpStatus.CONFLICT, desactivacion.getStatusCode());
        Clase sinCambios = claseRepository.findById(recurrente.getId()).orElseThrow();
        assertTrue(sinCambios.isActiva());
        assertEquals(programacion.getId(), sinCambios.getProgramacion().getId());
    }

    @Test
    void conservaElAislamientoEntreGimnasiosEnMutacionesLegacy() {
        Contexto propietario = contexto("propietario");
        Contexto ajeno = contexto("ajeno");
        Clase clase = sesion(propietario, LocalDateTime.now().plusDays(2), null);
        ClaseRequest request = request(ajeno, LocalDateTime.now().plusDays(3));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> claseService.actualizarClase(bearer(ajeno.admin()), clase.getId(), request)
        );

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        assertEquals(propietario.gimnasio().getId(),
                claseRepository.findById(clase.getId()).orElseThrow().getGimnasio().getId());
    }

    @Test
    void rechazaReservarUnaSesionPasadaSinCrearReserva() {
        Contexto contexto = contexto("reserva-pasada");
        Usuario cliente = usuario(contexto.gimnasio(), RolUsuario.CLIENTE, "cliente-reserva-pasada");
        Clase historica = sesion(contexto, LocalDateTime.now().minusMinutes(1), null);
        ReservaRequest request = new ReservaRequest();
        request.setClaseId(historica.getId());
        request.setClienteId(cliente.getId());

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> reservaService.crearReserva(bearer(cliente), request)
        );
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertFalse(reservaRepository.existsByClaseIdAndEstado(
                historica.getId(), com.julia.gymflow.entity.EstadoReserva.RESERVADA
        ));
    }

    private Contexto contexto(String prefijo) {
        String suffix = prefijo + "-" + System.nanoTime();
        Gimnasio gimnasio = new Gimnasio();
        gimnasio.setNombre("Gym " + suffix);
        gimnasio.setSlug("gym-" + suffix);
        gimnasio.setActivo(true);
        gimnasio = gimnasioRepository.saveAndFlush(gimnasio);
        Usuario admin = usuario(gimnasio, RolUsuario.ADMIN, "admin-" + suffix);
        Usuario entrenador = usuario(gimnasio, RolUsuario.ENTRENADOR, "trainer-" + suffix);
        return new Contexto(gimnasio, admin, entrenador);
    }

    private Usuario usuario(Gimnasio gimnasio, RolUsuario rol, String nombre) {
        Usuario usuario = new Usuario();
        usuario.setNombre(nombre);
        usuario.setEmail(nombre + "@example.com");
        usuario.setRol(rol);
        usuario.setActivo(true);
        usuario.setGimnasio(gimnasio);
        return usuarioRepository.saveAndFlush(usuario);
    }

    private ClaseRequest request(Contexto contexto, LocalDateTime fechaHora) {
        ClaseRequest request = new ClaseRequest();
        request.setNombre("Sesion solicitada");
        request.setDescripcion("Descripcion");
        request.setFechaHora(fechaHora);
        request.setDuracionMinutos(45);
        request.setCapacidadMaxima(12);
        request.setGimnasioId(contexto.gimnasio().getId());
        request.setEntrenadorId(contexto.entrenador().getId());
        return request;
    }

    private ProgramacionClase programacion(Contexto contexto) {
        ProgramacionClase programacion = new ProgramacionClase();
        programacion.setGimnasio(contexto.gimnasio());
        programacion.setEntrenador(contexto.entrenador());
        programacion.setNombre("Programacion");
        programacion.setDuracionMinutos(45);
        programacion.setCapacidadMaxima(12);
        programacion.setFechaInicio(LocalDate.now());
        programacion.setActiva(true);
        ReglaProgramacionClase regla = new ReglaProgramacionClase();
        regla.setDiaSemana(1);
        regla.setHora(LocalTime.of(18, 0));
        programacion.reemplazarReglas(List.of(regla));
        return programacionRepository.saveAndFlush(programacion);
    }

    private Clase sesion(
            Contexto contexto,
            LocalDateTime fechaHora,
            ProgramacionClase programacion
    ) {
        Clase clase = new Clase();
        clase.setNombre("Sesion legacy");
        clase.setDescripcion("Descripcion");
        clase.setFechaHora(fechaHora);
        clase.setDuracionMinutos(45);
        clase.setCapacidadMaxima(12);
        clase.setGimnasio(contexto.gimnasio());
        clase.setEntrenador(contexto.entrenador());
        clase.setProgramacion(programacion);
        clase.setActiva(true);
        return claseRepository.saveAndFlush(clase);
    }

    private String bearer(Usuario usuario) {
        return "Bearer " + authTokenService.crearToken(usuario);
    }

    private record Contexto(Gimnasio gimnasio, Usuario admin, Usuario entrenador) {}
}
