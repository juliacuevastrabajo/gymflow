package com.julia.gymflow.controller;

import com.julia.gymflow.dto.PagoMarcarPagadoRequest;
import com.julia.gymflow.dto.PagoRequest;
import com.julia.gymflow.dto.PagoResponse;
import com.julia.gymflow.service.PagoService;
import jakarta.validation.Valid;
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
@RequestMapping("/api/pagos")
public class PagoController {

    private final PagoService pagoService;

    public PagoController(PagoService pagoService) {
        this.pagoService = pagoService;
    }

    @GetMapping
    public List<PagoResponse> listarPagos(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return pagoService.listarPagos(authorization);
    }

    @GetMapping("/me")
    public List<PagoResponse> listarMisPagos(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return pagoService.listarMisPagos(authorization);
    }

    @GetMapping("/{id}")
    public PagoResponse consultarPago(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id
    ) {
        return pagoService.consultarPago(authorization, id);
    }

    @PostMapping
    public PagoResponse crearPago(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody PagoRequest request
    ) {
        return pagoService.crearPago(authorization, request);
    }

    @PutMapping("/{id}")
    public PagoResponse actualizarPago(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @Valid @RequestBody PagoRequest request
    ) {
        return pagoService.actualizarPago(authorization, id, request);
    }

    @PutMapping("/{id}/marcar-pagado")
    public PagoResponse marcarComoPagado(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id,
            @Valid @RequestBody PagoMarcarPagadoRequest request
    ) {
        return pagoService.marcarComoPagado(authorization, id, request);
    }

    @PutMapping("/{id}/cancelar")
    public PagoResponse cancelarPago(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id
    ) {
        return pagoService.cancelarPago(authorization, id);
    }
}
