package com.julia.gymflow.service;

import com.julia.gymflow.dto.ActualizarPerfilRequest;
import com.julia.gymflow.dto.CambiarPasswordRequest;
import com.julia.gymflow.dto.CrearUsuarioAdminRequest;
import com.julia.gymflow.dto.CrearUsuarioAdminResponse;
import com.julia.gymflow.dto.UsuarioResponse;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.FinalidadArchivo;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.GimnasioRepository;
import com.julia.gymflow.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.regex.Pattern;

@Service
public class UsuarioService {

	private static final Pattern EMAIL_PATTERN =
			Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
	private static final SecureRandom SECURE_RANDOM = new SecureRandom();
	private static final String PASSWORD_UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
	private static final String PASSWORD_LOWER = "abcdefghijkmnopqrstuvwxyz";
	private static final String PASSWORD_DIGITS = "23456789";
	private static final String PASSWORD_SYMBOLS = "!@#$%*";
	private static final int INITIAL_PASSWORD_LENGTH = 14;

	private final UsuarioRepository usuarioRepository;
	private final GimnasioRepository gimnasioRepository;
	private final MensajeBienvenidaService mensajeBienvenidaService;
	private final PasswordService passwordService;
	private final AuthTokenService authTokenService;
	private final ArchivoAsociacionService archivoAsociacionService;
	private final ArchivoReferenciaService archivoReferenciaService;

	public UsuarioService(
			UsuarioRepository usuarioRepository,
			GimnasioRepository gimnasioRepository,
			MensajeBienvenidaService mensajeBienvenidaService,
			PasswordService passwordService,
			AuthTokenService authTokenService,
			ArchivoAsociacionService archivoAsociacionService,
			ArchivoReferenciaService archivoReferenciaService
	) {
		this.usuarioRepository = usuarioRepository;
		this.gimnasioRepository = gimnasioRepository;
		this.mensajeBienvenidaService = mensajeBienvenidaService;
		this.passwordService = passwordService;
		this.authTokenService = authTokenService;
		this.archivoAsociacionService = archivoAsociacionService;
		this.archivoReferenciaService = archivoReferenciaService;
	}

	public List<UsuarioResponse> listarUsuarios(String authorizationHeader) {
		Usuario actor = obtenerActorActivo(authorizationHeader);
		return filtrarUsuariosVisibles(actor, actor.getGimnasio().getId());
	}

	public List<UsuarioResponse> listarUsuariosPorGimnasio(
			String authorizationHeader,
			Long gimnasioId
	) {
		Usuario actor = obtenerActorActivo(authorizationHeader);
		if (!Objects.equals(actor.getGimnasio().getId(), gimnasioId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes consultar usuarios de otro gimnasio.");
		}
		return filtrarUsuariosVisibles(actor, gimnasioId);
	}

	@Transactional
	public CrearUsuarioAdminResponse crearUsuario(
			String authorizationHeader,
			CrearUsuarioAdminRequest request
	) {
		Usuario actor = exigirAdminActivo(authorizationHeader);
		if (request == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los datos de la cuenta son obligatorios.");
		}
		String nombre = validarNombre(request.getNombre());
		String email = normalizarEmail(request.getEmail());
		validarEmail(email);
		validarRolAlta(request.getRol());

		if (usuarioRepository.findByEmail(email).isPresent()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un usuario con este email.");
		}

		Gimnasio gimnasio = actor.getGimnasio();
		if (gimnasio == null || gimnasio.getId() == null) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La cuenta administradora no tiene un gimnasio válido.");
		}
		String passwordInicial = generarPasswordInicial();
		String fotoPerfilUrl = archivoAsociacionService.asociarImagen(
				request.getFotoPerfilUrl(),
				null,
				FinalidadArchivo.FOTO_PERFIL,
				actor,
				gimnasio
		);

		Usuario usuario = new Usuario();
		usuario.setNombre(nombre);
		usuario.setEmail(email);
		usuario.setPasswordHash(passwordService.hash(passwordInicial));
		usuario.setFotoPerfilUrl(fotoPerfilUrl);
		usuario.setRol(request.getRol());
		usuario.setGimnasio(gimnasio);
		usuario.setActivo(true);
		usuario.setFechaAlta(LocalDateTime.now());

		Usuario usuarioGuardado = usuarioRepository.save(usuario);
		mensajeBienvenidaService.crearPara(usuarioGuardado);

		return new CrearUsuarioAdminResponse(new UsuarioResponse(usuarioGuardado), passwordInicial);
	}

