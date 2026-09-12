package com.julia.gymflow.service;

import com.julia.gymflow.dto.ActualizarGimnasioRequest;
import com.julia.gymflow.dto.GimnasioResponse;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.GimnasioRepository;
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
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GimnasioServiceTests {

    @Mock
    private GimnasioRepository gimnasioRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private AuthTokenService authTokenService;

    @Mock
    private ArchivoAsociacionService archivoAsociacionService;

    @Mock
    private ArchivoReferenciaService archivoReferenciaService;

    private GimnasioService gimnasioService;
    private Gimnasio gimnasioUno;
    private Gimnasio gimnasioDos;

    @BeforeEach
    void preparar() {
        gimnasioService = new GimnasioService(
                gimnasioRepository,
                usuarioRepository,
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
                    if (url == null || url.trim().isEmpty()) return null;
                    if (url.length() > 2048) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Referencia demasiado larga.");
                    }
                    return url;
                });
        gimnasioUno = gimnasio(1L, "UrbanFit");
        gimnasioDos = gimnasio(2L, "Otro Gym");
    }

    @Test
    void adminActualizaSuPropioGimnasioSinAlterarCamposAdministrativos() {
        Usuario admin = usuario(10L, RolUsuario.ADMIN, gimnasioUno, true);
        autenticar("Bearer admin", admin);
        when(gimnasioRepository.findById(gimnasioUno.getId())).thenReturn(Optional.of(gimnasioUno));
        when(gimnasioRepository.save(any(Gimnasio.class))).thenAnswer(invocacion -> invocacion.getArgument(0));
        ActualizarGimnasioRequest request = requestCompleto();

        GimnasioResponse resultado = gimnasioService.actualizarGimnasio("Bearer admin", gimnasioUno.getId(), request);

        assertEquals("UrbanFit Centro", resultado.getNombre());
        assertEquals("/uploads/fondo.jpg", resultado.getImagenFondoUrl());
        assertTrue(resultado.isMensajesUsuariosPermitidos());
        assertFalse(resultado.isClientesPuedenCambiarFotoPerfil());
        assertTrue(resultado.isEntrenadoresPuedenCambiarFotoPerfil());
        verify(gimnasioRepository).save(gimnasioUno);
    }

    @Test
    void clienteNoPuedeActualizarGimnasio() {
        verificarRolSinPermiso(RolUsuario.CLIENTE);
    }

    @Test
    void entrenadorNoPuedeActualizarGimnasio() {
        verificarRolSinPermiso(RolUsuario.ENTRENADOR);
    }

    @Test
    void adminInactivoNoPuedeActualizarGimnasio() {
        Usuario admin = usuario(10L, RolUsuario.ADMIN, gimnasioUno, false);
        autenticar("Bearer admin", admin);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> gimnasioService.actualizarGimnasio("Bearer admin", gimnasioUno.getId(), requestCompleto())
        );

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(gimnasioRepository, never()).save(any());
    }

    @Test
    void adminNoPuedeActualizarOtroGimnasio() {
        Usuario admin = usuario(10L, RolUsuario.ADMIN, gimnasioUno, true);
        autenticar("Bearer admin", admin);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> gimnasioService.actualizarGimnasio("Bearer admin", gimnasioDos.getId(), requestCompleto())
        );

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(gimnasioRepository, never()).save(any());
    }

    @Test
    void gimnasioSinTokenDevuelveUnauthorized() {
        when(authTokenService.obtenerUsuarioId(null))
                .thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesión no válida."));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> gimnasioService.actualizarGimnasio(null, gimnasioUno.getId(), requestCompleto())
        );

        assertEquals(HttpStatus.UNAUTHORIZED, error.getStatusCode());
        verify(gimnasioRepository, never()).save(any());
    }

    @Test
    void permisosDeFotoNuevosSonCompatiblesPorDefecto() {
        Gimnasio gimnasioNuevo = new Gimnasio();

        assertTrue(gimnasioNuevo.isClientesPuedenCambiarFotoPerfil());
        assertTrue(gimnasioNuevo.isEntrenadoresPuedenCambiarFotoPerfil());
    }

    @Test
    void adminPuedeRetirarLaImagenDeFondo() {
        Usuario admin = usuario(10L, RolUsuario.ADMIN, gimnasioUno, true);
        autenticar("Bearer admin", admin);
        gimnasioUno.setImagenFondoUrl("/uploads/fondo.jpg");
        when(gimnasioRepository.findById(gimnasioUno.getId())).thenReturn(Optional.of(gimnasioUno));
        when(gimnasioRepository.save(any(Gimnasio.class))).thenAnswer(invocacion -> invocacion.getArgument(0));
        ActualizarGimnasioRequest request = new ActualizarGimnasioRequest();
        request.setImagenFondoUrl("");

        GimnasioResponse resultado = gimnasioService.actualizarGimnasio("Bearer admin", gimnasioUno.getId(), request);

        assertNull(resultado.getImagenFondoUrl());
    }

    @Test
    void rechazaUnaImagenDeFondoDemasiadoLarga() {
        Usuario admin = usuario(10L, RolUsuario.ADMIN, gimnasioUno, true);
        autenticar("Bearer admin", admin);
        when(gimnasioRepository.findById(gimnasioUno.getId())).thenReturn(Optional.of(gimnasioUno));
        ActualizarGimnasioRequest request = new ActualizarGimnasioRequest();
        request.setImagenFondoUrl("x".repeat(2049));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> gimnasioService.actualizarGimnasio("Bearer admin", gimnasioUno.getId(), request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verify(gimnasioRepository, never()).save(any());
    }

    private void verificarRolSinPermiso(RolUsuario rol) {
        Usuario actor = usuario(10L, rol, gimnasioUno, true);
        autenticar("Bearer actor", actor);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> gimnasioService.actualizarGimnasio("Bearer actor", gimnasioUno.getId(), requestCompleto())
        );

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(gimnasioRepository, never()).save(any());
    }

    private void autenticar(String token, Usuario usuario) {
        when(authTokenService.obtenerUsuarioId(token)).thenReturn(usuario.getId());
        when(usuarioRepository.findById(usuario.getId())).thenReturn(Optional.of(usuario));
    }

    private ActualizarGimnasioRequest requestCompleto() {
        ActualizarGimnasioRequest request = new ActualizarGimnasioRequest();
        request.setNombre("UrbanFit Centro");
        request.setTextoBienvenida("Bienvenido a tu gimnasio");
        request.setImagenFondoUrl("/uploads/fondo.jpg");
        request.setColorPrimario("#123456");
        request.setColorSecundario("#ABCDEF");
        request.setMensajesUsuariosPermitidos(true);
        request.setClientesPuedenCambiarFotoPerfil(false);
        request.setEntrenadoresPuedenCambiarFotoPerfil(true);
        return request;
    }

    private Gimnasio gimnasio(Long id, String nombre) {
        Gimnasio gimnasio = new Gimnasio();
        gimnasio.setId(id);
        gimnasio.setNombre(nombre);
        gimnasio.setSlug(nombre.equals("UrbanFit") ? "urbanfit" : "otro-gym");
        gimnasio.setActivo(true);
        return gimnasio;
    }

    private Usuario usuario(Long id, RolUsuario rol, Gimnasio gimnasio, boolean activo) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setNombre(rol.name());
        usuario.setEmail(rol.name().toLowerCase() + "@gymflow.test");
        usuario.setRol(rol);
        usuario.setGimnasio(gimnasio);
        usuario.setActivo(activo);
        return usuario;
    }
}
