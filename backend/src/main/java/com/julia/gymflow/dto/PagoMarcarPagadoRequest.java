package com.julia.gymflow.dto;

import com.julia.gymflow.entity.MetodoPago;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class PagoMarcarPagadoRequest {

    @NotNull(message = "La fecha de pago es obligatoria.")
    private LocalDate fechaPago;

    @NotNull(message = "Selecciona un método de pago.")
    private MetodoPago metodoPago;

    @Size(max = 255, message = "La referencia no puede superar 255 caracteres.")
    private String referencia;

    public LocalDate getFechaPago() {
        return fechaPago;
    }

    public MetodoPago getMetodoPago() {
        return metodoPago;
    }

    public String getReferencia() {
        return referencia;
    }

    public void setFechaPago(LocalDate fechaPago) {
        this.fechaPago = fechaPago;
    }

    public void setMetodoPago(MetodoPago metodoPago) {
        this.metodoPago = metodoPago;
    }

    public void setReferencia(String referencia) {
        this.referencia = referencia;
    }
}
