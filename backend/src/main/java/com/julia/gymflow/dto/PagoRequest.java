package com.julia.gymflow.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PagoRequest {

    @NotNull(message = "Selecciona un cliente.")
    private Long clienteId;

    @NotBlank(message = "El concepto es obligatorio.")
    @Size(max = 140, message = "El concepto no puede superar 140 caracteres.")
    private String concepto;

    @Size(max = 2000, message = "La descripción no puede superar 2000 caracteres.")
    private String descripcion;

    @NotNull(message = "El importe es obligatorio.")
    @DecimalMin(value = "0.01", message = "El importe debe ser mayor que cero.")
    private BigDecimal importe;

    @NotNull(message = "La fecha de vencimiento es obligatoria.")
    private LocalDate fechaVencimiento;

    public Long getClienteId() {
        return clienteId;
    }

    public String getConcepto() {
        return concepto;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public BigDecimal getImporte() {
        return importe;
    }

    public LocalDate getFechaVencimiento() {
        return fechaVencimiento;
    }

    public void setClienteId(Long clienteId) {
        this.clienteId = clienteId;
    }

    public void setConcepto(String concepto) {
        this.concepto = concepto;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public void setImporte(BigDecimal importe) {
        this.importe = importe;
    }

    public void setFechaVencimiento(LocalDate fechaVencimiento) {
        this.fechaVencimiento = fechaVencimiento;
    }
}
