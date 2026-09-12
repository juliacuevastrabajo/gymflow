package com.julia.gymflow.service;

import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.julia.gymflow.dto.ActualizarGimnasioRequest;
import com.julia.gymflow.dto.GimnasioResponse;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.FinalidadArchivo;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.GimnasioRepository;
import com.julia.gymflow.repository.UsuarioRepository;

import java.util.List;
import java.util.Objects;
import java.util.regex.Pattern;

@Service
public class GimnasioService {
	private static final Pattern HEX_COLOR = Pattern.compile("^#[0-9A-Fa-f]{6}$");

	private final GimnasioRepository gimnasioRepository;
	private final UsuarioRepository usuarioRepository;
	private final AuthTokenService authTokenService;
	private final ArchivoAsociacionService archivoAsociacionService;
	private final ArchivoReferenciaService archivoReferenciaService;

	public GimnasioService(
			GimnasioRepository gimnasioRepository,
			UsuarioRepository usuarioRepository,
			AuthTokenService authTokenService,
			ArchivoAsociacionService archivoAsociacionService,
			ArchivoReferenciaService archivoReferenciaService
	) {
		this.gimnasioRepository = gimnasioRepository;
		this.usuarioRepository = usuarioRepository;
		this.authTokenService = authTokenService;
		this.archivoAsociacionService = archivoAsociacionService;
		this.archivoReferenciaService = archivoReferenciaService;
	}

	@Transactional(readOnly = true)
	public List<GimnasioResponse> listarGimnasios(String authorizationHeader) {
		return List.of(obtenerMiGimnasio(authorizationHeader));
	}

	@Transactional(readOnly = true)
	public GimnasioResponse obtenerMiGimnasio(String authorizationHeader) {
		Usuario actor = obtenerActorActivo(authorizationHeader);
		return new GimnasioResponse(actor.getGimnasio());
	}

	@Transactional(readOnly = true)
	public GimnasioResponse buscarPorId(String authorizationHeader, Long id) {
		Usuario actor = obtenerActorActivo(authorizationHeader);
		if (!Objects.equals(actor.getGimnasio().getId(), id)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes consultar otro gimnasio.");
		}
		return new GimnasioResponse(actor.getGimnasio());
	}

	public GimnasioResponse crearGimnasio(String authorizationHeader) {
		obtenerActorActivo(authorizationHeader);
		throw new ResponseStatusException(
				HttpStatus.FORBIDDEN,
				"El alta de gimnasios no esta disponible desde la aplicacion."
		);
	}

	@Transactional
	public GimnasioResponse actualizarGimnasio(
			String authorizationHeader,
			Long id,
			ActualizarGimnasioRequest request
	) {
		Usuario actor = obtenerActorActivo(authorizationHeader);
		validarAdministradorActivo(actor);
		if (actor.getGimnasio() == null || !Objects.equals(actor.getGimnasio().getId(), id)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes modificar otro gimnasio.");
		}
		if (request == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los datos de configuración son obligatorios.");
		}

		Gimnasio gimnasio = gimnasioRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gimnasio no encontrado."));
		String imagenAnterior = gimnasio.getImagenFondoUrl();

		if (request.getNombre() != null) {
			gimnasio.setNombre(validarNombre(request.getNombre()));
		}
		if (request.getTextoBienvenida() != null) {
			gimnasio.setTextoBienvenida(limpiarTextoOpcional(request.getTextoBienvenida(), 500, "texto de bienvenida"));
		}
		if (request.getImagenFondoUrl() != null) {
			gimnasio.setImagenFondoUrl(archivoAsociacionService.asociarImagen(
					request.getImagenFondoUrl(),
					gimnasio.getImagenFondoUrl(),
					FinalidadArchivo.FONDO_GIMNASIO,
					actor,
					gimnasio
			));
		}
		if (request.getColorPrimario() != null) {
			gimnasio.setColorPrimario(validarColor(request.getColorPrimario(), "principal"));
		}
		if (request.getColorSecundario() != null) {
			gimnasio.setColorSecundario(validarColor(request.getColorSecundario(), "secundario"));
		}
		if (request.getMensajesUsuariosPermitidos() != null) {
			gimnasio.setMensajesUsuariosPermitidos(request.getMensajesUsuariosPermitidos());
		}
		if (request.getClientesPuedenCambiarFotoPerfil() != null) {
			gimnasio.setClientesPuedenCambiarFotoPerfil(request.getClientesPuedenCambiarFotoPerfil());
		}
		if (request.getEntrenadoresPuedenCambiarFotoPerfil() != null) {
			gimnasio.setEntrenadoresPuedenCambiarFotoPerfil(request.getEntrenadoresPuedenCambiarFotoPerfil());
		}

		Gimnasio guardado = gimnasioRepository.save(gimnasio);
		if (!Objects.equals(imagenAnterior, gimnasio.getImagenFondoUrl())) {
			archivoReferenciaService.liberarSiNoReferenciado(imagenAnterior);
		}
		return new GimnasioResponse(guardado);
	}

	public void eliminarGimnasio(String authorizationHeader, Long id) {
		obtenerActorActivo(authorizationHeader);
		throw new ResponseStatusException(
				HttpStatus.FORBIDDEN,
				"La eliminacion de gimnasios no esta disponible desde la aplicacion."
		);
	}

	private Usuario obtenerUsuarioAutenticado(String authorizationHeader) {
		Long usuarioId = authTokenService.obtenerUsuarioId(authorizationHeader);
		return usuarioRepository.findById(usuarioId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesión no válida."));
	}

	private Usuario obtenerActorActivo(String authorizationHeader) {
		Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
		if (!actor.isActivo()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La cuenta no esta activa.");
		}
		if (actor.getGimnasio() == null || !actor.getGimnasio().isActivo()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La cuenta no pertenece a un gimnasio activo.");
		}
		return actor;
	}

	private void validarAdministradorActivo(Usuario actor) {
		if (!actor.isActivo() || actor.getRol() != RolUsuario.ADMIN
				|| actor.getGimnasio() == null || !actor.getGimnasio().isActivo()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo un administrador activo puede modificar la configuración.");
		}
	}

	private String validarNombre(String nombre) {
		String limpio = nombre == null ? "" : nombre.trim();
		if (limpio.length() < 2 || limpio.length() > 100) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre debe tener entre 2 y 100 caracteres.");
		}
		return limpio;
	}

	private String validarColor(String color, String tipo) {
		String limpio = color == null ? "" : color.trim().toUpperCase();
		if (!HEX_COLOR.matcher(limpio).matches()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El color " + tipo + " no es válido.");
		}
		return limpio;
	}

	private String limpiarTextoOpcional(String valor, int maximo, String campo) {
		String limpio = valor == null ? "" : valor.trim();
		if (limpio.length() > maximo) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El " + campo + " supera " + maximo + " caracteres.");
		}
		return limpio.isEmpty() ? null : limpio;
	}
}
