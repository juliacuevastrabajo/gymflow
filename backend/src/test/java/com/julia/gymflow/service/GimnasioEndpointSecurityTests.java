package com.julia.gymflow.service;

import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.GimnasioRepository;
import com.julia.gymflow.repository.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class GimnasioEndpointSecurityTests {

    @Autowired private MockMvc mockMvc;
    @Autowired private AuthTokenService authTokenService;
    @Autowired private GimnasioRepository gimnasioRepository;
    @Autowired private UsuarioRepository usuarioRepository;

    @AfterEach
    void limpiar() {
        usuarioRepository.deleteAllInBatch();
        gimnasioRepository.deleteAllInBatch();
    }

    @Test
    void todasLasRutasAdministrativasRechazanTokenAusenteEInvalido() throws Exception {
        mockMvc.perform(get("/api/gimnasios")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/gimnasios/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/gimnasios/1")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/gimnasios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"No permitido\"}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/gimnasios/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/gimnasios/1"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/gimnasios/me").header("Authorization", "Bearer invalido"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void meYListadoLegacyDevuelvenSoloElGimnasioPropioConDtoLimitado() throws Exception {
        Gimnasio propio = gimnasio("gym-propio");
        gimnasio("gym-no-visible");
        Usuario cliente = usuario(propio, RolUsuario.CLIENTE, "cliente-gym");

        mockMvc.perform(get("/api/gimnasios/me").header("Authorization", bearer(cliente)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(propio.getId()))
                .andExpect(jsonPath("$.nombre").value(propio.getNombre()))
                .andExpect(jsonPath("$.slug").doesNotExist())
                .andExpect(jsonPath("$.activo").doesNotExist());
        mockMvc.perform(get("/api/gimnasios").header("Authorization", bearer(cliente)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(propio.getId()));
    }

    @Test
    void ningunRolConsultaOtroGimnasioNiCreaOElimina() throws Exception {
        Gimnasio propio = gimnasio("gym-admin-propio");
        Gimnasio ajeno = gimnasio("gym-admin-ajeno");
        Usuario admin = usuario(propio, RolUsuario.ADMIN, "admin-gym");
        long gimnasiosAntes = gimnasioRepository.count();

        mockMvc.perform(get("/api/gimnasios/{id}", ajeno.getId())
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/gimnasios")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"No permitido\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/gimnasios/{id}", propio.getId())
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isForbidden());
        org.junit.jupiter.api.Assertions.assertEquals(gimnasiosAntes, gimnasioRepository.count());
    }

    @Test
    void soloAdminActualizaSuGimnasioSinAlterarCamposAdministrativos() throws Exception {
        Gimnasio propio = gimnasio("gym-update-propio");
        Gimnasio ajeno = gimnasio("gym-update-ajeno");
        Usuario admin = usuario(propio, RolUsuario.ADMIN, "admin-update");
        Usuario cliente = usuario(propio, RolUsuario.CLIENTE, "cliente-update");

        mockMvc.perform(put("/api/gimnasios/{id}", propio.getId())
                        .header("Authorization", bearer(cliente))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Intento\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/gimnasios/{id}", ajeno.getId())
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Intento\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/gimnasios/{id}", propio.getId())
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Gym actualizado\",\"colorPrimario\":\"#123456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Gym actualizado"))
                .andExpect(jsonPath("$.slug").doesNotExist())
                .andExpect(jsonPath("$.activo").doesNotExist());

        Gimnasio persistido = gimnasioRepository.findById(propio.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(propio.getSlug(), persistido.getSlug());
        org.junit.jupiter.api.Assertions.assertTrue(persistido.isActivo());
    }

    private Gimnasio gimnasio(String clave) {
        Gimnasio gimnasio = new Gimnasio();
        gimnasio.setNombre("Gym " + clave);
        gimnasio.setSlug(clave + "-" + System.nanoTime());
        gimnasio.setActivo(true);
        gimnasio.setColorPrimario("#4F7DFF");
        gimnasio.setColorSecundario("#6A5CFF");
        return gimnasioRepository.saveAndFlush(gimnasio);
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

    private String bearer(Usuario usuario) {
        return "Bearer " + authTokenService.crearToken(usuario);
    }
}
