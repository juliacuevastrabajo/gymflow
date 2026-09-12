package com.julia.gymflow.service;

import com.julia.gymflow.dto.AuthSessionResponse;
import com.julia.gymflow.dto.LoginRequest;
import com.julia.gymflow.dto.LoginResponse;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTests {

    private static final String SECRET = "auth-tests-secret-with-at-least-32-characters";

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordService passwordService;

    private AuthTokenService authTokenService;
    private AuthService authService;

    @BeforeEach
    void preparar() {
        authTokenService = new AuthTokenService(SECRET);
        authService = new AuthService(usuarioRepository, passwordService, authTokenService);
    }

    @Test
    void devuelveSesionSeguraConTokenValido() {
        Usuario usuario = usuario(10L, true);
        when(usuarioRepository.findById(usuario.getId())).thenReturn(Optional.of(usuario));

        AuthSessionResponse response = authService.obtenerSesionActual(
                bearer(authTokenService.crearToken(usuario))
        );

        assertEquals(usuario.getId(), response.getId());
        assertEquals("Julia", response.getNombre());
        assertEquals("julia@gymflow.test", response.getEmail());
        assertEquals(RolUsuario.ADMIN, response.getRol());
        assertEquals(3L, response.getGimnasioId());
        assertEquals("UrbanFit", response.getNombreGimnasio());
    }

    @Test
    void loginExistenteSigueDevolviendoUsuarioYToken() {
        Usuario usuario = usuario(10L, true);
        LoginRequest request = new LoginRequest();
        request.setEmail("  JULIA@GYMFLOW.TEST ");
        request.setPassword("password-segura");
        when(usuarioRepository.findByEmail("julia@gymflow.test"))
                .thenReturn(Optional.of(usuario));
        when(passwordService.matches("password-segura", usuario.getPasswordHash()))
                .thenReturn(true);
        when(passwordService.needsRehash(usuario.getPasswordHash())).thenReturn(false);

        LoginResponse response = authService.login(request);

        assertEquals(usuario.getId(), response.getId());
        assertEquals(usuario.getEmail(), response.getEmail());
        assertEquals(usuario.getRol(), response.getRol());
        assertEquals(usuario.getGimnasio().getId(), response.getGimnasioId());
        org.junit.jupiter.api.Assertions.assertNotNull(response.getToken());
    }

    @Test
    void rechazaTokenAusente() {
        assertUnauthorized(() -> authService.obtenerSesionActual(null));
    }

    @Test
    void rechazaSecretoDeFirmaDemasiadoCorto() {
        assertThrows(IllegalStateException.class, () -> new AuthTokenService("demasiado-corto"));
    }

    @Test
    void rechazaTokenInvalido() {
        assertUnauthorized(() -> authService.obtenerSesionActual("Bearer token-invalido"));
    }

    @Test
    void rechazaTokenCaducado() {
        Usuario usuario = usuario(10L, true);
        String token = authTokenService.crearTokenConExpiracion(
                usuario,
                Instant.now().minus(1, ChronoUnit.MINUTES)
        );

        assertUnauthorized(() -> authService.obtenerSesionActual(bearer(token)));
    }

    @Test
    void rechazaUsuarioInexistente() {
        Usuario usuario = usuario(10L, true);
        when(usuarioRepository.findById(usuario.getId())).thenReturn(Optional.empty());

        assertUnauthorized(() -> authService.obtenerSesionActual(
                bearer(authTokenService.crearToken(usuario))
        ));
    }

    @Test
    void rechazaUsuarioInactivo() {
        Usuario usuario = usuario(10L, false);
        when(usuarioRepository.findById(usuario.getId())).thenReturn(Optional.of(usuario));

        assertUnauthorized(() -> authService.obtenerSesionActual(
                bearer(authTokenService.crearToken(usuario))
        ));
    }

    private void assertUnauthorized(Accion accion) {
        ResponseStatusException error = assertThrows(ResponseStatusException.class, accion::ejecutar);
        assertEquals(HttpStatus.UNAUTHORIZED, error.getStatusCode());
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

    @FunctionalInterface
    private interface Accion {
        void ejecutar();
    }
}