	public UsuarioResponse actualizarMiPerfil(String authorizationHeader, ActualizarPerfilRequest request) {
		Usuario usuario = obtenerUsuarioAutenticado(authorizationHeader);
		String nombre = validarNombre(request.getNombre());
		String email = normalizarEmail(request.getEmail());
		validarEmail(email);

		usuarioRepository.findByEmail(email)
				.filter(usuarioExistente -> !usuarioExistente.getId().equals(usuario.getId()))
				.ifPresent(usuarioExistente -> {
					throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un usuario con este email.");
				});

		usuario.setNombre(nombre);
		usuario.setEmail(email);

		return new UsuarioResponse(usuarioRepository.save(usuario));
	}

	public UsuarioResponse cambiarMiPassword(String authorizationHeader, CambiarPasswordRequest request) {
		Usuario usuario = obtenerUsuarioAutenticado(authorizationHeader);

		if (!tieneTexto(request.getPasswordActual())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escribe tu contrasena actual.");
		}

		validarPasswordNueva(request.getPasswordNueva());

		if (!passwordService.matches(request.getPasswordActual(), usuario.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contrasena actual no es correcta.");
		}

		usuario.setPasswordHash(passwordService.hash(request.getPasswordNueva()));
		return new UsuarioResponse(usuarioRepository.save(usuario));
	}

	@Transactional
	public UsuarioResponse actualizarFotoPerfil(
			String authorizationHeader,
			Long id,
			String fotoPerfilUrl
	) {
		Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
		if (!actor.isActivo()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El usuario no está activo.");
		}

		Usuario usuario = usuarioRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado."));
		validarPermisoFoto(actor, usuario);
		String fotoAnterior = usuario.getFotoPerfilUrl();
		String fotoNormalizada = archivoAsociacionService.asociarImagen(
				fotoPerfilUrl,
				usuario.getFotoPerfilUrl(),
				FinalidadArchivo.FOTO_PERFIL,
				actor,
				usuario.getGimnasio()
		);

		usuario.setFotoPerfilUrl(fotoNormalizada);
		Usuario guardado = usuarioRepository.save(usuario);
		if (!Objects.equals(fotoAnterior, fotoNormalizada)) {
			archivoReferenciaService.liberarSiNoReferenciado(fotoAnterior);
		}
		return new UsuarioResponse(guardado);
	}

	@Transactional
	public UsuarioResponse desactivarUsuario(String authorizationHeader, Long id) {
		Usuario actor = exigirAdminActivo(authorizationHeader);
		Usuario usuario = usuarioRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado."));

		if (actor.getGimnasio() == null || usuario.getGimnasio() == null
				|| !Objects.equals(actor.getGimnasio().getId(), usuario.getGimnasio().getId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes desactivar usuarios de otro gimnasio.");
		}
		if (Objects.equals(actor.getId(), usuario.getId()) || usuario.getRol() == RolUsuario.ADMIN) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este flujo no permite desactivar cuentas administradoras.");
		}
		if (usuario.getRol() != RolUsuario.CLIENTE && usuario.getRol() != RolUsuario.ENTRENADOR) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo se pueden desactivar clientes o entrenadores.");
		}

		usuario.setActivo(false);
		return new UsuarioResponse(usuarioRepository.save(usuario));
	}

	private Usuario obtenerUsuarioAutenticado(String authorizationHeader) {
		Long usuarioId = authTokenService.obtenerUsuarioId(authorizationHeader);

		return usuarioRepository.findById(usuarioId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion no valida."));
	}

	private Usuario obtenerActorActivo(String authorizationHeader) {
		Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
		if (!actor.isActivo()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El usuario no está activo.");
		}
		if (actor.getGimnasio() == null || actor.getGimnasio().getId() == null) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El usuario no tiene un gimnasio válido.");
		}
		return actor;
	}

