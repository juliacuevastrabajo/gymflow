package com.julia.gymflow.service;

import com.julia.gymflow.entity.ArchivoSubido;
import com.julia.gymflow.entity.EstadoArchivoSubido;
import com.julia.gymflow.repository.ArchivoSubidoRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ArchivoLimpiezaService {

    private final ArchivoSubidoRepository archivoRepository;
    private final ArchivoReferenciaService archivoReferenciaService;
    private final Path directorio;
    private final Path directorioTemporal;
    private final long ttlHoras;

    public ArchivoLimpiezaService(
            ArchivoSubidoRepository archivoRepository,
            ArchivoReferenciaService archivoReferenciaService,
            @Value("${gymflow.upload-dir:uploads}") String uploadDir,
            @Value("${gymflow.archivos.temporal-ttl-hours:24}") long ttlHoras
    ) {
        this.archivoRepository = archivoRepository;
        this.archivoReferenciaService = archivoReferenciaService;
        this.directorio = Path.of(uploadDir).toAbsolutePath().normalize();
        this.directorioTemporal = directorio.resolve(".tmp").normalize();
        this.ttlHoras = ttlHoras;
    }

    @Scheduled(fixedDelayString = "${gymflow.archivos.cleanup-delay-ms:3600000}")
    @Transactional
    public void limpiarTemporalesCaducados() {
        LocalDateTime limite = LocalDateTime.now().minusHours(ttlHoras);
        List<ArchivoSubido> candidatos = archivoRepository.bloquearTemporalesCaducados(
                EstadoArchivoSubido.TEMPORAL,
                limite
        );
        for (ArchivoSubido archivo : candidatos) {
            if (archivoReferenciaService.estaReferenciado(archivo.getUrl())) continue;
            Path ruta = directorio.resolve(archivo.getNombreFisico()).normalize();
            if (!ruta.startsWith(directorio) || ruta.getParent() == null || !ruta.getParent().equals(directorio)) continue;
            try {
                Files.deleteIfExists(ruta);
                archivoRepository.delete(archivo);
            } catch (IOException ignored) {
                // Se reintentara en la siguiente ejecucion; los metadatos se conservan.
            }
        }
        limpiarStagingCaducado();
    }

    private void limpiarStagingCaducado() {
        if (!Files.isDirectory(directorioTemporal)) return;
        FileTime limite = FileTime.from(Instant.now().minusSeconds(ttlHoras * 3600));
        try (var archivos = Files.list(directorioTemporal)) {
            archivos.filter(Files::isRegularFile)
                    .filter(ruta -> ruta.getParent() != null && ruta.getParent().equals(directorioTemporal))
                    .filter(ruta -> ruta.getFileName().toString().endsWith(".part"))
                    .filter(ruta -> {
                        try {
                            return Files.getLastModifiedTime(ruta).compareTo(limite) < 0;
                        } catch (IOException ignored) {
                            return false;
                        }
                    })
                    .forEach(ruta -> {
                        try {
                            Files.deleteIfExists(ruta);
                        } catch (IOException ignored) {
                            // Se reintentara en la siguiente ejecucion.
                        }
                    });
        } catch (IOException ignored) {
            // El almacenamiento puede estar temporalmente no disponible.
        }
    }

}
