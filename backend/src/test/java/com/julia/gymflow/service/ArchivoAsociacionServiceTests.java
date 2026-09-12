package com.julia.gymflow.service;

import com.julia.gymflow.entity.ArchivoSubido;
import com.julia.gymflow.entity.EstadoArchivoSubido;
import com.julia.gymflow.entity.FinalidadArchivo;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.TipoArchivoSubido;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.ArchivoSubidoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ArchivoAsociacionServiceTests {

    private ArchivoSubidoRepository repository;
    private ArchivoAsociacionService service;
    private Gimnasio gimnasio;
    private Usuario admin;

    @BeforeEach
    void preparar() {
        repository = mock(ArchivoSubidoRepository.class);
        service = new ArchivoAsociacionService(repository);
        gimnasio = gimnasio(1L);
        admin = usuario(1L, RolUsuario.ADMIN, gimnasio);
    }

    @Test
    void asociaTemporalCompatibleDelMismoGimnasio() {
        ArchivoSubido archivo = archivo("/uploads/uno.jpg", FinalidadArchivo.FOTO_PERFIL,
                TipoArchivoSubido.IMAGEN, admin, gimnasio, EstadoArchivoSubido.TEMPORAL);
        when(repository.findByUrl(archivo.getUrl())).thenReturn(Optional.of(archivo));

        String url = service.asociarImagen(archivo.getUrl(), null, FinalidadArchivo.FOTO_PERFIL, admin, gimnasio);

        assertEquals(archivo.getUrl(), url);
        assertEquals(EstadoArchivoSubido.ASOCIADO, archivo.getEstado());
        assertNotNull(archivo.getFechaAsociacion());
        verify(repository).save(archivo);
    }

    @Test
    void permiteUrlLegacySinModificarYEliminacion() {
        assertEquals("https://legacy.test/foto.jpg",
                service.asociarImagen("https://legacy.test/foto.jpg", "https://legacy.test/foto.jpg",
                        FinalidadArchivo.FOTO_PERFIL, admin, gimnasio));
        assertNull(service.asociarImagen("  ", "/uploads/anterior.jpg", FinalidadArchivo.FOTO_PERFIL, admin, gimnasio));
        verify(repository, never()).findByUrl(any());
    }

    @Test
    void rechazaUrlInternaInventadaAjenaOIncompatible() {
        ResponseStatusException inventada = assertThrows(ResponseStatusException.class,
                () -> service.asociarImagen("/uploads/inventada.jpg", null, FinalidadArchivo.FOTO_PERFIL, admin, gimnasio));
        assertEquals(HttpStatus.BAD_REQUEST, inventada.getStatusCode());

        ArchivoSubido ajena = archivo("/uploads/ajena.jpg", FinalidadArchivo.FOTO_PERFIL,
                TipoArchivoSubido.IMAGEN, usuario(9L, RolUsuario.ADMIN, gimnasio(2L)), gimnasio(2L), EstadoArchivoSubido.TEMPORAL);
        when(repository.findByUrl(ajena.getUrl())).thenReturn(Optional.of(ajena));
        ResponseStatusException otroGym = assertThrows(ResponseStatusException.class,
                () -> service.asociarImagen(ajena.getUrl(), null, FinalidadArchivo.FOTO_PERFIL, admin, gimnasio));
        assertEquals(HttpStatus.FORBIDDEN, otroGym.getStatusCode());

        ArchivoSubido incompatible = archivo("/uploads/clase.jpg", FinalidadArchivo.PORTADA_CLASE,
                TipoArchivoSubido.IMAGEN, admin, gimnasio, EstadoArchivoSubido.TEMPORAL);
        when(repository.findByUrl(incompatible.getUrl())).thenReturn(Optional.of(incompatible));
        ResponseStatusException uso = assertThrows(ResponseStatusException.class,
                () -> service.asociarImagen(incompatible.getUrl(), null, FinalidadArchivo.FOTO_PERFIL, admin, gimnasio));
        assertEquals(HttpStatus.BAD_REQUEST, uso.getStatusCode());
    }

    @Test
    void usuarioNoAdminNoSeApropiaDeArchivoAjeno() {
        Usuario entrenador = usuario(2L, RolUsuario.ENTRENADOR, gimnasio);
        Usuario otro = usuario(3L, RolUsuario.ENTRENADOR, gimnasio);
        ArchivoSubido archivo = archivo("/uploads/video.webm", FinalidadArchivo.MULTIMEDIA_EJERCICIO,
                TipoArchivoSubido.VIDEO, otro, gimnasio, EstadoArchivoSubido.TEMPORAL);
        when(repository.findByUrl(archivo.getUrl())).thenReturn(Optional.of(archivo));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.asociarMultimedia(archivo.getUrl(), null, TipoArchivoSubido.VIDEO, entrenador, gimnasio));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(repository, never()).save(any());
    }

    private static ArchivoSubido archivo(String url, FinalidadArchivo finalidad, TipoArchivoSubido tipo,
                                         Usuario actor, Gimnasio gimnasio, EstadoArchivoSubido estado) {
        ArchivoSubido archivo = new ArchivoSubido();
        archivo.setUrl(url);
        archivo.setFinalidad(finalidad);
        archivo.setTipo(tipo);
        archivo.setSubidoPor(actor);
        archivo.setGimnasio(gimnasio);
        archivo.setEstado(estado);
        return archivo;
    }

    private static Gimnasio gimnasio(Long id) {
        Gimnasio gimnasio = new Gimnasio();
        gimnasio.setId(id);
        return gimnasio;
    }

    private static Usuario usuario(Long id, RolUsuario rol, Gimnasio gimnasio) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setRol(rol);
        usuario.setGimnasio(gimnasio);
        return usuario;
    }
}
