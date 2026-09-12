package com.julia.gymflow.dto;

import com.julia.gymflow.entity.EstadoPago;
import com.julia.gymflow.entity.MetodoPago;
import com.julia.gymflow.entity.Pago;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PagoResponse {

    private final Long id;
    private final Long gimnasioId;
    private final Long clienteId;
    private final String nombreCliente;
    private final String emailCliente;
    private final String fotoClienteUrl;
    private final Long creadoPorId;
    private final String nombreCreador;
    private final String concepto;
    private final String descripcion;
    private final BigDecimal importe;
    private final String moneda;
    private final LocalDate fechaEmision;
    private final LocalDate fechaVencimiento;
    private final LocalDate fechaPago;
    private final MetodoPago metodoPago;
    private final String referencia;
    private final String estado;
    private final LocalDateTime fechaCreacion;
    private final LocalDateTime fechaActualizacion;

    public PagoResponse(Pago pago, LocalDate hoy) {
        this.id = pago.getId();
        this.gimnasioId = pago.getGimnasio() != null ? pago.getGimnasio().getId() : null;
        this.clienteId = pago.getCliente() != null ? pago.getCliente().getId() : null;
        this.nombreCliente = pago.getCliente() != null ? pago.getCliente().getNombre() : null;
        this.emailCliente = pago.getCliente() != null ? pago.getCliente().getEmail() : null;
        this.fotoClienteUrl = pago.getCliente() != null ? pago.getCliente().getFotoPerfilUrl() : null;
        this.creadoPorId = pago.getCreadoPor() != null ? pago.getCreadoPor().getId() : null;
        this.nombreCreador = pago.getCreadoPor() != null ? pago.getCreadoPor().getNombre() : null;
        this.concepto = pago.getConcepto();
        this.descripcion = pago.getDescripcion();
        this.importe = pago.getImporte();
        this.moneda = pago.getMoneda();
        this.fechaEmision = pago.getFechaEmision();
        this.fechaVencimiento = pago.getFechaVencimiento();
        this.fechaPago = pago.getFechaPago();
        this.metodoPago = pago.getMetodoPago();
        this.referencia = pago.getReferencia();
        this.estado = calcularEstadoVisual(pago, hoy);
        this.fechaCreacion = pago.getFechaCreacion();
        this.fechaActualizacion = pago.getFechaActualizacion();
    }

    private String calcularEstadoVisual(Pago pago, LocalDate hoy) {
        if (pago.getEstado() == EstadoPago.PENDIENTE
                && pago.getFechaVencimiento() != null
                && pago.getFechaVencimiento().isBefore(hoy)) {
            return "VENCIDO";
        }
        return pago.getEstado().name();
    }

    public Long getId() { return id; }
    public Long getGimnasioId() { return gimnasioId; }
    public Long getClienteId() { return clienteId; }
    public String getNombreCliente() { return nombreCliente; }
    public String getEmailCliente() { return emailCliente; }
    public String getFotoClienteUrl() { return fotoClienteUrl; }
    public Long getCreadoPorId() { return creadoPorId; }
    public String getNombreCreador() { return nombreCreador; }
    public String getConcepto() { return concepto; }
    public String getDescripcion() { return descripcion; }
    public BigDecimal getImporte() { return importe; }
    public String getMoneda() { return moneda; }
    public LocalDate getFechaEmision() { return fechaEmision; }
    public LocalDate getFechaVencimiento() { return fechaVencimiento; }
    public LocalDate getFechaPago() { return fechaPago; }
    public MetodoPago getMetodoPago() { return metodoPago; }
    public String getReferencia() { return referencia; }
    public String getEstado() { return estado; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
}
