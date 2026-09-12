package com.julia.gymflow.service;

import com.julia.gymflow.controller.MensajeController;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.MensajeRepository;
import com.julia.gymflow.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class MensajeEndpointSecurityTests {

    @Mock
    private MensajeRepository mensajeRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private MensajeDestinatarioService destinatarioService;

    private AuthTokenService authTokenService;
    private MockMvc mockMvc;
    private Usuario cliente;

    @BeforeEach
    void preparar() {
        authTokenService = new AuthTokenService("message-endpoint-security-secret-with-32-characters");
        MensajeService service = new MensajeService(
                mensajeRepository,
                usuarioRepository,
                authTokenService,
                destinatarioService
        );
        mockMvc = MockMvcBuilders.standaloneSetup(new MensajeController(service)).build();
        cliente = usuario(20L, RolUsuario.CLIENTE);
    }

    @Test
    void endpointsProtegidosDevuelvenUnauthorizedSinToken() throws Exception {
        mockMvc.perform(get("/api/mensajes")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/mensajes/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/mensajes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mensajeJson()))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/mensajes/1/leer")).andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/mensajes/1/pausar")).andExpect(status().isUnauthorized());
    }

    @Test
    void clienteNoPuedeListarAdministracionNiAdministrarAutomatizaciones() throws Exception {
        autenticar(cliente);
        String token = bearer(cliente);

        mockMvc.perform(get("/api/mensajes").header("Authorization", token))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/mensajes/1/pausar").header("Authorization", token))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/mensajes/1/reanudar").header("Authorization", token))
                .andExpect(status().isForbidden());
    }

    @Test
    void rutaLegacyNoPermiteConsultarNiMarcarOtroUsuario() throws Exception {
        autenticar(cliente);
        String token = bearer(cliente);

        mockMvc.perform(get("/api/mensajes/usuario/999").header("Authorization", token))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/mensajes/1/leer/999").header("Authorization", token))
                .andExpect(status().isForbidden());
    }

    private void autenticar(Usuario usuario) {
        when(usuarioRepository.findById(usuario.getId())).thenReturn(Optional.of(usuario));
    }

    private String bearer(Usuario usuario) {
        return "Bearer " + authTokenService.crearToken(usuario);
    }

    private String mensajeJson() {
        return """
                {
                  "gimnasioId": 999,
                  "remitenteId": 999,
                  "asunto": "Aviso",
                  "texto": "Contenido",
                  "audiencia": "TODOS",
                  "tipoProgramacion": "AHORA"
                }
                """;
    }

    private Usuario usuario(Long id, RolUsuario rol) {
        Gimnasio gimnasio = new Gimnasio();
        gimnasio.setId(1L);
        gimnasio.setNombre("UrbanFit");
        gimnasio.setActivo(true);

        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setNombre("Cliente");
        usuario.setEmail("cliente@example.com");
        usuario.setRol(rol);
        usuario.setActivo(true);
        usuario.setGimnasio(gimnasio);
        return usuario;
    }
}
