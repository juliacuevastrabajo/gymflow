package com.julia.gymflow.service;

import com.julia.gymflow.controller.AuthController;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthEndpointTests {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordService passwordService;

    private AuthTokenService authTokenService;
    private MockMvc mockMvc;

    @BeforeEach
    void preparar() {
        authTokenService = new AuthTokenService("auth-endpoint-tests-secret-with-32-characters");
        AuthService authService = new AuthService(
                usuarioRepository,
                passwordService,
                authTokenService
        );
        mockMvc = MockMvcBuilders
                .standaloneSetup(new AuthController(authService))
                .build();
    }

    @Test
    void getMeDevuelveElUsuarioAutenticado() throws Exception {
        Usuario usuario = usuario(10L, true);
        when(usuarioRepository.findById(usuario.getId())).thenReturn(Optional.of(usuario));

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", bearer(authTokenService.crearToken(usuario))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.nombre").value("Julia"))
                .andExpect(jsonPath("$.email").value("julia@gymflow.test"))
                .andExpect(jsonPath("$.rol").value("ADMIN"))
                .andExpect(jsonPath("$.gimnasioId").value(3))
                .andExpect(jsonPath("$.nombreGimnasio").value("UrbanFit"))
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void getMeRechazaTokenAusente() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getMeRechazaTokenInvalido() throws Exception {
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer invalido"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getMeRechazaTokenCaducado() throws Exception {
        Usuario usuario = usuario(10L, true);
        String token = authTokenService.crearTokenConExpiracion(
                usuario,
                Instant.now().minus(1, ChronoUnit.MINUTES)
        );

        mockMvc.perform(get("/api/auth/me").header("Authorization", bearer(token)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getMeRechazaUsuarioInexistente() throws Exception {
        Usuario usuario = usuario(10L, true);
        when(usuarioRepository.findById(usuario.getId())).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", bearer(authTokenService.crearToken(usuario))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getMeRechazaUsuarioInactivo() throws Exception {
        Usuario usuario = usuario(10L, false);
        when(usuarioRepository.findById(usuario.getId())).thenReturn(Optional.of(usuario));

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", bearer(authTokenService.crearToken(usuario))))
                .andExpect(status().isUnauthorized());
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private Usuario usuario(Long id, boolean activo) {
        Gimnasio gimnasio = new Gimnasio();
        gimnasio.setId(3L);
        gimnasio.setNombre("UrbanFit");

        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setNombre("Julia");
        usuario.setEmail("julia@gymflow.test");
        usuario.setFotoPerfilUrl("/uploads/julia.jpg");
        usuario.setRol(RolUsuario.ADMIN);
        usuario.setActivo(activo);
        usuario.setGimnasio(gimnasio);
        return usuario;
    }
}
