package com.julia.gymflow.controller;

import com.julia.gymflow.dto.EjercicioRequest;
import com.julia.gymflow.dto.EjercicioResponse;
import com.julia.gymflow.dto.RutinaAsignacionRequest;
import com.julia.gymflow.dto.RutinaAsignadaResponse;
import com.julia.gymflow.dto.RutinaEjercicioRequest;
import com.julia.gymflow.dto.RutinaOrdenRequest;
import com.julia.gymflow.dto.RutinaRequest;
import com.julia.gymflow.dto.RutinaResponse;
import com.julia.gymflow.service.RutinaService;
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
@RequestMapping("/api/rutinas")
public class RutinaController {

    private final RutinaService rutinaService;

    public RutinaController(RutinaService rutinaService) {
        this.rutinaService = rutinaService;
    }

    @GetMapping
    public List<RutinaResponse> listarRutinas(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return rutinaService.listarRutinas(authorization);
    }

    @GetMapping("/{id}")
    public RutinaResponse consultarRutina(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id
    ) {
        return rutinaService.consultarRutina(authorization, id);
    }

    @PostMapping
    public RutinaResponse crearRutina(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody RutinaRequest request
    ) {
        return rutinaService.crearRutina(authorization, request);
    }

    @PutMapping("/{id}")
    public RutinaResponse actualizarRutina(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @RequestBody RutinaRequest request
    ) {
        return rutinaService.actualizarRutina(authorization, id, request);
    }

    @DeleteMapping("/{id}")
    public RutinaResponse desactivarRutina(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id
    ) {
        return rutinaService.desactivarRutina(authorization, id);
    }

    @GetMapping("/ejercicios")
    public List<EjercicioResponse> listarEjercicios(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return rutinaService.listarEjercicios(authorization);
    }

    @PostMapping("/ejercicios")
    public EjercicioResponse crearEjercicio(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody EjercicioRequest request
    ) {
        return rutinaService.crearEjercicio(authorization, request);
    }

    @PutMapping("/ejercicios/{id}")
    public EjercicioResponse actualizarEjercicio(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @RequestBody EjercicioRequest request
    ) {
        return rutinaService.actualizarEjercicio(authorization, id, request);
    }

    @DeleteMapping("/ejercicios/{id}")
    public EjercicioResponse desactivarEjercicio(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id
    ) {
        return rutinaService.desactivarEjercicio(authorization, id);
    }

    @PostMapping("/{id}/ejercicios")
    public RutinaResponse agregarEjercicioARutina(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @RequestBody RutinaEjercicioRequest request
    ) {
        return rutinaService.agregarEjercicioARutina(authorization, id, request);
    }

    @PutMapping("/{rutinaId}/ejercicios/{rutinaEjercicioId}")
    public RutinaResponse actualizarEjercicioDeRutina(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long rutinaId,
            @PathVariable Long rutinaEjercicioId,
            @RequestBody RutinaEjercicioRequest request
    ) {
        return rutinaService.actualizarEjercicioDeRutina(authorization, rutinaId, rutinaEjercicioId, request);
    }

    @DeleteMapping("/{rutinaId}/ejercicios/{rutinaEjercicioId}")
    public RutinaResponse eliminarEjercicioDeRutina(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long rutinaId,
            @PathVariable Long rutinaEjercicioId
    ) {
        return rutinaService.eliminarEjercicioDeRutina(authorization, rutinaId, rutinaEjercicioId);
    }

    @PutMapping("/{id}/ejercicios/orden")
    public RutinaResponse cambiarOrdenEjercicios(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @RequestBody RutinaOrdenRequest request
    ) {
        return rutinaService.cambiarOrdenEjercicios(authorization, id, request);
    }

    @PostMapping("/{id}/asignaciones")
    public List<RutinaAsignadaResponse> asignarRutina(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @RequestBody RutinaAsignacionRequest request
    ) {
        return rutinaService.asignarRutina(authorization, id, request);
    }

    @GetMapping("/{id}/asignaciones")
    public List<RutinaAsignadaResponse> listarAsignacionesRutina(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id
    ) {
        return rutinaService.listarAsignacionesRutina(authorization, id);
    }

    @DeleteMapping("/asignaciones/{id}")
    public RutinaAsignadaResponse retirarAsignacion(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id
    ) {
        return rutinaService.retirarAsignacion(authorization, id);
    }

    @GetMapping("/me/asignadas")
    public List<RutinaAsignadaResponse> listarRutinasAsignadasCliente(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return rutinaService.listarRutinasAsignadasCliente(authorization);
    }
}
