package com.julia.gymflow.dto;

public class ActualizarGimnasioRequest {

    private String nombre;
    private String textoBienvenida;
    private String imagenFondoUrl;
    private String colorPrimario;
    private String colorSecundario;
    private Boolean mensajesUsuariosPermitidos;
    private Boolean clientesPuedenCambiarFotoPerfil;
    private Boolean entrenadoresPuedenCambiarFotoPerfil;

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getTextoBienvenida() {
        return textoBienvenida;
    }

    public void setTextoBienvenida(String textoBienvenida) {
        this.textoBienvenida = textoBienvenida;
    }

    public String getImagenFondoUrl() {
        return imagenFondoUrl;
    }

    public void setImagenFondoUrl(String imagenFondoUrl) {
        this.imagenFondoUrl = imagenFondoUrl;
    }

    public String getColorPrimario() {
        return colorPrimario;
    }

    public void setColorPrimario(String colorPrimario) {
        this.colorPrimario = colorPrimario;
    }

    public String getColorSecundario() {
        return colorSecundario;
    }

    public void setColorSecundario(String colorSecundario) {
        this.colorSecundario = colorSecundario;
    }

    public Boolean getMensajesUsuariosPermitidos() {
        return mensajesUsuariosPermitidos;
    }

    public void setMensajesUsuariosPermitidos(Boolean mensajesUsuariosPermitidos) {
        this.mensajesUsuariosPermitidos = mensajesUsuariosPermitidos;
    }

    public Boolean getClientesPuedenCambiarFotoPerfil() {
        return clientesPuedenCambiarFotoPerfil;
    }

    public void setClientesPuedenCambiarFotoPerfil(Boolean clientesPuedenCambiarFotoPerfil) {
        this.clientesPuedenCambiarFotoPerfil = clientesPuedenCambiarFotoPerfil;
    }

    public Boolean getEntrenadoresPuedenCambiarFotoPerfil() {
        return entrenadoresPuedenCambiarFotoPerfil;
    }

    public void setEntrenadoresPuedenCambiarFotoPerfil(Boolean entrenadoresPuedenCambiarFotoPerfil) {
        this.entrenadoresPuedenCambiarFotoPerfil = entrenadoresPuedenCambiarFotoPerfil;
    }
}
