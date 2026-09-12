package com.julia.gymflow.service;

import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.GimnasioRepository;
import com.julia.gymflow.repository.MensajeRepository;
import com.julia.gymflow.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioFotoServiceTests {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private GimnasioRepository gimnasioRepository;

    @Mock
    private MensajeRepository mensajeRepository;

    @Mock
    private PasswordService passwordService;

    @Mock
    private AuthTokenService authTokenService;

    @Mock
    private ArchivoAsociacionService archivoAsociacionService;

    @Mock
    private ArchivoReferenciaService archivoReferenciaService;

    private UsuarioService usuarioService;
    private Gimnasio gimnasioUno;
    private Gimnasio gimnasioDos;

    @BeforeEach
    void preparar() {
        usuarioService = new UsuarioService(
                usuarioRepository,
                gimnasioRepository,
                new MensajeBienvenidaService(mensajeRepository),
                passwordService,
                authTokenService,
                archivoAsociacionService,
                archivoReferenciaService
        );
        org.mockito.Mockito.lenient()
                .when(archivoAsociacionService.asociarImagen(
                        org.mockito.ArgumentMatchers.nullable(String.class),
                        org.mockito.ArgumentMatchers.nullable(String.class),
                        any(), any(), any()))
                .thenAnswer(invocacion -> {
                    String url = invocacion.getArgument(0);
                    return url == null || url.trim().isEmpty() ? null : url;
                });
        gimnasioUno = gimnasio(1L);
        gimnasioDos = gimnasio(2L);
    }

    @Test
    void clienteActualizaSuFotoConPermisoActivo() {
        Usuario cliente = usuario(10L, RolUsuario.CLIENTE, gimnasioUno);
        gimnasioUno.setClientesPuedenCambiarFotoPerfil(true);

        actualizarFotoPermitida(cliente, cliente);
    }

    @Test
    void clienteRecibeForbiddenConPermisoDesactivado() {
        Usuario cliente = usuario(10L, RolUsuario.CLIENTE, gimnasioUno);
        gimnasioUno.setClientesPuedenCambiarFotoPerfil(false);

        actualizarFotoDenegada(cliente, cliente);
    }

    @Test
    void entrenadorActualizaSuFotoConPermisoActivo() {
        Usuario entrenador = usuario(20L, RolUsuario.ENTRENADOR, gimnasioUno);
        gimnasioUno.setEntrenadoresPuedenCambiarFotoPerfil(true);

        actualizarFotoPermitida(entrenador, entrenador);
    }

    @Test
    void entrenadorRecibeForbiddenConPermisoDesactivado() {
        Usuario entrenador = usuario(20L, RolUsuario.ENTRENADOR, gimnasioUno);
        gimnasioUno.setEntrenadoresPuedenCambiarFotoPerfil(false);

        actualizarFotoDenegada(entrenador, entrenador);
    }

    @Test
    void usuarioNoAdminNoPuedeCambiarFotoAjena() {
        Usuario cliente = usuario(10L, RolUsuario.CLIENTE, gimnasioUno);
        Usuario otroCliente = usuario(11L, RolUsuario.CLIENTE, gimnasioUno);

        actualizarFotoDenegada(cliente, otroCliente);
    }

    @Test
    void adminPuedeCambiarFotoDeUsuarioDeSuGimnasio() {
        Usuario admin = usuario(1L, RolUsuario.ADMIN, gimnasioUno);
        Usuario cliente = usuario(10L, RolUsuario.CLIENTE, gimnasioUno);
        gimnasioUno.setClientesPuedenCambiarFotoPerfil(false);

        actualizarFotoPermitida(admin, cliente);
    }

    @Test
    void adminNoPuedeCambiarFotoDeOtroGimnasio() {
        Usuario admin = usuario(1L, RolUsuario.ADMIN, gimnasioUno);
        Usuario clienteExterno = usuario(10L, RolUsuario.CLIENTE, gimnasioDos);

        actualizarFotoDenegada(admin, clienteExterno);
    }

    @Test
    void fotoSinTokenDevuelveUnauthorized() {
        when(authTokenService.obtenerUsuarioId(null))
                .thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesión no válida."));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> usuarioService.actualizarFotoPerfil(null, 10L, "/uploads/foto.jpg")
        );

        assertEquals(HttpStatus.UNAUTHORIZED, error.getStatusCode());
        verify(usuarioRepository, never()).save(any());
    }

    private void actualizarFotoPermitida(Usuario actor, Usuario objetivo) {
        autenticar(actor);
        when(usuarioRepository.findById(objetivo.getId())).thenReturn(Optional.of(objetivo));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocacion -> invocacion.getArgument(0));

        usuarioService.actualizarFotoPerfil("Bearer token", objetivo.getId(), "/uploads/foto.jpg");

        assertEquals("/uploads/foto.jpg", objetivo.getFotoPerfilUrl());
        verify(usuarioRepository).save(objetivo);
    }

    private void actualizarFotoDenegada(Usuario actor, Usuario objetivo) {
        autenticar(actor);
        when(usuarioRepository.findById(objetivo.getId())).thenReturn(Optional.of(objetivo));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> usuarioService.actualizarFotoPerfil("Bearer token", objetivo.getId(), "/uploads/foto.jpg")
        );

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(usuarioRepository, never()).save(any());
    }

    private void autenticar(Usuario actor) {
        when(authTokenService.obtenerUsuarioId("Bearer token")).thenReturn(actor.getId());
        when(usuarioRepository.findById(actor.getId())).thenReturn(Optional.of(actor));
    }

    private Gimnasio gimnasio(Long id) {
        Gimnasio gimnasio = new Gimnasio();
        gimnasio.setId(id);
        gimnasio.setNombre("Gym " + id);
        return gimnasio;
    }

    private Usuario usuario(Long id, RolUsuario rol, Gimnasio gimnasio) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setNombre(rol.name());
        usuario.setEmail(rol.name().toLowerCase() + id + "@gymflow.test");
        usuario.setRol(rol);
        usuario.setGimnasio(gimnasio);
        usuario.setActivo(true);
        return usuario;
    }
}
