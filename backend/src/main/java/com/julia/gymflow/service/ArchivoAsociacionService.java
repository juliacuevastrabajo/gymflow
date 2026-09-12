package com.julia.gymflow.service;

import com.julia.gymflow.entity.ArchivoSubido;
import com.julia.gymflow.entity.EstadoArchivoSubido;
import com.julia.gymflow.entity.FinalidadArchivo;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.TipoArchivoSubido;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.ArchivoSubidoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Objects;

@Service
public class ArchivoAsociacionService {

    private final ArchivoSubidoRepository archivoRepository;

    public ArchivoAsociacionService(ArchivoSubidoRepository archivoRepository) {
        this.archivoRepository = archivoRepository;
    }

    @Transactional
    public String asociarImagen(
            String nuevaUrl,
            String urlActual,
            FinalidadArchivo finalidad,
            Usuario actor,
            Gimnasio gimnasio
    ) {
        return asociar(nuevaUrl, urlActual, finalidad, TipoArchivoSubido.IMAGEN, actor, gimnasio);
    }

    @Transactional
    public String asociarMultimedia(
            String nuevaUrl,
            String urlActual,
            TipoArchivoSubido tipoEsperado,
            Usuario actor,
            Gimnasio gimnasio
    ) {
        return asociar(nuevaUrl, urlActual, FinalidadArchivo.MULTIMEDIA_EJERCICIO, tipoEsperado, actor, gimnasio);
    }

    private String asociar(
            String nuevaUrl,
            String urlActual,
            FinalidadArchivo finalidad,
            TipoArchivoSubido tipoEsperado,
            Usuario actor,
            Gimnasio gimnasio
    ) {
        String limpia = limpiarUrl(nuevaUrl);
        if (limpia == null) return null;
        if (limpia.equals(limpiarUrl(urlActual))) return limpia;
        if (!limpia.startsWith("/uploads/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La referencia debe proceder de una subida gestionada.");
        }

        ArchivoSubido archivo = archivoRepository.findByUrl(limpia)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo no existe o es legacy."));
        if (gimnasio == null || archivo.getGimnasio() == null
                || !Objects.equals(gimnasio.getId(), archivo.getGimnasio().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El archivo pertenece a otro gimnasio.");
        }
        if (archivo.getFinalidad() != finalidad || archivo.getTipo() != tipoEsperado) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo no es compatible con este uso.");
        }
        if (actor.getRol() != RolUsuario.ADMIN
                && (archivo.getSubidoPor() == null || !Objects.equals(actor.getId(), archivo.getSubidoPor().getId()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes utilizar un archivo subido por otra cuenta.");
        }

        if (archivo.getEstado() == EstadoArchivoSubido.TEMPORAL) {
            archivo.setEstado(EstadoArchivoSubido.ASOCIADO);
            LocalDateTime ahora = LocalDateTime.now();
            archivo.setFechaEstado(ahora);
            archivo.setFechaAsociacion(ahora);
            archivoRepository.save(archivo);
        }
        return archivo.getUrl();
    }

    private String limpiarUrl(String url) {
        if (url == null || url.trim().isEmpty()) return null;
        String limpia = url.trim();
        if (limpia.length() > 2048 || limpia.contains("\0") || limpia.contains("..") || limpia.contains("\\")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La referencia del archivo no es valida.");
        }
        return limpia;
    }
}
