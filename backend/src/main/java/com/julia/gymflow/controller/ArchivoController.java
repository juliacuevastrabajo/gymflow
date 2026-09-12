package com.julia.gymflow.controller;

import com.julia.gymflow.dto.ArchivoSubidoResponse;
import com.julia.gymflow.entity.FinalidadArchivo;
import com.julia.gymflow.service.ArchivoService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/archivos")
public class ArchivoController {

    private final ArchivoService archivoService;

    public ArchivoController(ArchivoService archivoService) {
        this.archivoService = archivoService;
    }

    @PostMapping("/imagenes")
    public ArchivoSubidoResponse subirImagen(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(value = "archivo", required = false) MultipartFile archivo,
            @RequestParam(value = "finalidad", required = false) FinalidadArchivo finalidad,
            @RequestParam(value = "objetivoUsuarioId", required = false) Long objetivoUsuarioId
    ) {
        return archivoService.guardarImagen(authorization, archivo, finalidad, objetivoUsuarioId);
    }

    @PostMapping("/multimedia")
    public ArchivoSubidoResponse subirMultimedia(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(value = "archivo", required = false) MultipartFile archivo,
            @RequestParam(value = "finalidad", required = false) FinalidadArchivo finalidad
    ) {
        return archivoService.guardarMultimedia(authorization, archivo, finalidad);
    }
}
