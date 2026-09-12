package com.julia.gymflow.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
public class Usuario {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String nombre;

	@Column(nullable = false, unique = true)
	private String email;

	private String passwordHash;

	private String fotoPerfilUrl;

	@Enumerated(EnumType.STRING)
	private RolUsuario rol;

	private boolean activo = true;

	@Column(name = "fecha_alta")
	private LocalDateTime fechaAlta;

	@ManyToOne
	@JoinColumn(name = "gimnasio_id")
	private Gimnasio gimnasio;

	public Usuario() {

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

	public String getPasswordHash() {
        return passwordHash;
    }

    public String getFotoPerfilUrl() {
        return fotoPerfilUrl;
    }

    public RolUsuario getRol() {
        return rol;
    }

    public boolean isActivo() {
        return activo;
    }

    public LocalDateTime getFechaAlta() {
        return fechaAlta;
    }

    public Gimnasio getGimnasio() {
        return gimnasio;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void setFotoPerfilUrl(String fotoPerfilUrl) {
        this.fotoPerfilUrl = fotoPerfilUrl;
    }

    public void setRol(RolUsuario rol) {
        this.rol = rol;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public void setFechaAlta(LocalDateTime fechaAlta) {
        this.fechaAlta = fechaAlta;
    }

    public void setGimnasio(Gimnasio gimnasio) {
        this.gimnasio = gimnasio;
    }
}
