package com.julia.gymflow.dto;

import com.julia.gymflow.entity.Gimnasio;

public class GimnasioResponse {

    private final Long id;
    private final String nombre;
    private final String emailContacto;
    private final String telefono;
    private final String direccion;
    private final String imagenFondoUrl;
    private final String colorPrimario;
    private final String colorSecundario;
    private final String textoBienvenida;
    private final boolean mensajesUsuariosPermitidos;
    private final boolean clientesPuedenCambiarFotoPerfil;
    private final boolean entrenadoresPuedenCambiarFotoPerfil;

    public GimnasioResponse(Gimnasio gimnasio) {
        this.id = gimnasio.getId();
        this.nombre = gimnasio.getNombre();
        this.emailContacto = gimnasio.getEmailContacto();
        this.telefono = gimnasio.getTelefono();
        this.direccion = gimnasio.getDireccion();
        this.imagenFondoUrl = gimnasio.getImagenFondoUrl();
        this.colorPrimario = gimnasio.getColorPrimario();
        this.colorSecundario = gimnasio.getColorSecundario();
        this.textoBienvenida = gimnasio.getTextoBienvenida();
        this.mensajesUsuariosPermitidos = gimnasio.isMensajesUsuariosPermitidos();
        this.clientesPuedenCambiarFotoPerfil = gimnasio.isClientesPuedenCambiarFotoPerfil();
        this.entrenadoresPuedenCambiarFotoPerfil = gimnasio.isEntrenadoresPuedenCambiarFotoPerfil();
    }

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public String getEmailContacto() { return emailContacto; }
    public String getTelefono() { return telefono; }
    public String getDireccion() { return direccion; }
    public String getImagenFondoUrl() { return imagenFondoUrl; }
    public String getColorPrimario() { return colorPrimario; }
    public String getColorSecundario() { return colorSecundario; }
    public String getTextoBienvenida() { return textoBienvenida; }
    public boolean isMensajesUsuariosPermitidos() { return mensajesUsuariosPermitidos; }
    public boolean isClientesPuedenCambiarFotoPerfil() { return clientesPuedenCambiarFotoPerfil; }
    public boolean isEntrenadoresPuedenCambiarFotoPerfil() { return entrenadoresPuedenCambiarFotoPerfil; }
}
