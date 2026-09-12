package com.julia.gymflow.dto;

import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;

public class AuthSessionResponse {

    private final Long id;
    private final String nombre;
    private final String email;
    private final String fotoPerfilUrl;
    private final RolUsuario rol;
    private final Long gimnasioId;
    private final String nombreGimnasio;

    public AuthSessionResponse(Usuario usuario) {
        this.id = usuario.getId();
        this.nombre = usuario.getNombre();
        this.email = usuario.getEmail();
        this.fotoPerfilUrl = usuario.getFotoPerfilUrl();
        this.rol = usuario.getRol();

        if (usuario.getGimnasio() != null) {
            this.gimnasioId = usuario.getGimnasio().getId();
            this.nombreGimnasio = usuario.getGimnasio().getNombre();
        } else {
            this.gimnasioId = null;
            this.nombreGimnasio = null;
        }
    }

    public Long getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }

    public String getEmail() {
        return email;
    }

    public String getFotoPerfilUrl() {
        return fotoPerfilUrl;
    }

    public RolUsuario getRol() {
        return rol;
    }

    public Long getGimnasioId() {
        return gimnasioId;
    }

    public String getNombreGimnasio() {
        return nombreGimnasio;
    }
}
