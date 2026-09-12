package com.julia.gymflow.service;

import com.julia.gymflow.dto.CaducidadInvitacionCliente;
import com.julia.gymflow.dto.CrearInvitacionClienteRequest;
import com.julia.gymflow.dto.EstadoInvitacionCliente;
import com.julia.gymflow.dto.InvitacionClienteResponse;
import com.julia.gymflow.dto.LoginResponse;
import com.julia.gymflow.dto.RegistroInvitacionClienteRequest;
import com.julia.gymflow.dto.ValidacionInvitacionClienteResponse;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.InvitacionCliente;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.InvitacionClienteRepository;
import com.julia.gymflow.repository.UsuarioRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class InvitacionClienteService {

	private static final Pattern EMAIL_PATTERN =
			Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
	private static final Pattern PASSWORD_LETTER = Pattern.compile(".*[A-Za-zÁÉÍÓÚÜÑáéíóúüñ].*");
	private static final Pattern PASSWORD_DIGIT = Pattern.compile(".*\\d.*");
	private static final int MAX_REGISTRATIONS = 1000;

	private final InvitacionClienteRepository invitacionRepository;
	private final UsuarioRepository usuarioRepository;
	private final PasswordService passwordService;
	private final AuthTokenService authTokenService;
	private final InvitacionTokenService invitacionTokenService;
	private final MensajeBienvenidaService mensajeBienvenidaService;

	public InvitacionClienteService(
			InvitacionClienteRepository invitacionRepository,
			UsuarioRepository usuarioRepository,
			PasswordService passwordService,
			AuthTokenService authTokenService,
			InvitacionTokenService invitacionTokenService,
			MensajeBienvenidaService mensajeBienvenidaService
	) {
		this.invitacionRepository = invitacionRepository;
		this.usuarioRepository = usuarioRepository;
		this.passwordService = passwordService;
		this.authTokenService = authTokenService;
		this.invitacionTokenService = invitacionTokenService;
		this.mensajeBienvenidaService = mensajeBienvenidaService;
	}

	@Transactional
	public InvitacionClienteResponse crear(
			String authorizationHeader,
			CrearInvitacionClienteRequest request
	) {
		Usuario admin = exigirAdminActivo(authorizationHeader);
		if (request == null || request.getCaducidad() == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona la caducidad de la invitación.");
		}
		int limite = request.getLimiteRegistros() == null ? 0 : request.getLimiteRegistros();
		if (limite < 1 || limite > MAX_REGISTRATIONS) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"El límite de registros debe estar entre 1 y " + MAX_REGISTRATIONS + "."
			);
		}

		Instant ahora = Instant.now().truncatedTo(ChronoUnit.SECONDS);
		InvitacionCliente invitacion = new InvitacionCliente();
		invitacion.setPublicId(UUID.randomUUID().toString());
		invitacion.setGimnasio(admin.getGimnasio());
		invitacion.setCreadaPor(admin);
		invitacion.setFechaCreacion(ahora);
		invitacion.setFechaExpiracion(ahora.plus(duracion(request.getCaducidad())));
		invitacion.setLimiteRegistros(limite);
		invitacion.setUsosConsumidos(0);
		invitacion.setActiva(true);

		return toResponse(invitacionRepository.save(invitacion), ahora);
	}

	@Transactional(readOnly = true)
	public List<InvitacionClienteResponse> listar(String authorizationHeader) {
		Usuario admin = exigirAdminActivo(authorizationHeader);
		Instant ahora = Instant.now();
		return invitacionRepository
				.findByGimnasioIdOrderByFechaCreacionDesc(admin.getGimnasio().getId())
				.stream()
				.map(invitacion -> toResponse(invitacion, ahora))
				.toList();
	}

	@Transactional
	public InvitacionClienteResponse revocar(String authorizationHeader, Long invitacionId) {
		Usuario admin = exigirAdminActivo(authorizationHeader);
		InvitacionCliente invitacion = invitacionRepository.findById(invitacionId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitación no encontrada."));

		if (!Objects.equals(invitacion.getGimnasio().getId(), admin.getGimnasio().getId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes gestionar invitaciones de otro gimnasio.");
		}

		if (invitacion.isActiva()) {
			invitacion.setActiva(false);
			invitacion.setFechaRevocacion(Instant.now());
			invitacionRepository.save(invitacion);
		}
		return toResponse(invitacion, Instant.now());
	}

	@Transactional(readOnly = true)
	public ValidacionInvitacionClienteResponse validar(String token) {
		InvitacionTokenService.Claims claims;
		try {
			claims = invitacionTokenService.leerToken(token);
		} catch (IllegalArgumentException error) {
			return validacionInvalida(EstadoInvitacionCliente.INVALIDA, "El enlace de invitación no es válido.");
		}

		InvitacionCliente invitacion = invitacionRepository.findByPublicId(claims.publicId()).orElse(null);
		if (invitacion == null || !claimsCoinciden(invitacion, claims)) {
			return validacionInvalida(EstadoInvitacionCliente.INVALIDA, "El enlace de invitación no es válido.");
		}

		EstadoInvitacionCliente estado = obtenerEstado(invitacion, Instant.now());
		return new ValidacionInvitacionClienteResponse(
				estado == EstadoInvitacionCliente.ACTIVA,
				estado,
				mensajeEstado(estado),
				invitacion.getGimnasio().getNombre(),
				invitacion.getFechaExpiracion(),
				Math.max(0, invitacion.getLimiteRegistros() - invitacion.getUsosConsumidos())
		);
	}

	@Transactional
	public LoginResponse registrar(RegistroInvitacionClienteRequest request) {
		if (request == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completa los datos de registro.");
		}

		InvitacionTokenService.Claims claims = leerTokenExigido(request.getToken());
		InvitacionCliente invitacion = invitacionRepository
				.findByPublicIdForUpdate(claims.publicId())
				.orElseThrow(() -> invitacionNoValida(HttpStatus.BAD_REQUEST, "La invitación no es válida."));

		if (!claimsCoinciden(invitacion, claims)) {
			throw invitacionNoValida(HttpStatus.BAD_REQUEST, "La invitación no es válida.");
		}
		exigirDisponible(invitacion);

		String nombre = validarNombre(request.getNombre());
		String email = normalizarEmail(request.getEmail());
		validarEmail(email);
		validarPassword(request.getPassword(), request.getConfirmarPassword());
		if (usuarioRepository.findByEmail(email).isPresent()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una cuenta con este email.");
		}

		Usuario cliente = new Usuario();
		cliente.setNombre(nombre);
		cliente.setEmail(email);
		cliente.setPasswordHash(passwordService.hash(request.getPassword()));
		cliente.setRol(RolUsuario.CLIENTE);
		cliente.setActivo(true);
		cliente.setGimnasio(invitacion.getGimnasio());
		cliente.setFechaAlta(java.time.LocalDateTime.now());

		invitacion.setUsosConsumidos(invitacion.getUsosConsumidos() + 1);
		invitacionRepository.save(invitacion);

		try {
			Usuario guardado = usuarioRepository.saveAndFlush(cliente);
			mensajeBienvenidaService.crearPara(guardado);
			return new LoginResponse(guardado, authTokenService.crearToken(guardado));
		} catch (DataIntegrityViolationException error) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una cuenta con este email.");
		}
	}

	private InvitacionTokenService.Claims leerTokenExigido(String token) {
		try {
			return invitacionTokenService.leerToken(token);
		} catch (IllegalArgumentException error) {
			throw invitacionNoValida(HttpStatus.BAD_REQUEST, "La invitación no es válida.");
		}
	}

	private Usuario exigirAdminActivo(String authorizationHeader) {
		Long usuarioId = authTokenService.obtenerUsuarioId(authorizationHeader);
		Usuario actor = usuarioRepository.findById(usuarioId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesión no válida."));

		if (!actor.isActivo()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La cuenta no está activa.");
		}
		if (actor.getRol() != RolUsuario.ADMIN) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo un administrador puede gestionar invitaciones.");
		}
		if (actor.getGimnasio() == null || actor.getGimnasio().getId() == null || !actor.getGimnasio().isActivo()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La cuenta no tiene un gimnasio activo.");
		}
		return actor;
	}

	private Duration duracion(CaducidadInvitacionCliente caducidad) {
		return switch (caducidad) {
			case HORAS_24 -> Duration.ofHours(24);
			case DIAS_7 -> Duration.ofDays(7);
			case DIAS_30 -> Duration.ofDays(30);
		};
	}

	private InvitacionClienteResponse toResponse(InvitacionCliente invitacion, Instant ahora) {
		EstadoInvitacionCliente estado = obtenerEstado(invitacion, ahora);
		String token = estado == EstadoInvitacionCliente.ACTIVA
				? invitacionTokenService.crearToken(
						invitacion.getPublicId(),
						invitacion.getGimnasio().getId(),
						invitacion.getFechaExpiracion()
				)
				: null;

		return new InvitacionClienteResponse(
				invitacion.getId(),
				invitacion.getPublicId(),
				invitacion.getGimnasio().getId(),
				invitacion.getGimnasio().getNombre(),
				invitacion.getFechaCreacion(),
				invitacion.getFechaExpiracion(),
				invitacion.getLimiteRegistros(),
				invitacion.getUsosConsumidos(),
				estado,
				token
		);
	}

	private EstadoInvitacionCliente obtenerEstado(InvitacionCliente invitacion, Instant ahora) {
		if (!invitacion.isActiva() || invitacion.getFechaRevocacion() != null) {
			return EstadoInvitacionCliente.REVOCADA;
		}
		if (!invitacion.getGimnasio().isActivo()) {
			return EstadoInvitacionCliente.REVOCADA;
		}
		if (!ahora.isBefore(invitacion.getFechaExpiracion())) {
			return EstadoInvitacionCliente.CADUCADA;
		}
		if (invitacion.getUsosConsumidos() >= invitacion.getLimiteRegistros()) {
			return EstadoInvitacionCliente.AGOTADA;
		}
		return EstadoInvitacionCliente.ACTIVA;
	}

	private void exigirDisponible(InvitacionCliente invitacion) {
		EstadoInvitacionCliente estado = obtenerEstado(invitacion, Instant.now());
		switch (estado) {
			case ACTIVA -> { }
			case CADUCADA -> throw invitacionNoValida(HttpStatus.GONE, "Esta invitación ha caducado.");
			case REVOCADA -> throw invitacionNoValida(HttpStatus.GONE, "Esta invitación ha sido revocada.");
			case AGOTADA -> throw invitacionNoValida(HttpStatus.CONFLICT, "Esta invitación ya no tiene plazas disponibles.");
			default -> throw invitacionNoValida(HttpStatus.BAD_REQUEST, "La invitación no es válida.");
		}
	}

	private boolean claimsCoinciden(
			InvitacionCliente invitacion,
			InvitacionTokenService.Claims claims
	) {
		return Objects.equals(invitacion.getPublicId(), claims.publicId())
				&& Objects.equals(invitacion.getGimnasio().getId(), claims.gimnasioId())
				&& Objects.equals(invitacion.getFechaExpiracion(), claims.fechaExpiracion());
	}

	private ValidacionInvitacionClienteResponse validacionInvalida(
			EstadoInvitacionCliente estado,
			String mensaje
	) {
		return new ValidacionInvitacionClienteResponse(false, estado, mensaje, null, null, null);
	}

	private String mensajeEstado(EstadoInvitacionCliente estado) {
		return switch (estado) {
			case ACTIVA -> "Invitación válida.";
			case CADUCADA -> "Esta invitación ha caducado.";
			case AGOTADA -> "Esta invitación ya no tiene plazas disponibles.";
			case REVOCADA -> "Esta invitación ha sido revocada.";
			case INVALIDA -> "El enlace de invitación no es válido.";
		};
	}

	private ResponseStatusException invitacionNoValida(HttpStatus status, String message) {
		return new ResponseStatusException(status, message);
	}

	private String validarNombre(String nombre) {
		String normalizado = nombre == null ? "" : nombre.trim().replaceAll("\\s+", " ");
		if (normalizado.length() < 2 || normalizado.length() > 80) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre debe tener entre 2 y 80 caracteres.");
		}
		return normalizado;
	}

	private String normalizarEmail(String email) {
		return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
	}

	private void validarEmail(String email) {
		if (email.length() > 120 || !EMAIL_PATTERN.matcher(email).matches()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escribe un email válido.");
		}
	}

	private void validarPassword(String password, String confirmarPassword) {
		if (password == null || password.length() < 8 || password.length() > 72
				|| !PASSWORD_LETTER.matcher(password).matches()
				|| !PASSWORD_DIGIT.matcher(password).matches()) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"La contraseña debe tener entre 8 y 72 caracteres e incluir letras y números."
			);
		}
		if (!password.equals(confirmarPassword)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las contraseñas no coinciden.");
		}
	}
}
