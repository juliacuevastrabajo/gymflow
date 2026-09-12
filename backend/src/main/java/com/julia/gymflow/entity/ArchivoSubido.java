package com.julia.gymflow.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "archivos_subidos",
        indexes = {
                @Index(name = "idx_archivo_estado_caducidad", columnList = "estado,fecha_estado"),
                @Index(name = "idx_archivo_gimnasio", columnList = "gimnasio_id")
        }
)
public class ArchivoSubido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "identificador_publico", nullable = false, unique = true, length = 36)
    private String identificadorPublico;

    @Column(name = "nombre_fisico", nullable = false, unique = true, length = 80)
    private String nombreFisico;

    @Column(nullable = false, unique = true, length = 512)
    private String url;

    @Column(name = "mime_detectado", nullable = false, length = 80)
    private String mimeDetectado;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private TipoArchivoSubido tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private FinalidadArchivo finalidad;

    @Column(nullable = false)
    private long tamano;

    @ManyToOne(optional = false)
    @JoinColumn(name = "subido_por_usuario_id", nullable = false)
    private Usuario subidoPor;

    @ManyToOne(optional = false)
    @JoinColumn(name = "gimnasio_id", nullable = false)
    private Gimnasio gimnasio;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_estado", nullable = false)
    private LocalDateTime fechaEstado;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private EstadoArchivoSubido estado;

    @Column(name = "fecha_asociacion")
    private LocalDateTime fechaAsociacion;

    public Long getId() { return id; }
    public String getIdentificadorPublico() { return identificadorPublico; }
    public String getNombreFisico() { return nombreFisico; }
    public String getUrl() { return url; }
    public String getMimeDetectado() { return mimeDetectado; }
    public TipoArchivoSubido getTipo() { return tipo; }
    public FinalidadArchivo getFinalidad() { return finalidad; }
    public long getTamano() { return tamano; }
    public Usuario getSubidoPor() { return subidoPor; }
    public Gimnasio getGimnasio() { return gimnasio; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public LocalDateTime getFechaEstado() { return fechaEstado; }
    public EstadoArchivoSubido getEstado() { return estado; }
    public LocalDateTime getFechaAsociacion() { return fechaAsociacion; }

    public void setId(Long id) { this.id = id; }
    public void setIdentificadorPublico(String identificadorPublico) { this.identificadorPublico = identificadorPublico; }
    public void setNombreFisico(String nombreFisico) { this.nombreFisico = nombreFisico; }
    public void setUrl(String url) { this.url = url; }
    public void setMimeDetectado(String mimeDetectado) { this.mimeDetectado = mimeDetectado; }
    public void setTipo(TipoArchivoSubido tipo) { this.tipo = tipo; }
    public void setFinalidad(FinalidadArchivo finalidad) { this.finalidad = finalidad; }
    public void setTamano(long tamano) { this.tamano = tamano; }
    public void setSubidoPor(Usuario subidoPor) { this.subidoPor = subidoPor; }
    public void setGimnasio(Gimnasio gimnasio) { this.gimnasio = gimnasio; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
    public void setFechaEstado(LocalDateTime fechaEstado) { this.fechaEstado = fechaEstado; }
    public void setEstado(EstadoArchivoSubido estado) { this.estado = estado; }
    public void setFechaAsociacion(LocalDateTime fechaAsociacion) { this.fechaAsociacion = fechaAsociacion; }
}
