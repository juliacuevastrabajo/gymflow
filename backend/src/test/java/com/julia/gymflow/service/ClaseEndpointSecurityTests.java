package com.julia.gymflow.service;

import com.julia.gymflow.entity.Clase;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.ClaseRepository;
import com.julia.gymflow.repository.GimnasioRepository;
import com.julia.gymflow.repository.ProgramacionClaseRepository;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ClaseEndpointSecurityTests {

    @Autowired private MockMvc mockMvc;
    @Autowired private AuthTokenService authTokenService;
    @Autowired private GimnasioRepository gimnasioRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ClaseRepository claseRepository;
    @Autowired private ReservaRepository reservaRepository;
    @Autowired private ProgramacionClaseRepository programacionRepository;

    @AfterEach
    void limpiarSesionesDePrueba() {
        reservaRepository.deleteAllInBatch();
        claseRepository.deleteAllInBatch();
        programacionRepository.deleteAllInBatch();
    }

    @Test
    void endpointsProtegidosRechazanTokenAusenteEInvalido() throws Exception {
        mockMvc.perform(get("/api/clases"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/clases").header("Authorization", "Bearer invalido"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/clases/programaciones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(programacionJson(1L)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void cadaRolSoloConsultaLasSesionesPermitidas() throws Exception {
        Contexto principal = contexto("seguridad-principal");
        Contexto ajeno = contexto("seguridad-ajeno");
        Usuario cliente = usuario(principal.gimnasio(), RolUsuario.CLIENTE, "cliente-seguridad");
        Usuario otroEntrenador = usuario(principal.gimnasio(), RolUsuario.ENTRENADOR, "otro-entrenador");
        Clase asignada = clase(principal.gimnasio(), principal.entrenador(), "Asignada", true);
        clase(principal.gimnasio(), otroEntrenador, "Otra del gimnasio", true);
        clase(ajeno.gimnasio(), ajeno.entrenador(), "Otro gimnasio", true);
        clase(principal.gimnasio(), principal.entrenador(), "Inactiva", false);

        mockMvc.perform(get("/api/clases").header("Authorization", bearer(cliente)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        mockMvc.perform(get("/api/clases").header("Authorization", bearer(principal.entrenador())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(asignada.getId()));

        mockMvc.perform(get("/api/clases").header("Authorization", bearer(principal.admin())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3));
    }

    @Test
    void programacionesSonSoloDeAdministracionYDelPropioGimnasio() throws Exception {
        Contexto principal = contexto("programacion-principal");
        Contexto ajeno = contexto("programacion-ajeno");
        Usuario cliente = usuario(principal.gimnasio(), RolUsuario.CLIENTE, "cliente-programacion");

        mockMvc.perform(get("/api/clases/programaciones").header("Authorization", bearer(cliente)))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/clases/gimnasio/{id}", ajeno.gimnasio().getId())
                        .header("Authorization", bearer(principal.admin())))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/clases/programaciones")
                        .header("Authorization", bearer(principal.admin()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(programacionJson(ajeno.entrenador().getId())))
                .andExpect(status().isForbidden());
    }

    private Contexto contexto(String slug) {
        Gimnasio gimnasio = new Gimnasio();
        gimnasio.setNombre("Gimnasio " + slug);
        gimnasio.setSlug(slug + "-" + System.nanoTime());
        gimnasio.setActivo(true);
        gimnasio = gimnasioRepository.saveAndFlush(gimnasio);
        Usuario admin = usuario(gimnasio, RolUsuario.ADMIN, slug + "-admin");
        Usuario entrenador = usuario(gimnasio, RolUsuario.ENTRENADOR, slug + "-trainer");
        return new Contexto(gimnasio, admin, entrenador);
    }

    private Usuario usuario(Gimnasio gimnasio, RolUsuario rol, String clave) {
        Usuario usuario = new Usuario();
        usuario.setNombre(rol.name() + " " + clave);
        usuario.setEmail(clave + "-" + System.nanoTime() + "@gymflow.test");
        usuario.setRol(rol);
        usuario.setActivo(true);
        usuario.setGimnasio(gimnasio);
        return usuarioRepository.saveAndFlush(usuario);
    }

    private Clase clase(Gimnasio gimnasio, Usuario entrenador, String nombre, boolean activa) {
        Clase clase = new Clase();
        clase.setNombre(nombre);
        clase.setFechaHora(LocalDateTime.now().plusDays(2));
        clase.setDuracionMinutos(45);
        clase.setCapacidadMaxima(15);
        clase.setGimnasio(gimnasio);
        clase.setEntrenador(entrenador);
        clase.setActiva(activa);
        return claseRepository.saveAndFlush(clase);
    }

    private String bearer(Usuario usuario) {
        return "Bearer " + authTokenService.crearToken(usuario);
    }

    private String programacionJson(Long entrenadorId) {
        return """
                {
                  "nombre": "Programacion segura",
                  "duracionMinutos": 45,
                  "capacidadMaxima": 15,
                  "entrenadorId": %d,
                  "fechaInicio": "2026-09-01",
                  "reglas": [{"diaSemana": 2, "hora": "18:00"}]
                }
                """.formatted(entrenadorId);
    }

    private record Contexto(Gimnasio gimnasio, Usuario admin, Usuario entrenador) {}
}
