package com.julia.gymflow.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "invitaciones_cliente")
public class InvitacionCliente {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 36)
	private String publicId;

	@ManyToOne(optional = false)
	@JoinColumn(name = "gimnasio_id", nullable = false)
	private Gimnasio gimnasio;

	@ManyToOne(optional = false)
	@JoinColumn(name = "creada_por_id", nullable = false)
	private Usuario creadaPor;

	@Column(nullable = false)
	private Instant fechaCreacion;

	@Column(nullable = false)
	private Instant fechaExpiracion;

	@Column(nullable = false)
	private int limiteRegistros;

	@Column(nullable = false)
	private int usosConsumidos;

	@Column(nullable = false)
	private boolean activa = true;

	private Instant fechaRevocacion;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getPublicId() {
		return publicId;
	}

	public void setPublicId(String publicId) {
		this.publicId = publicId;
	}

	public Gimnasio getGimnasio() {
		return gimnasio;
	}

	public void setGimnasio(Gimnasio gimnasio) {
		this.gimnasio = gimnasio;
	}

	public Usuario getCreadaPor() {
		return creadaPor;
	}

	public void setCreadaPor(Usuario creadaPor) {
		this.creadaPor = creadaPor;
	}

	public Instant getFechaCreacion() {
		return fechaCreacion;
	}

	public void setFechaCreacion(Instant fechaCreacion) {
		this.fechaCreacion = fechaCreacion;
	}

	public Instant getFechaExpiracion() {
		return fechaExpiracion;
	}

	public void setFechaExpiracion(Instant fechaExpiracion) {
		this.fechaExpiracion = fechaExpiracion;
	}

	public int getLimiteRegistros() {
		return limiteRegistros;
	}

	public void setLimiteRegistros(int limiteRegistros) {
		this.limiteRegistros = limiteRegistros;
	}

	public int getUsosConsumidos() {
		return usosConsumidos;
	}

	public void setUsosConsumidos(int usosConsumidos) {
		this.usosConsumidos = usosConsumidos;
	}

	public boolean isActiva() {
		return activa;
	}

	public void setActiva(boolean activa) {
		this.activa = activa;
	}

	public Instant getFechaRevocacion() {
		return fechaRevocacion;
	}

	public void setFechaRevocacion(Instant fechaRevocacion) {
		this.fechaRevocacion = fechaRevocacion;
	}
}
