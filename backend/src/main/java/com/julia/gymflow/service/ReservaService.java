package com.julia.gymflow.service;

import com.julia.gymflow.dto.ReservaRequest;
import com.julia.gymflow.dto.ReservaResponse;
import com.julia.gymflow.entity.Clase;
import com.julia.gymflow.entity.EstadoReserva;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.Reserva;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.ClaseRepository;
import com.julia.gymflow.repository.ReservaRepository;
import com.julia.gymflow.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class ReservaService {

	private final ReservaRepository reservaRepository;
	private final ClaseRepository claseRepository;
	private final UsuarioRepository usuarioRepository;
	private final AuthTokenService authTokenService;

	public ReservaService(
			ReservaRepository reservaRepository,
			ClaseRepository claseRepository,
			UsuarioRepository usuarioRepository,
			AuthTokenService authTokenService
	) {
		this.reservaRepository = reservaRepository;
		this.claseRepository = claseRepository;
		this.usuarioRepository = usuarioRepository;
		this.authTokenService = authTokenService;
	}

	@Transactional(readOnly = true)
	public List<ReservaResponse> listarReservas(String authorizationHeader) {
		Usuario actor = exigirActorActivo(authorizationHeader);
		List<Reserva> reservas = switch (actor.getRol()) {
			case ADMIN -> reservaRepository.findByClaseGimnasioIdOrderByFechaReservaDesc(
					actor.getGimnasio().getId()
			);
			case ENTRENADOR -> reservaRepository.findByClaseEntrenadorIdOrderByFechaReservaDesc(actor.getId());
			case CLIENTE -> reservaRepository.findByClienteIdOrderByFechaReservaDesc(actor.getId());
		};
		return convertir(reservas);
	}

	@Transactional(readOnly = true)
	public List<ReservaResponse> listarMisReservas(String authorizationHeader) {
		Usuario actor = exigirActorActivo(authorizationHeader);
		if (actor.getRol() != RolUsuario.CLIENTE) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo los clientes consultan sus propias reservas.");
		}
		return convertir(reservaRepository.findByClienteIdOrderByFechaReservaDesc(actor.getId()));
	}

	@Transactional(readOnly = true)
	public List<ReservaResponse> listarReservasPorClase(String authorizationHeader, Long claseId) {
		Usuario actor = exigirActorActivo(authorizationHeader);
		Clase clase = obtenerClase(claseId);
		validarMismoGimnasio(actor, clase);
		if (actor.getRol() == RolUsuario.CLIENTE) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Los clientes no pueden consultar la lista de alumnos.");
		}
		if (actor.getRol() == RolUsuario.ENTRENADOR
				&& (clase.getEntrenador() == null || !Objects.equals(clase.getEntrenador().getId(), actor.getId()))) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La sesion no esta asignada a este entrenador.");
		}
		return convertir(reservaRepository.findByClaseIdOrderByFechaReservaDesc(claseId));
	}

	@Transactional(readOnly = true)
	public List<ReservaResponse> listarReservasPorCliente(String authorizationHeader, Long clienteId) {
		Usuario actor = exigirActorActivo(authorizationHeader);
		Usuario cliente = usuarioRepository.findById(clienteId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado."));
		validarClienteDelGimnasio(cliente, actor.getGimnasio(), false);

		if (actor.getRol() == RolUsuario.ENTRENADOR) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Los entrenadores no pueden consultar reservas por cliente.");
		}
		if (actor.getRol() == RolUsuario.CLIENTE && !Objects.equals(actor.getId(), clienteId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes consultar reservas de otro cliente.");
		}
		return convertir(reservaRepository.findByClienteIdOrderByFechaReservaDesc(clienteId));
	}

	@Transactional
	public ReservaResponse crearReserva(String authorizationHeader, ReservaRequest request) {
		Usuario actor = exigirActorActivo(authorizationHeader);
		if (actor.getRol() == RolUsuario.ENTRENADOR) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Los entrenadores no pueden crear reservas.");
		}
		if (request == null || request.getClaseId() == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona una clase.");
		}

		Clase clase = claseRepository.findByIdForUpdate(request.getClaseId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clase no encontrada."));
		validarMismoGimnasio(actor, clase);
		Usuario cliente = resolverClienteReserva(actor, request.getClienteId());
		validarClaseReservable(clase);

		if (reservaRepository.existsByClaseIdAndClienteIdAndEstado(
				clase.getId(), cliente.getId(), EstadoReserva.RESERVADA)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una reserva activa para esta clase.");
		}

		long reservasActivas = reservaRepository.countByClaseIdAndEstado(
				clase.getId(), EstadoReserva.RESERVADA);
		if (clase.getCapacidadMaxima() <= 0 || reservasActivas >= clase.getCapacidadMaxima()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "La clase esta completa.");
		}

		Reserva reserva = new Reserva();
		reserva.setClase(clase);
		reserva.setCliente(cliente);
		reserva.setFechaReserva(LocalDateTime.now());
		reserva.setEstado(EstadoReserva.RESERVADA);
		return new ReservaResponse(reservaRepository.saveAndFlush(reserva));
	}

	@Transactional
	public ReservaResponse cancelarReserva(String authorizationHeader, Long id) {
		Usuario actor = exigirActorActivo(authorizationHeader);
		if (actor.getRol() == RolUsuario.ENTRENADOR) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Los entrenadores no pueden cancelar reservas.");
		}

		Reserva referencia = reservaRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva no encontrada."));
		if (referencia.getClase() == null) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "La reserva no tiene una sesion valida.");
		}
		Clase clase = claseRepository.findByIdForUpdate(referencia.getClase().getId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clase no encontrada."));
		validarMismoGimnasio(actor, clase);

		Reserva reserva = reservaRepository.findByIdForUpdate(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva no encontrada."));
		if (actor.getRol() == RolUsuario.CLIENTE
				&& (reserva.getCliente() == null || !Objects.equals(reserva.getCliente().getId(), actor.getId()))) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes cancelar una reserva ajena.");
		}
		if (reserva.getEstado() != EstadoReserva.RESERVADA) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "La reserva ya no esta activa.");
		}
		if (clase.getFechaHora() == null || !clase.getFechaHora().isAfter(LocalDateTime.now())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede cancelar una reserva historica.");
		}

		reserva.setEstado(EstadoReserva.CANCELADA);
		return new ReservaResponse(reservaRepository.save(reserva));
	}

	private Usuario resolverClienteReserva(Usuario actor, Long clienteSolicitadoId) {
		if (actor.getRol() == RolUsuario.CLIENTE) {
			if (clienteSolicitadoId != null && !Objects.equals(clienteSolicitadoId, actor.getId())) {
				throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes reservar para otro cliente.");
			}
			return actor;
		}
		if (clienteSolicitadoId == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un cliente.");
		}
		Usuario cliente = usuarioRepository.findById(clienteSolicitadoId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado."));
		validarClienteDelGimnasio(cliente, actor.getGimnasio(), true);
		return cliente;
	}

	private void validarClienteDelGimnasio(Usuario cliente, Gimnasio gimnasio, boolean exigirActivo) {
		if (cliente.getRol() != RolUsuario.CLIENTE) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El usuario seleccionado no es cliente.");
		}
		if (cliente.getGimnasio() == null || !Objects.equals(cliente.getGimnasio().getId(), gimnasio.getId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El cliente pertenece a otro gimnasio.");
		}
		if (exigirActivo && !cliente.isActivo()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "El cliente no esta activo.");
		}
	}

	private void validarClaseReservable(Clase clase) {
		if (!clase.isActiva()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "La clase no esta activa.");
		}
		if (clase.getFechaHora() == null || !clase.getFechaHora().isAfter(LocalDateTime.now())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede reservar una clase que ya ha comenzado.");
		}
	}

	private Clase obtenerClase(Long claseId) {
		return claseRepository.findById(claseId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clase no encontrada."));
	}

	private void validarMismoGimnasio(Usuario actor, Clase clase) {
		if (clase.getGimnasio() == null
				|| !Objects.equals(actor.getGimnasio().getId(), clase.getGimnasio().getId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La sesion pertenece a otro gimnasio.");
		}
	}

	private Usuario exigirActorActivo(String authorizationHeader) {
		Long usuarioId = authTokenService.obtenerUsuarioId(authorizationHeader);
		Usuario actor = usuarioRepository.findById(usuarioId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion no valida."));
		if (!actor.isActivo()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La cuenta no esta activa.");
		}
		if (actor.getGimnasio() == null || !actor.getGimnasio().isActivo()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La cuenta no pertenece a un gimnasio activo.");
		}
		return actor;
	}

	private List<ReservaResponse> convertir(List<Reserva> reservas) {
		return reservas.stream().map(ReservaResponse::new).toList();
	}
}
