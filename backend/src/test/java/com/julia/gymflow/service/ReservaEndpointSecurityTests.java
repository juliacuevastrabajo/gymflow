package com.julia.gymflow.service;

import com.julia.gymflow.entity.Clase;
import com.julia.gymflow.entity.EstadoReserva;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.Reserva;
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
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties =
        "spring.datasource.url=jdbc:h2:mem:reservas-endpoint-security;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE")
@AutoConfigureMockMvc
class ReservaEndpointSecurityTests {

    @Autowired private MockMvc mockMvc;
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
    void todasLasRutasRechazanTokenAusenteEInvalido() throws Exception {
        mockMvc.perform(get("/api/reservas")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/reservas/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/reservas/clase/1")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/reservas/cliente/1")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"claseId\":1}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/reservas/1/cancelar"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/reservas").header("Authorization", "Bearer invalido"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/reservas")
                        .header("Authorization", "Bearer invalido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"claseId\":1}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listadosRespetanRolAsignacionYAislamiento() throws Exception {
        Contexto principal = contexto("listados-principal");
        Contexto ajeno = contexto("listados-ajeno");
        Usuario cliente = usuario(principal.gimnasio(), RolUsuario.CLIENTE, "cliente-listado", true);
        Usuario otroCliente = usuario(principal.gimnasio(), RolUsuario.CLIENTE, "otro-cliente-listado", true);
        Usuario otroEntrenador = usuario(principal.gimnasio(), RolUsuario.ENTRENADOR, "otro-trainer-listado", true);
        Clase asignada = clase(principal.gimnasio(), principal.entrenador(), true, 5, 2);
        Clase noAsignada = clase(principal.gimnasio(), otroEntrenador, true, 5, 2);
        Clase extranjera = clase(ajeno.gimnasio(), ajeno.entrenador(), true, 5, 2);
        reserva(asignada, cliente, EstadoReserva.RESERVADA);
        reserva(noAsignada, otroCliente, EstadoReserva.RESERVADA);
        reserva(extranjera, usuario(ajeno.gimnasio(), RolUsuario.CLIENTE, "cliente-ajeno", true), EstadoReserva.RESERVADA);

        mockMvc.perform(get("/api/reservas").header("Authorization", bearer(principal.admin())))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2));
        mockMvc.perform(get("/api/reservas").header("Authorization", bearer(principal.entrenador())))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].claseId").value(asignada.getId()));
        mockMvc.perform(get("/api/reservas/me").header("Authorization", bearer(cliente)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].clienteId").value(cliente.getId()));
        mockMvc.perform(get("/api/reservas/cliente/{id}", otroCliente.getId())
                        .header("Authorization", bearer(cliente)))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/reservas/clase/{id}", noAsignada.getId())
                        .header("Authorization", bearer(principal.entrenador())))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/reservas/clase/{id}", extranjera.getId())
                        .header("Authorization", bearer(principal.admin())))
                .andExpect(status().isForbidden());
    }

    @Test
    void impideSuplantacionCancelacionAjenaYMutacionesDeEntrenador() throws Exception {
        Contexto principal = contexto("mutaciones-principal");
        Contexto ajeno = contexto("mutaciones-ajeno");
        Usuario cliente = usuario(principal.gimnasio(), RolUsuario.CLIENTE, "cliente-muta", true);
        Usuario otroCliente = usuario(principal.gimnasio(), RolUsuario.CLIENTE, "otro-cliente-muta", true);
        Usuario clienteAjeno = usuario(ajeno.gimnasio(), RolUsuario.CLIENTE, "cliente-muta-ajeno", true);
        Clase sesion = clase(principal.gimnasio(), principal.entrenador(), true, 5, 2);
        Reserva reservaAjena = reserva(sesion, otroCliente, EstadoReserva.RESERVADA);
        long reservasAntes = reservaRepository.count();

        mockMvc.perform(post("/api/reservas")
                        .header("Authorization", bearer(cliente))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reservaJson(sesion.getId(), otroCliente.getId())))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/reservas/{id}/cancelar", reservaAjena.getId())
                        .header("Authorization", bearer(cliente)))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/reservas")
                        .header("Authorization", bearer(principal.entrenador()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reservaJson(sesion.getId(), cliente.getId())))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/reservas")
                        .header("Authorization", bearer(principal.admin()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reservaJson(sesion.getId(), clienteAjeno.getId())))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/reservas/{id}/cancelar", reservaAjena.getId())
                        .header("Authorization", bearer(principal.entrenador())))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/reservas/{id}/cancelar", reservaAjena.getId())
                        .header("Authorization", bearer(ajeno.admin())))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/reservas/cliente/{id}", otroCliente.getId())
                        .header("Authorization", bearer(principal.entrenador())))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/reservas").header("Authorization", bearer(cliente)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        org.junit.jupiter.api.Assertions.assertEquals(reservasAntes, reservaRepository.count());
        org.junit.jupiter.api.Assertions.assertEquals(
                EstadoReserva.RESERVADA,
                reservaRepository.findById(reservaAjena.getId()).orElseThrow().getEstado()
        );
    }

    @Test
    void aplicaReglasTemporalesCapacidadDuplicidadYEstado() throws Exception {
        Contexto contexto = contexto("reglas");
        Usuario cliente = usuario(contexto.gimnasio(), RolUsuario.CLIENTE, "cliente-reglas", true);
        Usuario clienteInactivo = usuario(contexto.gimnasio(), RolUsuario.CLIENTE, "cliente-inactivo", false);
        Clase pasada = clase(contexto.gimnasio(), contexto.entrenador(), true, 5, -1);
        Clase inactiva = clase(contexto.gimnasio(), contexto.entrenador(), false, 5, 2);
        Clase completa = clase(contexto.gimnasio(), contexto.entrenador(), true, 1, 2);
        reserva(completa, usuario(contexto.gimnasio(), RolUsuario.CLIENTE, "cliente-ocupa", true), EstadoReserva.RESERVADA);
        Clase duplicada = clase(contexto.gimnasio(), contexto.entrenador(), true, 5, 2);
        reserva(duplicada, cliente, EstadoReserva.RESERVADA);
        long reservasAntes = reservaRepository.count();

        crearComoCliente(cliente, pasada).andExpect(status().isBadRequest());
        crearComoCliente(cliente, inactiva).andExpect(status().isConflict());
        crearComoCliente(cliente, completa).andExpect(status().isConflict());
        crearComoCliente(cliente, duplicada).andExpect(status().isConflict());
        mockMvc.perform(post("/api/reservas")
                        .header("Authorization", bearer(contexto.admin()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reservaJson(duplicada.getId(), clienteInactivo.getId())))
                .andExpect(status().isConflict());

        contexto.gimnasio().setActivo(false);
        gimnasioRepository.saveAndFlush(contexto.gimnasio());
        crearComoCliente(cliente, duplicada).andExpect(status().isForbidden());
        org.junit.jupiter.api.Assertions.assertEquals(reservasAntes, reservaRepository.count());
    }

    @Test
    void permiteReservarDeNuevoTrasCancelarPeroNoCancelarDosVecesNiHistorico() throws Exception {
        Contexto contexto = contexto("cancelar");
        Usuario cliente = usuario(contexto.gimnasio(), RolUsuario.CLIENTE, "cliente-cancelar", true);
        Clase futura = clase(contexto.gimnasio(), contexto.entrenador(), true, 2, 2);

        crearComoCliente(cliente, futura).andExpect(status().isOk());
        Reserva primera = reservaRepository.findByClienteId(cliente.getId()).get(0);
        mockMvc.perform(put("/api/reservas/{id}/cancelar", primera.getId())
                        .header("Authorization", bearer(cliente)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.estado").value("CANCELADA"));
        mockMvc.perform(put("/api/reservas/{id}/cancelar", primera.getId())
                        .header("Authorization", bearer(cliente)))
                .andExpect(status().isConflict());
        crearComoCliente(cliente, futura).andExpect(status().isOk());

        Clase historica = clase(contexto.gimnasio(), contexto.entrenador(), true, 2, -1);
        Reserva reservaHistorica = reserva(historica, cliente, EstadoReserva.RESERVADA);
        mockMvc.perform(put("/api/reservas/{id}/cancelar", reservaHistorica.getId())
                        .header("Authorization", bearer(cliente)))
                .andExpect(status().isConflict());
        org.junit.jupiter.api.Assertions.assertEquals(
                EstadoReserva.RESERVADA,
                reservaRepository.findById(reservaHistorica.getId()).orElseThrow().getEstado()
        );
    }

    private org.springframework.test.web.servlet.ResultActions crearComoCliente(Usuario cliente, Clase clase)
            throws Exception {
        return mockMvc.perform(post("/api/reservas")
                .header("Authorization", bearer(cliente))
                .contentType(MediaType.APPLICATION_JSON)
                .content(reservaJson(clase.getId(), null)));
    }

    private Contexto contexto(String clave) {
        Gimnasio gimnasio = new Gimnasio();
        gimnasio.setNombre("Gym " + clave);
        gimnasio.setSlug(clave + "-" + System.nanoTime());
        gimnasio.setActivo(true);
        gimnasio = gimnasioRepository.saveAndFlush(gimnasio);
        Usuario admin = usuario(gimnasio, RolUsuario.ADMIN, clave + "-admin", true);
        Usuario entrenador = usuario(gimnasio, RolUsuario.ENTRENADOR, clave + "-trainer", true);
        return new Contexto(gimnasio, admin, entrenador);
    }

    private Usuario usuario(Gimnasio gimnasio, RolUsuario rol, String clave, boolean activo) {
        Usuario usuario = new Usuario();
        usuario.setNombre(clave);
        usuario.setEmail(clave + "-" + System.nanoTime() + "@gymflow.test");
        usuario.setRol(rol);
        usuario.setActivo(activo);
        usuario.setGimnasio(gimnasio);
        return usuarioRepository.saveAndFlush(usuario);
    }

    private Clase clase(
            Gimnasio gimnasio,
            Usuario entrenador,
            boolean activa,
            int capacidad,
            int diasDesdeHoy
    ) {
        Clase clase = new Clase();
        clase.setNombre("Clase " + System.nanoTime());
        clase.setFechaHora(LocalDateTime.now().plusDays(diasDesdeHoy));
        clase.setDuracionMinutos(45);
        clase.setCapacidadMaxima(capacidad);
        clase.setGimnasio(gimnasio);
        clase.setEntrenador(entrenador);
        clase.setActiva(activa);
        return claseRepository.saveAndFlush(clase);
    }

    private Reserva reserva(Clase clase, Usuario cliente, EstadoReserva estado) {
        Reserva reserva = new Reserva();
        reserva.setClase(clase);
        reserva.setCliente(cliente);
        reserva.setEstado(estado);
        reserva.setFechaReserva(LocalDateTime.now());
        return reservaRepository.saveAndFlush(reserva);
    }

    private String bearer(Usuario usuario) {
        return "Bearer " + authTokenService.crearToken(usuario);
    }

    private String reservaJson(Long claseId, Long clienteId) {
        return clienteId == null
                ? "{\"claseId\":" + claseId + "}"
                : "{\"claseId\":" + claseId + ",\"clienteId\":" + clienteId + "}";
    }

    private record Contexto(Gimnasio gimnasio, Usuario admin, Usuario entrenador) {}
}
