package com.julia.gymflow.dto;

import com.julia.gymflow.entity.ArchivoSubido;
import com.julia.gymflow.entity.EstadoArchivoSubido;
import com.julia.gymflow.entity.FinalidadArchivo;

public class ArchivoSubidoResponse {

    private final String id;
    private final String url;
    private final String tipoMultimedia;
    private final FinalidadArchivo finalidad;
    private final boolean temporal;

    public ArchivoSubidoResponse(ArchivoSubido archivo) {
        this.id = archivo.getIdentificadorPublico();
        this.url = archivo.getUrl();
        this.tipoMultimedia = archivo.getTipo().name();
        this.finalidad = archivo.getFinalidad();
        this.temporal = archivo.getEstado() == EstadoArchivoSubido.TEMPORAL;
    }

    public String getId() { return id; }
    public String getUrl() { return url; }
    public String getTipoMultimedia() { return tipoMultimedia; }
    public FinalidadArchivo getFinalidad() { return finalidad; }
    public boolean isTemporal() { return temporal; }
}
