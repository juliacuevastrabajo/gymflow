package com.julia.gymflow.service;

import com.julia.gymflow.entity.ArchivoSubido;
import com.julia.gymflow.entity.EstadoArchivoSubido;
import com.julia.gymflow.repository.ArchivoSubidoRepository;
import com.julia.gymflow.repository.ClaseRepository;
import com.julia.gymflow.repository.EjercicioRepository;
import com.julia.gymflow.repository.GimnasioRepository;
import com.julia.gymflow.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class ArchivoReferenciaService {

    private final ArchivoSubidoRepository archivoRepository;
    private final UsuarioRepository usuarioRepository;
    private final GimnasioRepository gimnasioRepository;
    private final ClaseRepository claseRepository;
    private final EjercicioRepository ejercicioRepository;

    public ArchivoReferenciaService(
            ArchivoSubidoRepository archivoRepository,
            UsuarioRepository usuarioRepository,
            GimnasioRepository gimnasioRepository,
            ClaseRepository claseRepository,
            EjercicioRepository ejercicioRepository
    ) {
        this.archivoRepository = archivoRepository;
        this.usuarioRepository = usuarioRepository;
        this.gimnasioRepository = gimnasioRepository;
        this.claseRepository = claseRepository;
        this.ejercicioRepository = ejercicioRepository;
    }

    public boolean estaReferenciado(String url) {
        return url != null && (usuarioRepository.existsByFotoPerfilUrl(url)
                || gimnasioRepository.existsByImagenFondoUrl(url)
                || claseRepository.existsByImagenUrl(url)
                || ejercicioRepository.existsByMultimediaUrl(url));
    }

    @Transactional
    public void liberarSiNoReferenciado(String url) {
        if (url == null || !url.startsWith("/uploads/")) return;
        ArchivoSubido archivo = archivoRepository.findByUrl(url).orElse(null);
        if (archivo == null || estaReferenciado(url) || archivo.getEstado() != EstadoArchivoSubido.ASOCIADO) return;

        archivo.setEstado(EstadoArchivoSubido.TEMPORAL);
        archivo.setFechaEstado(LocalDateTime.now());
        archivo.setFechaAsociacion(null);
        archivoRepository.save(archivo);
    }
}