	private Usuario exigirAdminActivo(String authorizationHeader) {
		Usuario actor = obtenerActorActivo(authorizationHeader);
		if (actor.getRol() != RolUsuario.ADMIN) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo un administrador puede gestionar usuarios.");
		}
		return actor;
	}

	private List<UsuarioResponse> filtrarUsuariosVisibles(Usuario actor, Long gimnasioId) {
		return usuarioRepository.findByGimnasioId(gimnasioId).stream()
				.filter(usuario -> esUsuarioVisiblePara(actor, usuario))
				.map(UsuarioResponse::new)
				.toList();
	}

	private boolean esUsuarioVisiblePara(Usuario actor, Usuario usuario) {
		if (actor.getRol() == RolUsuario.ADMIN) {
			return true;
		}
		if (!usuario.isActivo()) {
			return Objects.equals(actor.getId(), usuario.getId());
		}
		if (Objects.equals(actor.getId(), usuario.getId()) || usuario.getRol() == RolUsuario.ADMIN) {
			return true;
		}
		return actor.getRol() == RolUsuario.ENTRENADOR && usuario.getRol() == RolUsuario.CLIENTE;
	}

	private void validarRolAlta(RolUsuario rol) {
		if (rol == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona el tipo de cuenta.");
		}
		if (rol != RolUsuario.CLIENTE && rol != RolUsuario.ENTRENADOR) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo se pueden crear clientes o entrenadores.");
		}
	}

	private String generarPasswordInicial() {
		List<Character> caracteres = new ArrayList<>(INITIAL_PASSWORD_LENGTH);
		caracteres.add(caracterAleatorio(PASSWORD_UPPER));
		caracteres.add(caracterAleatorio(PASSWORD_LOWER));
		caracteres.add(caracterAleatorio(PASSWORD_DIGITS));
		caracteres.add(caracterAleatorio(PASSWORD_SYMBOLS));

		String disponibles = PASSWORD_UPPER + PASSWORD_LOWER + PASSWORD_DIGITS + PASSWORD_SYMBOLS;
		while (caracteres.size() < INITIAL_PASSWORD_LENGTH) {
			caracteres.add(caracterAleatorio(disponibles));
		}
		Collections.shuffle(caracteres, SECURE_RANDOM);

		StringBuilder password = new StringBuilder(INITIAL_PASSWORD_LENGTH);
		caracteres.forEach(password::append);
		return password.toString();
	}

	private char caracterAleatorio(String caracteres) {
		return caracteres.charAt(SECURE_RANDOM.nextInt(caracteres.length()));
	}

	private void validarPermisoFoto(Usuario actor, Usuario objetivo) {
		if (actor.getGimnasio() == null || objetivo.getGimnasio() == null
				|| !Objects.equals(actor.getGimnasio().getId(), objetivo.getGimnasio().getId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes modificar usuarios de otro gimnasio.");
		}

		if (actor.getRol() == RolUsuario.ADMIN) {
			return;
		}
		if (!Objects.equals(actor.getId(), objetivo.getId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo puedes cambiar tu propia foto.");
		}
		if (actor.getRol() == RolUsuario.CLIENTE
				&& actor.getGimnasio().isClientesPuedenCambiarFotoPerfil()) {
			return;
		}
		if (actor.getRol() == RolUsuario.ENTRENADOR
				&& actor.getGimnasio().isEntrenadoresPuedenCambiarFotoPerfil()) {
			return;
		}

		throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El gimnasio no permite cambiar la foto de perfil.");
	}

	private String validarNombre(String nombre) {
		if (!tieneTexto(nombre)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre es obligatorio.");
		}

		String nombreNormalizado = nombre.trim();
		if (nombreNormalizado.length() < 2 || nombreNormalizado.length() > 80) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre debe tener entre 2 y 80 caracteres.");
		}

		return nombreNormalizado;
	}

	private void validarEmail(String email) {
		if (!tieneTexto(email)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El email es obligatorio.");
		}

		if (email.length() > 120 || !EMAIL_PATTERN.matcher(email).matches()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escribe un email valido.");
		}
	}

	private void validarPasswordNueva(String password) {
		if (!tieneTexto(password)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escribe una contrasena nueva.");
		}

		if (password.length() < 6 || password.length() > 72) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contrasena debe tener entre 6 y 72 caracteres.");
		}
	}

	private String normalizarEmail(String email) {
		return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
	}

	private boolean tieneTexto(String valor) {
		return valor != null && !valor.trim().isEmpty();
	}
}
