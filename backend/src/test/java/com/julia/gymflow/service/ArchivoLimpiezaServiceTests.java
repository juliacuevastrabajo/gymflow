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
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ArchivoLimpiezaServiceTests {

    @TempDir
    Path uploads;

    private ArchivoSubidoRepository archivos;
    private UsuarioRepository usuarios;
    private GimnasioRepository gimnasios;
    private ClaseRepository clases;
    private EjercicioRepository ejercicios;
    private ArchivoReferenciaService referencias;
    private ArchivoLimpiezaService service;

    @BeforeEach
    void preparar() {
        archivos = mock(ArchivoSubidoRepository.class);
        usuarios = mock(UsuarioRepository.class);
        gimnasios = mock(GimnasioRepository.class);
        clases = mock(ClaseRepository.class);
        ejercicios = mock(EjercicioRepository.class);
        referencias = new ArchivoReferenciaService(archivos, usuarios, gimnasios, clases, ejercicios);
        service = new ArchivoLimpiezaService(archivos, referencias, uploads.toString(), 24);
    }

    @Test
    void eliminaSoloTemporalCaducadoNoReferenciado() throws Exception {
        ArchivoSubido archivo = temporal("caducado.jpg", "/uploads/caducado.jpg");
        Path ruta = uploads.resolve(archivo.getNombreFisico());
        Files.writeString(ruta, "temporal");
        when(archivos.bloquearTemporalesCaducados(any(), any(LocalDateTime.class))).thenReturn(List.of(archivo));

        service.limpiarTemporalesCaducados();

        assertFalse(Files.exists(ruta));
        verify(archivos).delete(archivo);
    }

    @Test
    void conservaTemporalReferenciadoYArchivoLegacy() throws Exception {
        ArchivoSubido archivo = temporal("referenciado.jpg", "/uploads/referenciado.jpg");
        Path ruta = uploads.resolve(archivo.getNombreFisico());
        Path legacy = uploads.resolve("legacy-anterior.jpg");
        Files.writeString(ruta, "temporal");
        Files.writeString(legacy, "legacy");
        when(archivos.bloquearTemporalesCaducados(any(), any(LocalDateTime.class))).thenReturn(List.of(archivo));
        when(usuarios.existsByFotoPerfilUrl(archivo.getUrl())).thenReturn(true);

        service.limpiarTemporalesCaducados();

        assertTrue(Files.exists(ruta));
        assertTrue(Files.exists(legacy));
        verify(archivos, never()).delete(any());
    }

    @Test
    void nuncaSaleDelDirectorioNiFallaEnDosEjecuciones() throws Exception {
        Path fuera = uploads.getParent().resolve("no-borrar.jpg");
        Files.writeString(fuera, "protegido");
        ArchivoSubido manipulado = temporal("../no-borrar.jpg", "/uploads/no-borrar.jpg");
        when(archivos.bloquearTemporalesCaducados(any(), any(LocalDateTime.class)))
                .thenReturn(List.of(manipulado))
                .thenReturn(List.of());

        assertDoesNotThrow(service::limpiarTemporalesCaducados);
        assertDoesNotThrow(service::limpiarTemporalesCaducados);

        assertTrue(Files.exists(fuera));
        verify(archivos, never()).delete(any());
        Files.deleteIfExists(fuera);
    }

    @Test
    void archivoAsociadoNoEsCandidatoALimpieza() {
        when(archivos.bloquearTemporalesCaducados(eq(EstadoArchivoSubido.TEMPORAL), any(LocalDateTime.class)))
                .thenReturn(List.of());

        service.limpiarTemporalesCaducados();

        verify(archivos, never()).delete(any());
        verify(usuarios, never()).existsByFotoPerfilUrl(anyString());
    }

    @Test
    void limpiaSoloPartCaducadoDelStaging() throws Exception {
        Path staging = uploads.resolve(".tmp");
        Files.createDirectories(staging);
        Path caducado = Files.writeString(staging.resolve("caducado.part"), "parcial");
        Path reciente = Files.writeString(staging.resolve("reciente.part"), "parcial");
        Path otroFormato = Files.writeString(staging.resolve("conservar.txt"), "contenido");
        Files.setLastModifiedTime(caducado, FileTime.from(Instant.now().minusSeconds(48 * 3600)));
        when(archivos.bloquearTemporalesCaducados(any(), any(LocalDateTime.class))).thenReturn(List.of());

        service.limpiarTemporalesCaducados();

        assertFalse(Files.exists(caducado));
        assertTrue(Files.exists(reciente));
        assertTrue(Files.exists(otroFormato));
    }

    private static ArchivoSubido temporal(String nombreFisico, String url) {
        ArchivoSubido archivo = new ArchivoSubido();
        archivo.setNombreFisico(nombreFisico);
        archivo.setUrl(url);
        archivo.setEstado(EstadoArchivoSubido.TEMPORAL);
        archivo.setFechaCreacion(LocalDateTime.now().minusDays(2));
        return archivo;
    }
}
