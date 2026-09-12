package com.julia.gymflow.service;

import com.julia.gymflow.entity.ArchivoSubido;
import com.julia.gymflow.entity.EstadoArchivoSubido;
import com.julia.gymflow.repository.ArchivoSubidoRepository;
import com.julia.gymflow.repository.ClaseRepository;
import com.julia.gymflow.repository.EjercicioRepository;
import com.julia.gymflow.repository.GimnasioRepository;
import com.julia.gymflow.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ArchivoReferenciaServiceTests {

    private ArchivoSubidoRepository archivos;
    private UsuarioRepository usuarios;
    private ArchivoReferenciaService service;

    @BeforeEach
    void preparar() {
        archivos = mock(ArchivoSubidoRepository.class);
        usuarios = mock(UsuarioRepository.class);
        service = new ArchivoReferenciaService(
                archivos,
                usuarios,
                mock(GimnasioRepository.class),
                mock(ClaseRepository.class),
                mock(EjercicioRepository.class)
        );
    }

    @Test
    void reemplazoNoLiberaArchivoTodaviaReferenciado() {
        ArchivoSubido archivo = asociado("/uploads/compartido.jpg");
        when(archivos.findByUrl(archivo.getUrl())).thenReturn(Optional.of(archivo));
        when(usuarios.existsByFotoPerfilUrl(archivo.getUrl())).thenReturn(true);

        service.liberarSiNoReferenciado(archivo.getUrl());

        assertEquals(EstadoArchivoSubido.ASOCIADO, archivo.getEstado());
        verify(archivos, never()).save(archivo);
    }

    @Test
    void reemplazoSinReferenciasRecibeNuevaGraciaTemporal() {
        ArchivoSubido archivo = asociado("/uploads/reemplazado.jpg");
        when(archivos.findByUrl(archivo.getUrl())).thenReturn(Optional.of(archivo));

        service.liberarSiNoReferenciado(archivo.getUrl());

        assertEquals(EstadoArchivoSubido.TEMPORAL, archivo.getEstado());
        assertNotNull(archivo.getFechaEstado());
        assertNull(archivo.getFechaAsociacion());
        verify(archivos).save(archivo);
    }

    private static ArchivoSubido asociado(String url) {
        ArchivoSubido archivo = new ArchivoSubido();
        archivo.setUrl(url);
        archivo.setEstado(EstadoArchivoSubido.ASOCIADO);
        archivo.setFechaAsociacion(LocalDateTime.now().minusDays(2));
        archivo.setFechaEstado(LocalDateTime.now().minusDays(2));
        return archivo;
    }
}
