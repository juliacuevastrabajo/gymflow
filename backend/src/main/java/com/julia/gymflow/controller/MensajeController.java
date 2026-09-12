package com.julia.gymflow.controller;

import com.julia.gymflow.dto.MensajeRequest;
import com.julia.gymflow.dto.MensajeResponse;
import com.julia.gymflow.service.MensajeService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/mensajes")
public class MensajeController {

    private final MensajeService mensajeService;

    public MensajeController(MensajeService mensajeService) {
        this.mensajeService = mensajeService;
    }

    @GetMapping
    public List<MensajeResponse> listarMensajes(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return mensajeService.listarMensajes(authorization);
    }

    @GetMapping("/me")
    public List<MensajeResponse> listarMisMensajes(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return mensajeService.listarMisMensajes(authorization);
    }

    @GetMapping("/gimnasio/{gimnasioId}")
    public List<MensajeResponse> listarMensajesPorGimnasio(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long gimnasioId
    ) {
        return mensajeService.listarMensajesPorGimnasio(authorization, gimnasioId);
    }

    @GetMapping("/usuario/{usuarioId}")
    public List<MensajeResponse> listarMensajesPorUsuario(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long usuarioId
    ) {
        return mensajeService.listarMensajesPorUsuario(authorization, usuarioId);
    }

    @PostMapping
    public MensajeResponse crearMensaje(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody MensajeRequest request
    ) {
        return mensajeService.crearMensaje(authorization, request);
    }

    @PutMapping("/{id}/pausar")
    public MensajeResponse pausarMensaje(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id
    ) {
        return mensajeService.pausarMensaje(authorization, id);
    }

    @PutMapping("/{id}/reanudar")
    public MensajeResponse reanudarMensaje(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id
    ) {
        return mensajeService.reanudarMensaje(authorization, id);
    }

    @DeleteMapping("/{id}")
    public void eliminarMensaje(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id
    ) {
        mensajeService.eliminarMensaje(authorization, id);
    }

    @PutMapping("/{id}/leer")
    public MensajeResponse marcarMensajeComoLeido(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id
    ) {
        return mensajeService.marcarMensajeComoLeido(authorization, id);
    }

    @PutMapping("/{id}/leer/{usuarioId}")
    public MensajeResponse marcarMensajeComoLeido(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @PathVariable Long usuarioId
    ) {
        return mensajeService.marcarMensajeComoLeidoLegacy(authorization, id, usuarioId);
    }
}
