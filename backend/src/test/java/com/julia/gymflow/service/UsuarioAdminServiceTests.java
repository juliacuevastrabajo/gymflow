package com.julia.gymflow.service;

import com.julia.gymflow.dto.CrearUsuarioAdminRequest;
import com.julia.gymflow.dto.CrearUsuarioAdminResponse;
import com.julia.gymflow.dto.LoginRequest;
import com.julia.gymflow.dto.UsuarioResponse;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.Mensaje;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.GimnasioRepository;
import com.julia.gymflow.repository.MensajeRepository;
import com.julia.gymflow.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.Arrays;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioAdminServiceTests {

	private static final String TOKEN = "Bearer token-valido";

	@Mock
	private UsuarioRepository usuarioRepository;
	@Mock
	private GimnasioRepository gimnasioRepository;
	@Mock
	private MensajeRepository mensajeRepository;
	@Mock
	private AuthTokenService authTokenService;
	@Mock
	private ArchivoAsociacionService archivoAsociacionService;
	@Mock
	private ArchivoReferenciaService archivoReferenciaService;

	private final PasswordService passwordService = new PasswordService();
	private UsuarioService usuarioService;
	private Gimnasio gimnasioUno;
	private Gimnasio gimnasioDos;
	private Usuario admin;

	@BeforeEach
	void preparar() {
		usuarioService = new UsuarioService(
				usuarioRepository,
				gimnasioRepository,
				new MensajeBienvenidaService(mensajeRepository),
				passwordService,
				authTokenService,
				archivoAsociacionService,
				archivoReferenciaService
		);
		org.mockito.Mockito.lenient()
				.when(archivoAsociacionService.asociarImagen(
						org.mockito.ArgumentMatchers.nullable(String.class),
						org.mockito.ArgumentMatchers.nullable(String.class),
						any(), any(), any()))
				.thenAnswer(invocacion -> {
					String url = invocacion.getArgument(0);
					if (url == null || url.trim().isEmpty()) return null;
					if (url.length() > 2048) {
						throw new org.springframework.web.server.ResponseStatusException(
								org.springframework.http.HttpStatus.BAD_REQUEST,
								"Referencia demasiado larga."
						);
					}
					return url;
				});
		gimnasioUno = gimnasio(1L, "UrbanFit");
		gimnasioDos = gimnasio(2L, "Otro Gym");
		admin = usuario(1L, RolUsuario.ADMIN, gimnasioUno, true);
	}

	@Test
	void adminCreaClienteEnSuGimnasio() {
		CrearUsuarioAdminResponse response = crearCorrectamente(RolUsuario.CLIENTE);

		assertEquals(RolUsuario.CLIENTE, response.getUsuario().getRol());
		assertEquals(gimnasioUno.getId(), response.getUsuario().getGimnasioId());
	}

	@Test
	void adminCreaEntrenadorEnSuGimnasio() {
		CrearUsuarioAdminResponse response = crearCorrectamente(RolUsuario.ENTRENADOR);

		assertEquals(RolUsuario.ENTRENADOR, response.getUsuario().getRol());
		assertEquals(gimnasioUno.getId(), response.getUsuario().getGimnasioId());
	}

	@Test
	void passwordInicialCumpleRequisitos() {
		String password = crearCorrectamente(RolUsuario.CLIENTE).getPasswordInicial();

		assertTrue(password.length() >= 12 && password.length() <= 16);
		assertTrue(password.matches(".*[A-Z].*"));
		assertTrue(password.matches(".*[a-z].*"));
		assertTrue(password.matches(".*[0-9].*"));
		assertTrue(password.matches(".*[!@#$%*].*"));
	}

	@Test
	void soloSePersisteHashBcrypt() {
		CrearUsuarioAdminResponse response = crearCorrectamente(RolUsuario.CLIENTE);
		Usuario guardado = capturarUsuarioGuardado();

		assertTrue(guardado.getPasswordHash().matches("^\\$2[aby]\\$\\d{2}\\$.{53}$"));
		assertNotEquals(response.getPasswordInicial(), guardado.getPasswordHash());
	}

	@Test
	void passwordInicialPermiteAutenticar() {
		CrearUsuarioAdminResponse response = crearCorrectamente(RolUsuario.CLIENTE);
		Usuario guardado = capturarUsuarioGuardado();
		AuthTokenService tokens = org.mockito.Mockito.mock(AuthTokenService.class);
		when(usuarioRepository.findByEmail(guardado.getEmail())).thenReturn(Optional.of(guardado));
		when(tokens.crearToken(guardado)).thenReturn("token-sesion");
		AuthService authService = new AuthService(usuarioRepository, passwordService, tokens);
		LoginRequest login = new LoginRequest();
		login.setEmail(guardado.getEmail());
		login.setPassword(response.getPasswordInicial());

		assertEquals("token-sesion", authService.login(login).getToken());
	}

	@Test
	void usuarioResponseNuncaExponeHash() {
		UsuarioResponse response = crearCorrectamente(RolUsuario.CLIENTE).getUsuario();
		List<String> metodos = Arrays.stream(response.getClass().getDeclaredMethods())
				.map(java.lang.reflect.Method::getName)
				.map(String::toLowerCase)
				.toList();

		assertFalse(metodos.stream().anyMatch(nombre -> nombre.contains("password")));
		assertFalse(metodos.stream().anyMatch(nombre -> nombre.contains("hash")));
	}

	@Test
	void crearSinTokenDevuelveUnauthorized() {
		rechazarAutenticacion(null, HttpStatus.UNAUTHORIZED);

		assertStatus(HttpStatus.UNAUTHORIZED, () -> usuarioService.crearUsuario(null, request(RolUsuario.CLIENTE)));
	}

	@Test
	void crearConTokenInvalidoDevuelveUnauthorized() {
		rechazarAutenticacion("Bearer invalido", HttpStatus.UNAUTHORIZED);

		assertStatus(HttpStatus.UNAUTHORIZED, () -> usuarioService.crearUsuario("Bearer invalido", request(RolUsuario.CLIENTE)));
	}

	@Test
	void clienteNoPuedeCrearUsuarios() {
		autenticar(usuario(2L, RolUsuario.CLIENTE, gimnasioUno, true));

		assertStatus(HttpStatus.FORBIDDEN, () -> usuarioService.crearUsuario(TOKEN, request(RolUsuario.CLIENTE)));
	}

	@Test
	void entrenadorNoPuedeCrearUsuarios() {
		autenticar(usuario(2L, RolUsuario.ENTRENADOR, gimnasioUno, true));

		assertStatus(HttpStatus.FORBIDDEN, () -> usuarioService.crearUsuario(TOKEN, request(RolUsuario.CLIENTE)));
	}

	@Test
	void adminInactivoNoPuedeCrearUsuarios() {
		admin.setActivo(false);
		autenticar(admin);

		assertStatus(HttpStatus.FORBIDDEN, () -> usuarioService.crearUsuario(TOKEN, request(RolUsuario.CLIENTE)));
	}

	@Test
	void noSePuedeCrearOtroAdmin() {
		autenticar(admin);

		assertStatus(HttpStatus.BAD_REQUEST, () -> usuarioService.crearUsuario(TOKEN, request(RolUsuario.ADMIN)));
	}

	@Test
	void emailDuplicadoDevuelveConflict() {
		autenticar(admin);
		when(usuarioRepository.findByEmail("persona@gymflow.test")).thenReturn(Optional.of(admin));

		assertStatus(HttpStatus.CONFLICT, () -> usuarioService.crearUsuario(TOKEN, request(RolUsuario.CLIENTE)));
	}

	@Test
	void nombreInvalidoDevuelveBadRequest() {
		autenticar(admin);
		CrearUsuarioAdminRequest request = request(RolUsuario.CLIENTE);
		request.setNombre(" ");

		assertStatus(HttpStatus.BAD_REQUEST, () -> usuarioService.crearUsuario(TOKEN, request));
	}

	@Test
	void emailInvalidoDevuelveBadRequest() {
		autenticar(admin);
		CrearUsuarioAdminRequest request = request(RolUsuario.CLIENTE);
		request.setEmail("correo-invalido");

		assertStatus(HttpStatus.BAD_REQUEST, () -> usuarioService.crearUsuario(TOKEN, request));
	}

	@Test
	void fotoDemasiadoLargaDevuelveBadRequest() {
		autenticar(admin);
		CrearUsuarioAdminRequest request = request(RolUsuario.CLIENTE);
		request.setFotoPerfilUrl("x".repeat(2049));

		assertStatus(HttpStatus.BAD_REQUEST, () -> usuarioService.crearUsuario(TOKEN, request));
	}

	@Test
	void gimnasioSiempreProcedeDelActor() {
		CrearUsuarioAdminResponse response = crearCorrectamente(RolUsuario.CLIENTE);
		Usuario guardado = capturarUsuarioGuardado();

		assertEquals(gimnasioUno, guardado.getGimnasio());
		assertEquals(gimnasioUno.getId(), response.getUsuario().getGimnasioId());
	}

	@Test
	void listadoSinTokenDevuelveUnauthorized() {
		rechazarAutenticacion(null, HttpStatus.UNAUTHORIZED);

		assertStatus(HttpStatus.UNAUTHORIZED, () -> usuarioService.listarUsuarios(null));
	}

	@Test
	void listadoSoloConsultaElGimnasioDelActor() {
		autenticar(admin);
		Usuario cliente = usuario(10L, RolUsuario.CLIENTE, gimnasioUno, true);
		when(usuarioRepository.findByGimnasioId(gimnasioUno.getId())).thenReturn(List.of(admin, cliente));

		List<UsuarioResponse> listado = usuarioService.listarUsuarios(TOKEN);

		assertEquals(List.of(1L, 10L), listado.stream().map(UsuarioResponse::getId).toList());
		verify(usuarioRepository).findByGimnasioId(gimnasioUno.getId());
		verify(usuarioRepository, never()).findAll();
	}

	@Test
	void desactivacionSinTokenDevuelveUnauthorized() {
		rechazarAutenticacion(null, HttpStatus.UNAUTHORIZED);

		assertStatus(HttpStatus.UNAUTHORIZED, () -> usuarioService.desactivarUsuario(null, 10L));
	}

	@Test
	void adminNoDesactivaUsuarioDeOtroGimnasio() {
		autenticar(admin);
		when(usuarioRepository.findById(10L)).thenReturn(Optional.of(usuario(10L, RolUsuario.CLIENTE, gimnasioDos, true)));

		assertStatus(HttpStatus.FORBIDDEN, () -> usuarioService.desactivarUsuario(TOKEN, 10L));
	}

	@Test
	void adminNoDesactivaOtraCuentaAdmin() {
		autenticar(admin);
		when(usuarioRepository.findById(5L)).thenReturn(Optional.of(usuario(5L, RolUsuario.ADMIN, gimnasioUno, true)));

		assertStatus(HttpStatus.FORBIDDEN, () -> usuarioService.desactivarUsuario(TOKEN, 5L));
	}

	@Test
	void adminNoPuedeDesactivarseASiMismo() {
		autenticar(admin);

		assertStatus(HttpStatus.FORBIDDEN, () -> usuarioService.desactivarUsuario(TOKEN, admin.getId()));
	}

	@Test
	void bienvenidaNoContienePassword() {
		CrearUsuarioAdminResponse response = crearCorrectamente(RolUsuario.CLIENTE);
		ArgumentCaptor<Mensaje> captor = ArgumentCaptor.forClass(Mensaje.class);
		verify(mensajeRepository, times(1)).save(captor.capture());

		assertFalse(captor.getValue().getTexto().contains(response.getPasswordInicial()));
		assertEquals(1, captor.getValue().getDestinatarioIds().size());
		assertTrue(captor.getValue().getDestinatarioIds().contains(response.getUsuario().getId()));
		assertTrue(captor.getValue().isDestinatariosMaterializados());
		assertNotNull(captor.getValue().getBienvenidaUsuarioId());
		assertNotNull(capturarUsuarioGuardado().getFechaAlta());
	}

	@Test
	void passwordInicialNoPuedeRecuperarseDesdeListados() {
		CrearUsuarioAdminResponse created = crearCorrectamente(RolUsuario.CLIENTE);
		Usuario guardado = capturarUsuarioGuardado();
		autenticar(admin);
		when(usuarioRepository.findByGimnasioId(gimnasioUno.getId())).thenReturn(List.of(admin, guardado));

		List<UsuarioResponse> listado = usuarioService.listarUsuarios(TOKEN);

		assertEquals(2, listado.size());
		assertFalse(listado.stream().anyMatch(usuario -> created.getPasswordInicial().equals(usuario.getNombre())));
		assertFalse(Arrays.stream(UsuarioResponse.class.getDeclaredMethods())
				.map(java.lang.reflect.Method::getName)
				.map(String::toLowerCase)
				.anyMatch(nombre -> nombre.contains("password") || nombre.contains("hash")));
	}

	@Test
	void rutaDuplicadaDeGimnasioRechazaOtroGimnasio() {
		autenticar(admin);

		assertStatus(HttpStatus.FORBIDDEN, () -> usuarioService.listarUsuariosPorGimnasio(TOKEN, gimnasioDos.getId()));
	}

	private CrearUsuarioAdminResponse crearCorrectamente(RolUsuario rol) {
		autenticar(admin);
		when(usuarioRepository.findByEmail("persona@gymflow.test")).thenReturn(Optional.empty());
		AtomicLong ids = new AtomicLong(20L);
		when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> {
			Usuario usuario = invocation.getArgument(0);
			if (usuario.getId() == null) {
				usuario.setId(ids.getAndIncrement());
			}
			return usuario;
		});
		when(mensajeRepository.save(any(Mensaje.class))).thenAnswer(invocation -> invocation.getArgument(0));

		return usuarioService.crearUsuario(TOKEN, request(rol));
	}

	private Usuario capturarUsuarioGuardado() {
		ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
		verify(usuarioRepository).save(captor.capture());
		return captor.getValue();
	}

	private void autenticar(Usuario actor) {
		when(authTokenService.obtenerUsuarioId(TOKEN)).thenReturn(actor.getId());
		when(usuarioRepository.findById(actor.getId())).thenReturn(Optional.of(actor));
	}

	private void rechazarAutenticacion(String token, HttpStatus status) {
		when(authTokenService.obtenerUsuarioId(token))
				.thenThrow(new ResponseStatusException(status, "Sesión no válida."));
	}

	private CrearUsuarioAdminRequest request(RolUsuario rol) {
		CrearUsuarioAdminRequest request = new CrearUsuarioAdminRequest();
		request.setNombre(" Persona Nueva ");
		request.setEmail(" Persona@GymFlow.test ");
		request.setRol(rol);
		request.setFotoPerfilUrl(" /uploads/persona.jpg ");
		return request;
	}

	private Gimnasio gimnasio(Long id, String nombre) {
		Gimnasio gimnasio = new Gimnasio();
		gimnasio.setId(id);
		gimnasio.setNombre(nombre);
		return gimnasio;
	}

	private Usuario usuario(Long id, RolUsuario rol, Gimnasio gimnasio, boolean activo) {
		Usuario usuario = new Usuario();
		usuario.setId(id);
		usuario.setNombre(rol.name());
		usuario.setEmail(rol.name().toLowerCase() + id + "@gymflow.test");
		usuario.setPasswordHash(passwordService.hash("Password1!"));
		usuario.setRol(rol);
		usuario.setGimnasio(gimnasio);
		usuario.setActivo(activo);
		return usuario;
	}

	private void assertStatus(HttpStatus status, Runnable action) {
		ResponseStatusException error = assertThrows(ResponseStatusException.class, action::run);
		assertEquals(status, error.getStatusCode());
		verify(usuarioRepository, never()).save(any());
	}
}
