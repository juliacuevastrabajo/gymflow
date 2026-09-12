package com.julia.gymflow.service;

import com.julia.gymflow.dto.ProgramacionClaseRequest;
import com.julia.gymflow.dto.ReglaProgramacionClaseRequest;
import com.julia.gymflow.entity.Clase;
import com.julia.gymflow.entity.EstadoReserva;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.ProgramacionClase;
import com.julia.gymflow.entity.ReglaProgramacionClase;
import com.julia.gymflow.entity.Reserva;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.ClaseRepository;
import com.julia.gymflow.repository.GimnasioRepository;
import com.julia.gymflow.repository.ProgramacionClaseRepository;
import com.julia.gymflow.repository.ReservaRepository;
import com.julia.gymflow.repository.ReglaProgramacionClaseRepository;
import com.julia.gymflow.repository.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class ProgramacionClaseMaterializacionTests {

    @Autowired private ProgramacionClaseMaterializadorService materializador;
    @Autowired private ProgramacionClaseService programacionService;
    @Autowired private ClaseLegacyBackfillService backfillService;
    @Autowired private ProgramacionClaseRepository programacionRepository;
    @Autowired private ClaseRepository claseRepository;
    @Autowired private ReservaRepository reservaRepository;
    @Autowired private ReglaProgramacionClaseRepository reglaRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private GimnasioRepository gimnasioRepository;
    @Autowired private AuthTokenService authTokenService;

    @AfterEach
    void limpiarRecurrenciaDePrueba() {
        reservaRepository.deleteAllInBatch();
        claseRepository.deleteAllInBatch();
        reglaRepository.deleteAllInBatch();
        programacionRepository.deleteAllInBatch();
    }

    @Test
    void materializaDoceSemanasConParesExactosYCruceDeAnio() {
        Contexto contexto = contexto("doce-semanas");
        ProgramacionClase programacion = programacion(
                contexto,
                LocalDate.of(2026, 12, 28),
                regla(1, 18, 0),
                regla(3, 20, 0),
                regla(4, 18, 0)
        );
        LocalDateTime referencia = LocalDateTime.of(2026, 12, 28, 8, 0);

        int creadas = materializador.materializar(programacion.getId(), referencia);
        List<Clase> sesiones = claseRepository.findByProgramacionIdOrderByFechaHoraAsc(programacion.getId());

        assertEquals(creadas, sesiones.size());
        assertTrue(sesiones.size() >= 36);
        assertTrue(sesiones.stream().allMatch(sesion -> Set.of(
                "1@18:00", "3@20:00", "4@18:00"
        ).contains(sesion.getFechaHora().getDayOfWeek().getValue()
                + "@" + sesion.getFechaHora().toLocalTime())));
        assertTrue(sesiones.get(sesiones.size() - 1).getFechaHora().toLocalDate()
                .isAfter(referencia.toLocalDate().plusWeeks(11)));
        assertTrue(sesiones.stream().anyMatch(sesion -> sesion.getFechaHora().getYear() == 2027));
    }

    @Test
    void dobleMaterializacionYReinicioNoDuplicanNiReactivanUnaSesion() {
        Contexto contexto = contexto("idempotente");
        ProgramacionClase programacion = programacion(
                contexto,
                LocalDate.of(2026, 9, 1),
                regla(2, 10, 0)
        );
        LocalDateTime referencia = LocalDateTime.of(2026, 9, 1, 8, 0);

        int primera = materializador.materializar(programacion.getId(), referencia);
        int segunda = materializador.materializar(programacion.getId(), referencia);
        List<Clase> sesiones = claseRepository.findByProgramacionIdOrderByFechaHoraAsc(programacion.getId());
        Clase desactivada = sesiones.get(1);
        desactivada.setActiva(false);
        claseRepository.saveAndFlush(desactivada);
        int tercera = materializador.materializar(programacion.getId(), referencia);

        assertTrue(primera > 0);
        assertEquals(0, segunda);
        assertEquals(0, tercera);
        assertEquals(sesiones.size(), claseRepository.findByProgramacionIdOrderByFechaHoraAsc(programacion.getId()).size());
        assertFalse(claseRepository.findById(desactivada.getId()).orElseThrow().isActiva());
    }

    @Test
    void dosEjecucionesConcurrentesNoDuplicanSesiones() throws Exception {
        Contexto contexto = contexto("concurrente");
        ProgramacionClase programacion = programacion(
                contexto,
                LocalDate.of(2026, 10, 1),
                regla(1, 9, 0),
                regla(5, 17, 30)
        );
        LocalDateTime referencia = LocalDateTime.of(2026, 10, 1, 8, 0);
        CountDownLatch preparados = new CountDownLatch(2);
        CountDownLatch inicio = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<Integer> primera = executor.submit(() -> ejecutarConcurrente(
                    programacion.getId(), referencia, preparados, inicio
            ));
            Future<Integer> segunda = executor.submit(() -> ejecutarConcurrente(
                    programacion.getId(), referencia, preparados, inicio
            ));
            assertTrue(preparados.await(5, TimeUnit.SECONDS));
            inicio.countDown();
            int totalInsertado = primera.get(15, TimeUnit.SECONDS) + segunda.get(15, TimeUnit.SECONDS);
            List<Clase> sesiones = claseRepository.findByProgramacionIdOrderByFechaHoraAsc(programacion.getId());
            assertEquals(totalInsertado, sesiones.size());
            assertEquals(
                    sesiones.size(),
                    sesiones.stream().map(Clase::getFechaHora).collect(Collectors.toSet()).size()
            );
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void extiendeElHorizonteYUnaProgramacionDesactivadaNoGenera() {
        Contexto contexto = contexto("horizonte");
        ProgramacionClase programacion = programacion(
                contexto,
                LocalDate.of(2026, 9, 1),
                regla(3, 12, 0)
        );
        LocalDateTime primeraReferencia = LocalDateTime.of(2026, 9, 1, 8, 0);
        materializador.materializar(programacion.getId(), primeraReferencia);
        int antes = claseRepository.findByProgramacionIdOrderByFechaHoraAsc(programacion.getId()).size();

        int extension = materializador.materializar(
                programacion.getId(),
                primeraReferencia.plusWeeks(4)
        );
        programacion.setActiva(false);
        programacionRepository.saveAndFlush(programacion);
        int desactivada = materializador.materializar(
                programacion.getId(),
                primeraReferencia.plusWeeks(8)
        );

        assertTrue(extension > 0);
        assertTrue(claseRepository.findByProgramacionIdOrderByFechaHoraAsc(programacion.getId()).size() > antes);
        assertEquals(0, desactivada);
    }

    @Test
    void editarActualizaSoloFuturoYBloqueaRetiradaConReservas() {
        Contexto contexto = contexto("edicion");
        ProgramacionClase programacion = programacion(
                contexto,
                LocalDate.now(),
                regla(1, 18, 0),
                regla(3, 20, 0)
        );
        materializador.materializar(programacion.getId(), LocalDateTime.now());
        Clase historica = sesion(programacion, LocalDateTime.now().minusDays(10), true);
        Clase futuraReservada = claseRepository.findByProgramacionIdOrderByFechaHoraAsc(programacion.getId())
                .stream()
                .filter(clase -> clase.getFechaHora().isAfter(LocalDateTime.now())
                        && clase.getFechaHora().getDayOfWeek().getValue() == 1)
                .findFirst()
                .orElseThrow();
        Usuario cliente = usuario(contexto.gimnasio(), RolUsuario.CLIENTE, "cliente-edicion");
        Reserva reserva = new Reserva();
        reserva.setClase(futuraReservada);
        reserva.setCliente(cliente);
        reserva.setEstado(EstadoReserva.RESERVADA);
        reserva.setFechaReserva(LocalDateTime.now());
        reservaRepository.saveAndFlush(reserva);

        ProgramacionClaseRequest datosGenerales = new ProgramacionClaseRequest();
        datosGenerales.setNombre("Nombre actualizado");
        datosGenerales.setDuracionMinutos(50);
        datosGenerales.setCapacidadMaxima(18);
        programacionService.actualizar(bearer(contexto.admin()), programacion.getId(), datosGenerales);

        assertEquals("Clase recurrente", claseRepository.findById(historica.getId()).orElseThrow().getNombre());
        assertEquals("Nombre actualizado", claseRepository.findById(futuraReservada.getId()).orElseThrow().getNombre());

        ProgramacionClaseRequest retirarLunes = new ProgramacionClaseRequest();
        retirarLunes.setReglas(List.of(requestRegla(3, 20, 0)));
        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> programacionService.actualizar(
                        bearer(contexto.admin()), programacion.getId(), retirarLunes
                )
        );
        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        assertTrue(claseRepository.findById(futuraReservada.getId()).orElseThrow().isActiva());
    }

    @Test
    void anadirYRetirarReglasActualizaSoloSesionesFuturas() {
        Contexto contexto = contexto("reglas");
        ProgramacionClase programacion = programacion(
                contexto,
                LocalDate.now(),
                regla(2, 18, 0)
        );
        materializador.materializar(programacion.getId(), LocalDateTime.now());

        ProgramacionClaseRequest anadirJueves = new ProgramacionClaseRequest();
        anadirJueves.setReglas(List.of(
                requestRegla(2, 18, 0),
                requestRegla(4, 20, 0)
        ));
        programacionService.actualizar(bearer(contexto.admin()), programacion.getId(), anadirJueves);

        assertTrue(claseRepository.findByProgramacionIdOrderByFechaHoraAsc(programacion.getId()).stream()
                .anyMatch(clase -> clase.isActiva()
                        && clase.getFechaHora().isAfter(LocalDateTime.now())
                        && clase.getFechaHora().getDayOfWeek().getValue() == 4
                        && clase.getFechaHora().toLocalTime().equals(LocalTime.of(20, 0))));

        ProgramacionClaseRequest retirarMartes = new ProgramacionClaseRequest();
        retirarMartes.setReglas(List.of(requestRegla(4, 20, 0)));
        programacionService.actualizar(bearer(contexto.admin()), programacion.getId(), retirarMartes);

        List<Clase> sesiones = claseRepository.findByProgramacionIdOrderByFechaHoraAsc(programacion.getId());
        assertTrue(sesiones.stream()
                .filter(clase -> clase.getFechaHora().isAfter(LocalDateTime.now()))
                .filter(clase -> clase.getFechaHora().getDayOfWeek().getValue() == 2)
                .noneMatch(Clase::isActiva));
        assertTrue(sesiones.stream()
                .filter(clase -> clase.getFechaHora().isAfter(LocalDateTime.now()))
                .filter(clase -> clase.getFechaHora().getDayOfWeek().getValue() == 4)
                .allMatch(Clase::isActiva));
    }

    @Test
    void desactivarProgramacionBloqueaReservasYDetieneLaGeneracion() {
        Contexto contexto = contexto("desactivar");
        ProgramacionClase programacion = programacion(
                contexto,
                LocalDate.now(),
                regla(5, 19, 0)
        );
        materializador.materializar(programacion.getId(), LocalDateTime.now());
        Clase futura = claseRepository.findByProgramacionIdOrderByFechaHoraAsc(programacion.getId())
                .stream()
                .filter(clase -> clase.getFechaHora().isAfter(LocalDateTime.now()))
                .findFirst()
                .orElseThrow();
        Usuario cliente = usuario(contexto.gimnasio(), RolUsuario.CLIENTE, "cliente-desactivar");
        Reserva reserva = new Reserva();
        reserva.setClase(futura);
        reserva.setCliente(cliente);
        reserva.setEstado(EstadoReserva.RESERVADA);
        reserva.setFechaReserva(LocalDateTime.now());
        reserva = reservaRepository.saveAndFlush(reserva);

        ResponseStatusException conflicto = assertThrows(
                ResponseStatusException.class,
                () -> programacionService.desactivar(bearer(contexto.admin()), programacion.getId())
        );
        assertEquals(HttpStatus.CONFLICT, conflicto.getStatusCode());

        reserva.setEstado(EstadoReserva.CANCELADA);
        reservaRepository.saveAndFlush(reserva);
        programacionService.desactivar(bearer(contexto.admin()), programacion.getId());

        ProgramacionClase desactivada = programacionRepository.findById(programacion.getId()).orElseThrow();
        assertFalse(desactivada.isActiva());
        assertTrue(claseRepository.findByProgramacionIdOrderByFechaHoraAsc(programacion.getId()).stream()
                .filter(clase -> clase.getFechaHora().isAfter(LocalDateTime.now()))
                .noneMatch(Clase::isActiva));
        assertEquals(0, materializador.materializar(programacion.getId(), LocalDateTime.now().plusWeeks(20)));
    }

    @Test
    void reducirCapacidadPorDebajoDeReservasNoMutaProgramacionNiSesiones() {
        Contexto contexto = contexto("capacidad");
        ProgramacionClase programacion = programacion(
                contexto,
                LocalDate.now(),
                regla(LocalDate.now().plusDays(1).getDayOfWeek().getValue(), 18, 0)
        );
        materializador.materializar(programacion.getId(), LocalDateTime.now());
        Clase futura = claseRepository.findByProgramacionIdOrderByFechaHoraAsc(programacion.getId())
                .stream()
                .filter(clase -> clase.getFechaHora().isAfter(LocalDateTime.now()))
                .findFirst()
                .orElseThrow();
        for (int indice = 0; indice < 3; indice++) {
            Usuario cliente = usuario(contexto.gimnasio(), RolUsuario.CLIENTE, "cliente-capacidad-" + indice);
            Reserva reserva = new Reserva();
            reserva.setClase(futura);
            reserva.setCliente(cliente);
            reserva.setEstado(EstadoReserva.RESERVADA);
            reserva.setFechaReserva(LocalDateTime.now());
            reservaRepository.saveAndFlush(reserva);
        }
        int reglasAntes = reglaRepository
                .findByProgramacionIdOrderByDiaSemanaAscHoraAsc(programacion.getId())
                .size();
        long reservasAntes = reservaRepository.countByClaseIdAndEstado(futura.getId(), EstadoReserva.RESERVADA);

        ProgramacionClaseRequest request = new ProgramacionClaseRequest();
        request.setNombre("Nombre que no debe guardarse");
        request.setCapacidadMaxima(2);
        ResponseStatusException conflicto = assertThrows(
                ResponseStatusException.class,
                () -> programacionService.actualizar(bearer(contexto.admin()), programacion.getId(), request)
        );

        assertEquals(HttpStatus.CONFLICT, conflicto.getStatusCode());
        ProgramacionClase sinCambios = programacionRepository.findById(programacion.getId()).orElseThrow();
        Clase sesionSinCambios = claseRepository.findById(futura.getId()).orElseThrow();
        assertEquals("Clase recurrente", sinCambios.getNombre());
        assertEquals(20, sinCambios.getCapacidadMaxima());
        assertEquals("Clase recurrente", sesionSinCambios.getNombre());
        assertEquals(20, sesionSinCambios.getCapacidadMaxima());
        assertEquals(
                reglasAntes,
                reglaRepository.findByProgramacionIdOrderByDiaSemanaAscHoraAsc(programacion.getId()).size()
        );
        assertEquals(
                reservasAntes,
                reservaRepository.countByClaseIdAndEstado(futura.getId(), EstadoReserva.RESERVADA)
        );
    }

    @Test
    void backfillConservaIdsReservasYParesYEsIdempotente() {
        Contexto contexto = contexto("backfill");
        long programacionesAntes = programacionRepository.count();
        Clase martes = sesionLegacy(contexto, LocalDateTime.of(2026, 7, 7, 18, 0));
        Clase jueves = sesionLegacy(contexto, LocalDateTime.of(2026, 7, 9, 20, 0));
        Usuario cliente = usuario(contexto.gimnasio(), RolUsuario.CLIENTE, "cliente-backfill");
        Reserva reserva = new Reserva();
        reserva.setClase(martes);
        reserva.setCliente(cliente);
        reserva.setEstado(EstadoReserva.RESERVADA);
        reserva.setFechaReserva(LocalDateTime.now());
        reserva = reservaRepository.saveAndFlush(reserva);
        Long reservaId = reserva.getId();

        ClaseLegacyBackfillService.ResultadoBackfill primero = backfillService.ejecutar();
        ClaseLegacyBackfillService.ResultadoBackfill segundo = backfillService.ejecutar();
        Clase martesActual = claseRepository.findById(martes.getId()).orElseThrow();
        Clase juevesActual = claseRepository.findById(jueves.getId()).orElseThrow();

        assertEquals(1, primero.programacionesCreadas());
        assertEquals(2, primero.sesionesVinculadas());
        assertEquals(0, segundo.programacionesCreadas());
        assertEquals(programacionesAntes + 1, programacionRepository.count());
        assertEquals(martesActual.getProgramacion().getId(), juevesActual.getProgramacion().getId());
        assertEquals(reservaId, reservaRepository.findById(reservaId).orElseThrow().getId());
        assertEquals(
                Set.of("2@18:00", "4@20:00"),
                reglaRepository.findByProgramacionIdOrderByDiaSemanaAscHoraAsc(
                                martesActual.getProgramacion().getId()
                        ).stream()
                        .map(regla -> regla.getDiaSemana() + "@" + regla.getHora())
                        .collect(Collectors.toSet())
        );
    }

    private int ejecutarConcurrente(
            Long id,
            LocalDateTime referencia,
            CountDownLatch preparados,
            CountDownLatch inicio
    ) throws Exception {
        preparados.countDown();
        inicio.await(5, TimeUnit.SECONDS);
        return materializador.materializar(id, referencia);
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
        usuario.setPasswordHash(new PasswordService().hash("Password8"));
        usuario.setRol(rol);
        usuario.setActivo(true);
        usuario.setFechaAlta(LocalDateTime.now());
        usuario.setGimnasio(gimnasio);
        return usuarioRepository.saveAndFlush(usuario);
    }

    private ProgramacionClase programacion(
            Contexto contexto,
            LocalDate inicio,
            ReglaProgramacionClase... reglas
    ) {
        ProgramacionClase programacion = new ProgramacionClase();
        programacion.setGimnasio(contexto.gimnasio());
        programacion.setEntrenador(contexto.entrenador());
        programacion.setNombre("Clase recurrente");
        programacion.setDescripcion("Descripcion");
        programacion.setDuracionMinutos(45);
        programacion.setCapacidadMaxima(20);
        programacion.setFechaInicio(inicio);
        programacion.setActiva(true);
        programacion.reemplazarReglas(List.of(reglas));
        return programacionRepository.saveAndFlush(programacion);
    }

    private ReglaProgramacionClase regla(int dia, int hora, int minuto) {
        ReglaProgramacionClase regla = new ReglaProgramacionClase();
        regla.setDiaSemana(dia);
        regla.setHora(LocalTime.of(hora, minuto));
        return regla;
    }

    private ReglaProgramacionClaseRequest requestRegla(int dia, int hora, int minuto) {
        ReglaProgramacionClaseRequest regla = new ReglaProgramacionClaseRequest();
        regla.setDiaSemana(dia);
        regla.setHora(LocalTime.of(hora, minuto));
        return regla;
    }

    private Clase sesion(ProgramacionClase programacion, LocalDateTime fecha, boolean activa) {
        Clase clase = new Clase();
        clase.setNombre(programacion.getNombre());
        clase.setDescripcion(programacion.getDescripcion());
        clase.setFechaHora(fecha);
        clase.setDuracionMinutos(programacion.getDuracionMinutos());
        clase.setCapacidadMaxima(programacion.getCapacidadMaxima());
        clase.setGimnasio(programacion.getGimnasio());
        clase.setEntrenador(programacion.getEntrenador());
        clase.setProgramacion(programacion);
        clase.setActiva(activa);
        return claseRepository.saveAndFlush(clase);
    }

    private Clase sesionLegacy(Contexto contexto, LocalDateTime fecha) {
        Clase clase = new Clase();
        clase.setNombre("Legacy " + contexto.gimnasio().getSlug());
        clase.setDescripcion("Horario original");
        clase.setFechaHora(fecha);
        clase.setDuracionMinutos(45);
        clase.setCapacidadMaxima(12);
        clase.setGimnasio(contexto.gimnasio());
        clase.setEntrenador(contexto.entrenador());
        clase.setActiva(true);
        return claseRepository.saveAndFlush(clase);
    }

    private String bearer(Usuario usuario) {
        return "Bearer " + authTokenService.crearToken(usuario);
    }

    private record Contexto(Gimnasio gimnasio, Usuario admin, Usuario entrenador) {}
}
