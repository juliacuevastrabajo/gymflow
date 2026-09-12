package com.julia.gymflow.service;

import com.julia.gymflow.dto.ClaseRequest;
import com.julia.gymflow.dto.ClaseResponse;
import com.julia.gymflow.entity.Clase;
import com.julia.gymflow.entity.EstadoReserva;
import com.julia.gymflow.entity.FinalidadArchivo;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.ClaseRepository;
import com.julia.gymflow.repository.GimnasioRepository;
import com.julia.gymflow.repository.ReservaRepository;
import com.julia.gymflow.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class ClaseService {

	private final ClaseRepository claseRepository;
	private final GimnasioRepository gimnasioRepository;
	private final UsuarioRepository usuarioRepository;
	private final ReservaRepository reservaRepository;
	private final AuthTokenService authTokenService;
	private final ArchivoAsociacionService archivoAsociacionService;
	private final ArchivoReferenciaService archivoReferenciaService;

	public ClaseService(ClaseRepository claseRepository, GimnasioRepository gimnasioRepository,
			UsuarioRepository usuarioRepository, ReservaRepository reservaRepository,
			AuthTokenService authTokenService,
			ArchivoAsociacionService archivoAsociacionService,
			ArchivoReferenciaService archivoReferenciaService) {
		this.claseRepository = claseRepository;
		this.gimnasioRepository = gimnasioRepository;
		this.usuarioRepository = usuarioRepository;
		this.reservaRepository = reservaRepository;
		this.authTokenService = authTokenService;
		this.archivoAsociacionService = archivoAsociacionService;
		this.archivoReferenciaService = archivoReferenciaService;
	}

	@Transactional(readOnly = true)
	public List<ClaseResponse> listarClases(String authorizationHeader) {
		Usuario actor = exigirActorActivo(authorizationHeader);
		List<Clase> clases;
		if (actor.getRol() == RolUsuario.ADMIN) {
			clases = claseRepository.findByGimnasioIdOrderByFechaHoraAsc(actor.getGimnasio().getId());
		} else if (actor.getRol() == RolUsuario.ENTRENADOR) {
			clases = claseRepository.findByEntrenadorIdAndActivaTrueOrderByFechaHoraAsc(actor.getId());
		} else {
			clases = claseRepository.findByGimnasioIdAndActivaTrueOrderByFechaHoraAsc(actor.getGimnasio().getId());
		}
		return clases.stream().map(ClaseResponse::new).toList();
	}

	@Transactional(readOnly = true)
	public List<ClaseResponse> listarClasesPorGimnasio(String authorizationHeader, Long gimnasioId) {
		Usuario actor = exigirActorActivo(authorizationHeader);
		if (!Objects.equals(actor.getGimnasio().getId(), gimnasioId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes consultar clases de otro gimnasio.");
		}
		return listarClases(authorizationHeader);
	}

	@Transactional(readOnly = true)
	public List<ClaseResponse> listarClasesPorEntrenador(String authorizationHeader, Long entrenadorId) {
		Usuario actor = exigirActorActivo(authorizationHeader);
		if (actor.getRol() != RolUsuario.ADMIN && !Objects.equals(actor.getId(), entrenadorId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes consultar las clases de otro entrenador.");
		}
		Usuario entrenador = obtenerEntrenador(entrenadorId, actor.getGimnasio());
		return claseRepository.findByEntrenadorIdAndActivaTrueOrderByFechaHoraAsc(entrenador.getId())
				.stream().map(ClaseResponse::new).toList();
	}

	@Transactional
	public ClaseResponse crearClase(String authorizationHeader, ClaseRequest request) {
		Usuario actor = exigirAdminActivo(authorizationHeader);
		Gimnasio gimnasio = actor.getGimnasio();
		validarFechaSolicitada(request == null ? null : request.getFechaHora());
		validarGimnasioSolicitado(request, gimnasio);
		Usuario entrenador = obtenerEntrenador(request.getEntrenadorId(), gimnasio);

		Clase clase = new Clase();
		clase.setNombre(request.getNombre());
		clase.setDescripcion(request.getDescripcion());
		clase.setImagenUrl(archivoAsociacionService.asociarImagen(
				request.getImagenUrl(), null, FinalidadArchivo.PORTADA_CLASE, actor, gimnasio
		));
		clase.setFechaHora(request.getFechaHora());
		clase.setDuracionMinutos(request.getDuracionMinutos());
		clase.setCapacidadMaxima(request.getCapacidadMaxima());
		clase.setGimnasio(gimnasio);
		clase.setEntrenador(entrenador);
		clase.setActiva(true);

		Clase claseGuardada = claseRepository.save(clase);

		return new ClaseResponse(claseGuardada);
	}

	@Transactional
	public ClaseResponse actualizarClase(String authorizationHeader, Long id, ClaseRequest request) {
		Usuario actor = exigirAdminActivo(authorizationHeader);
		Clase clase = claseRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clase no encontrada."));
		Gimnasio gimnasio = actor.getGimnasio();
		if (clase.getGimnasio() == null || !Objects.equals(clase.getGimnasio().getId(), gimnasio.getId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La clase pertenece a otro gimnasio.");
		}
		validarSesionLegacyEditable(clase);
		validarFechaSolicitada(request == null ? null : request.getFechaHora());
		if (reservaRepository.existsByClaseIdAndEstado(id, EstadoReserva.RESERVADA)) {
			throw new ResponseStatusException(
					HttpStatus.CONFLICT,
					"La sesion tiene reservas activas y no puede editarse directamente."
			);
		}
		validarGimnasioSolicitado(request, gimnasio);
		Usuario entrenador = obtenerEntrenador(request.getEntrenadorId(), gimnasio);
		String imagenAnterior = clase.getImagenUrl();

		clase.setNombre(request.getNombre());
		clase.setDescripcion(request.getDescripcion());
		clase.setImagenUrl(archivoAsociacionService.asociarImagen(
				request.getImagenUrl(), clase.getImagenUrl(), FinalidadArchivo.PORTADA_CLASE, actor, gimnasio
		));
		clase.setFechaHora(request.getFechaHora());
		clase.setDuracionMinutos(request.getDuracionMinutos());
		clase.setCapacidadMaxima(request.getCapacidadMaxima());
		clase.setGimnasio(gimnasio);
		clase.setEntrenador(entrenador);
		clase.setActiva(true);

		Clase claseActualizada = claseRepository.save(clase);
		if (!Objects.equals(imagenAnterior, clase.getImagenUrl())) {
			archivoReferenciaService.liberarSiNoReferenciado(imagenAnterior);
		}

		return new ClaseResponse(claseActualizada);
	}

	@Transactional
	public ClaseResponse desactivarClase(String authorizationHeader, Long id) {
		Usuario actor = exigirAdminActivo(authorizationHeader);
		Clase clase = claseRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Clase no encontrada."));
		if (clase.getGimnasio() == null || !Objects.equals(clase.getGimnasio().getId(), actor.getGimnasio().getId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La clase pertenece a otro gimnasio.");
		}
		validarSesionLegacyEditable(clase);
		if (reservaRepository.existsByClaseIdAndEstado(id, EstadoReserva.RESERVADA)) {
			throw new ResponseStatusException(
					HttpStatus.CONFLICT,
					"La sesion tiene reservas activas. Resuelvelas antes de desactivarla."
			);
		}

		clase.setActiva(false);

		Clase claseActualizada = claseRepository.save(clase);

		return new ClaseResponse(claseActualizada);
	}

	private void validarFechaSolicitada(LocalDateTime fechaHora) {
		if (fechaHora == null || !fechaHora.isAfter(LocalDateTime.now())) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"La sesion debe tener una fecha futura."
			);
		}
	}

	private void validarSesionLegacyEditable(Clase clase) {
		if (clase.getProgramacion() != null) {
			throw new ResponseStatusException(
					HttpStatus.CONFLICT,
					"Esta sesion pertenece a una programacion semanal y debe gestionarse desde ella."
			);
		}
		if (clase.getFechaHora() == null || !clase.getFechaHora().isAfter(LocalDateTime.now())) {
			throw new ResponseStatusException(
					HttpStatus.CONFLICT,
					"Las sesiones historicas se conservan en modo consulta."
			);
		}
	}

	private Usuario exigirAdminActivo(String authorizationHeader) {
		Usuario actor = exigirActorActivo(authorizationHeader);
		if (!actor.isActivo() || actor.getRol() != RolUsuario.ADMIN || actor.getGimnasio() == null) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo administracion puede gestionar clases.");
		}
		return actor;
	}

	private Usuario exigirActorActivo(String authorizationHeader) {
		Long usuarioId = authTokenService.obtenerUsuarioId(authorizationHeader);
		Usuario actor = usuarioRepository.findById(usuarioId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion no valida."));
		if (!actor.isActivo() || actor.getGimnasio() == null || !actor.getGimnasio().isActivo()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La cuenta no puede consultar clases.");
		}
		return actor;
	}

	private Usuario obtenerEntrenador(Long entrenadorId, Gimnasio gimnasio) {
		Usuario entrenador = usuarioRepository.findById(entrenadorId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Entrenador no encontrado."));
		if (!entrenador.isActivo() || entrenador.getRol() != RolUsuario.ENTRENADOR) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un entrenador activo.");
		}
		if (entrenador.getGimnasio() == null || !Objects.equals(entrenador.getGimnasio().getId(), gimnasio.getId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El entrenador pertenece a otro gimnasio.");
		}
		return entrenador;
	}

	private void validarGimnasioSolicitado(ClaseRequest request, Gimnasio gimnasio) {
		if (request.getGimnasioId() != null && !Objects.equals(request.getGimnasioId(), gimnasio.getId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes gestionar clases de otro gimnasio.");
		}
	}
}
