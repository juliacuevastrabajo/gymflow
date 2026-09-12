package com.julia.gymflow.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "gimnasios")
public class Gimnasio {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String nombre;

	@Column(unique = true)
	private String slug;

	private String emailContacto;

	private String telefono;

	private String direccion;

	@Column(length = 2048)
	private String imagenFondoUrl;

	private String colorPrimario;

	private String colorSecundario;

	@Column(length = 500)
	private String textoBienvenida;

	private boolean mensajesUsuariosPermitidos = false;

	@Column(nullable = false, columnDefinition = "boolean default true")
	private boolean clientesPuedenCambiarFotoPerfil = true;

	@Column(nullable = false, columnDefinition = "boolean default true")
	private boolean entrenadoresPuedenCambiarFotoPerfil = true;

	private boolean activo = true;

	public Gimnasio() {

	}

	public Gimnasio(Long id, String nombre, String slug, String emailContacto, String telefono, String direccion,
			String colorPrimario, String colorSecundario, String textoBienvenida, boolean activo) {

		this.id = id;
		this.nombre = nombre;
		this.slug = slug;
		this.emailContacto = emailContacto;
		this.telefono = telefono;
		this.direccion = direccion;
		this.colorPrimario = colorPrimario;
		this.colorSecundario = colorSecundario;
		this.textoBienvenida = textoBienvenida;
		this.activo = activo;

	}

	public Long getId() {
		return id;
	}

	public String getNombre() {
		return nombre;
	}

	public String getSlug() {
		return slug;
	}

	public String getEmailContacto() {
		return emailContacto;
	}

	public String getTelefono() {
		return telefono;
	}

	public String getDireccion() {
		return direccion;
	}

	public String getImagenFondoUrl() {
		return imagenFondoUrl;
	}

	public String getColorPrimario() {
		return colorPrimario;
	}

	public String getColorSecundario() {
		return colorSecundario;
	}

	public String getTextoBienvenida() {
		return textoBienvenida;
	}

	public boolean isActivo() {
		return activo;
	}

	public boolean isMensajesUsuariosPermitidos() {
		return mensajesUsuariosPermitidos;
	}

	public boolean isClientesPuedenCambiarFotoPerfil() {
		return clientesPuedenCambiarFotoPerfil;
	}

	public boolean isEntrenadoresPuedenCambiarFotoPerfil() {
		return entrenadoresPuedenCambiarFotoPerfil;
	}

	 public void setId(Long id) {
	        this.id = id;
	    }

	    public void setNombre(String nombre) {
	        this.nombre = nombre;
	    }

	    public void setSlug(String slug) {
	        this.slug = slug;
	    }

	    public void setEmailContacto(String emailContacto) {
	        this.emailContacto = emailContacto;
	    }

	    public void setTelefono(String telefono) {
	        this.telefono = telefono;
	    }

	    public void setDireccion(String direccion) {
	        this.direccion = direccion;
	    }

	    public void setImagenFondoUrl(String imagenFondoUrl) {
	        this.imagenFondoUrl = imagenFondoUrl;
	    }

	    public void setColorPrimario(String colorPrimario) {
	        this.colorPrimario = colorPrimario;
	    }

	    public void setColorSecundario(String colorSecundario) {
	        this.colorSecundario = colorSecundario;
	    }

	    public void setTextoBienvenida(String textoBienvenida) {
	        this.textoBienvenida = textoBienvenida;
	    }

	    public void setMensajesUsuariosPermitidos(boolean mensajesUsuariosPermitidos) {
	        this.mensajesUsuariosPermitidos = mensajesUsuariosPermitidos;
	    }

	    public void setClientesPuedenCambiarFotoPerfil(boolean clientesPuedenCambiarFotoPerfil) {
	        this.clientesPuedenCambiarFotoPerfil = clientesPuedenCambiarFotoPerfil;
	    }

	    public void setEntrenadoresPuedenCambiarFotoPerfil(boolean entrenadoresPuedenCambiarFotoPerfil) {
	        this.entrenadoresPuedenCambiarFotoPerfil = entrenadoresPuedenCambiarFotoPerfil;
	    }

	    public void setActivo(boolean activo) {
	        this.activo = activo;
	    }
	}
