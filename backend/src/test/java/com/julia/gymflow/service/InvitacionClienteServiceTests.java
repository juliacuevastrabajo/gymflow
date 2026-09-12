package com.julia.gymflow.service;

import com.julia.gymflow.dto.CaducidadInvitacionCliente;
import com.julia.gymflow.dto.CrearInvitacionClienteRequest;
import com.julia.gymflow.dto.EstadoInvitacionCliente;
import com.julia.gymflow.dto.LoginResponse;
import com.julia.gymflow.dto.RegistroInvitacionClienteRequest;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.InvitacionCliente;
import com.julia.gymflow.entity.Mensaje;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.InvitacionClienteRepository;
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

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvitacionClienteServiceTests {

	private static final String INVITATION_SECRET = "client-invitation-tests-secret-at-least-32";
	private static final String AUTH_HEADER_PREFIX = "Bearer ";

	@Mock
	private InvitacionClienteRepository invitacionRepository;
	@Mock
	private UsuarioRepository usuarioRepository;
	@Mock
	private MensajeRepository mensajeRepository;

	private PasswordService passwordService;
	private AuthTokenService authTokenService;
	private InvitacionTokenService invitacionTokenService;
	private InvitacionClienteService service;
	private Gimnasio gimnasio;
	private Usuario admin;

	@BeforeEach
	void preparar() {
		passwordService = new PasswordService();
		authTokenService = new AuthTokenService("auth-tests-secret-with-at-least-32-characters");
		invitacionTokenService = new InvitacionTokenService(INVITATION_SECRET);
		service = new InvitacionClienteService(
				invitacionRepository,
				usuarioRepository,
				passwordService,
				authTokenService,
				invitacionTokenService,
				new MensajeBienvenidaService(mensajeRepository)
		);
		gimnasio = gimnasio(3L, "UrbanFit");
		admin = usuario(1L, RolUsuario.ADMIN, gimnasio);
	}

	@Test
	void registraClienteActivoConPasswordBcryptYSesion() {
		InvitacionCliente invitacion = invitacionActiva(gimnasio, 1);
		String token = token(invitacion);
		when(invitacionRepository.findByPublicIdForUpdate(invitacion.getPublicId()))
				.thenReturn(Optional.of(invitacion));
		when(usuarioRepository.findByEmail("marta@example.com")).thenReturn(Optional.empty());
		when(invitacionRepository.save(any(InvitacionCliente.class)))
				.thenAnswer(invocation -> invocation.getArgument(0));
		when(usuarioRepository.saveAndFlush(any(Usuario.class))).thenAnswer(invocation -> {
			Usuario usuario = invocation.getArgument(0);
			usuario.setId(22L);
			return usuario;
		});

		LoginResponse response = service.registrar(registro(token, " Marta López ", " MARTA@example.com "));

		ArgumentCaptor<Usuario> usuarioCaptor = ArgumentCaptor.forClass(Usuario.class);
		verify(usuarioRepository).saveAndFlush(usuarioCaptor.capture());
		Usuario guardado = usuarioCaptor.getValue();
		assertEquals(RolUsuario.CLIENTE, guardado.getRol());
		assertTrue(guardado.isActivo());
		assertEquals(gimnasio.getId(), guardado.getGimnasio().getId());
		assertEquals("marta@example.com", guardado.getEmail());
		assertNotEquals("Password8", guardado.getPasswordHash());
		assertTrue(passwordService.matches("Password8", guardado.getPasswordHash()));
		assertTrue(guardado.getFechaAlta() != null);
		assertEquals(1, invitacion.getUsosConsumidos());
		assertEquals(22L, authTokenService.obtenerUsuarioId(AUTH_HEADER_PREFIX + response.getToken()));

		ArgumentCaptor<Mensaje> mensajeCaptor = ArgumentCaptor.forClass(Mensaje.class);
		verify(mensajeRepository, times(1)).save(mensajeCaptor.capture());
		Mensaje bienvenida = mensajeCaptor.getValue();
		assertEquals(22L, bienvenida.getBienvenidaUsuarioId());
		assertEquals(java.util.Set.of(22L), bienvenida.getDestinatarioIds());
		assertFalse(bienvenida.getTexto().contains("Password8"));
		assertFalse(bienvenida.getTexto().contains(token));
	}

	@Test
	void validaInvitacionActiva() {
		InvitacionCliente invitacion = invitacionActiva(gimnasio, 3);
		when(invitacionRepository.findByPublicId(invitacion.getPublicId()))
				.thenReturn(Optional.of(invitacion));

		var response = service.validar(token(invitacion));

		assertTrue(response.isValida());
		assertEquals(EstadoInvitacionCliente.ACTIVA, response.getEstado());
		assertEquals("UrbanFit", response.getNombreGimnasio());
		assertEquals(3, response.getUsosDisponibles());
	}

	@Test
	void tokenManipuladoEsInvalido() {
		InvitacionCliente invitacion = invitacionActiva(gimnasio, 1);
		String token = token(invitacion);
		String manipulado = token.substring(0, token.length() - 1)
				+ (token.endsWith("A") ? "B" : "A");

		var response = service.validar(manipulado);

		assertFalse(response.isValida());
		assertEquals(EstadoInvitacionCliente.INVALIDA, response.getEstado());
	}

	@Test
	void rechazaInvitacionCaducada() {
		InvitacionCliente invitacion = invitacionActiva(gimnasio, 1);
		invitacion.setFechaExpiracion(Instant.now().minusSeconds(60).truncatedTo(ChronoUnit.SECONDS));
		when(invitacionRepository.findByPublicIdForUpdate(invitacion.getPublicId()))
				.thenReturn(Optional.of(invitacion));

		assertStatus(HttpStatus.GONE, () -> service.registrar(
				registro(token(invitacion), "Marta", "marta@example.com")
		));
	}

	@Test
	void rechazaInvitacionRevocada() {
		InvitacionCliente invitacion = invitacionActiva(gimnasio, 1);
		invitacion.setActiva(false);
		invitacion.setFechaRevocacion(Instant.now());
		when(invitacionRepository.findByPublicIdForUpdate(invitacion.getPublicId()))
				.thenReturn(Optional.of(invitacion));

		assertStatus(HttpStatus.GONE, () -> service.registrar(
				registro(token(invitacion), "Marta", "marta@example.com")
		));
	}

	@Test
	void rechazaInvitacionAgotada() {
		InvitacionCliente invitacion = invitacionActiva(gimnasio, 1);
		invitacion.setUsosConsumidos(1);
		when(invitacionRepository.findByPublicIdForUpdate(invitacion.getPublicId()))
				.thenReturn(Optional.of(invitacion));

		assertStatus(HttpStatus.CONFLICT, () -> service.registrar(
				registro(token(invitacion), "Marta", "marta@example.com")
		));
	}

	@Test
	void rechazaEmailDuplicadoSinConsumirUso() {
		InvitacionCliente invitacion = invitacionActiva(gimnasio, 1);
		when(invitacionRepository.findByPublicIdForUpdate(invitacion.getPublicId()))
				.thenReturn(Optional.of(invitacion));
		when(usuarioRepository.findByEmail("marta@example.com"))
				.thenReturn(Optional.of(usuario(9L, RolUsuario.CLIENTE, gimnasio)));

		assertStatus(HttpStatus.CONFLICT, () -> service.registrar(
				registro(token(invitacion), "Marta", "marta@example.com")
		));
		assertEquals(0, invitacion.getUsosConsumidos());
	}

	@Test
	void clienteNoPuedeCrearInvitaciones() {
		Usuario cliente = usuario(4L, RolUsuario.CLIENTE, gimnasio);
		when(usuarioRepository.findById(cliente.getId())).thenReturn(Optional.of(cliente));
		CrearInvitacionClienteRequest request = crearRequest();

		assertStatus(HttpStatus.FORBIDDEN, () -> service.crear(bearer(cliente), request));
	}

	@Test
	void adminNoPuedeRevocarInvitacionDeOtroGimnasio() {
		Gimnasio otroGimnasio = gimnasio(8L, "Otro Gym");
		InvitacionCliente invitacion = invitacionActiva(otroGimnasio, 1);
		invitacion.setId(40L);
		when(usuarioRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
		when(invitacionRepository.findById(40L)).thenReturn(Optional.of(invitacion));

		assertStatus(HttpStatus.FORBIDDEN, () -> service.revocar(bearer(admin), 40L));
	}

	@Test
	void claimsDeOtroGimnasioNoValidanLaInvitacion() {
		InvitacionCliente invitacion = invitacionActiva(gimnasio, 1);
		String tokenOtroGimnasio = invitacionTokenService.crearToken(
				invitacion.getPublicId(),
				99L,
				invitacion.getFechaExpiracion()
		);
		when(invitacionRepository.findByPublicId(invitacion.getPublicId()))
				.thenReturn(Optional.of(invitacion));

		var response = service.validar(tokenOtroGimnasio);

		assertFalse(response.isValida());
		assertEquals(EstadoInvitacionCliente.INVALIDA, response.getEstado());
	}

	private CrearInvitacionClienteRequest crearRequest() {
		CrearInvitacionClienteRequest request = new CrearInvitacionClienteRequest();
		request.setCaducidad(CaducidadInvitacionCliente.DIAS_7);
		request.setLimiteRegistros(10);
		return request;
	}

	private RegistroInvitacionClienteRequest registro(String token, String nombre, String email) {
		RegistroInvitacionClienteRequest request = new RegistroInvitacionClienteRequest();
		request.setToken(token);
		request.setNombre(nombre);
		request.setEmail(email);
		request.setPassword("Password8");
		request.setConfirmarPassword("Password8");
		return request;
	}

	private InvitacionCliente invitacionActiva(Gimnasio gym, int limite) {
		InvitacionCliente invitacion = new InvitacionCliente();
		invitacion.setId(20L);
		invitacion.setPublicId("a0ef3e9f-041a-4605-ac3e-4fd15250852e");
		invitacion.setGimnasio(gym);
		invitacion.setCreadaPor(admin);
		invitacion.setFechaCreacion(Instant.now().truncatedTo(ChronoUnit.SECONDS));
		invitacion.setFechaExpiracion(
				Instant.now().plusSeconds(3600).truncatedTo(ChronoUnit.SECONDS)
		);
		invitacion.setLimiteRegistros(limite);
		invitacion.setUsosConsumidos(0);
		invitacion.setActiva(true);
		return invitacion;
	}

	private String token(InvitacionCliente invitacion) {
		return invitacionTokenService.crearToken(
				invitacion.getPublicId(),
				invitacion.getGimnasio().getId(),
				invitacion.getFechaExpiracion()
		);
	}

	private String bearer(Usuario usuario) {
		return AUTH_HEADER_PREFIX + authTokenService.crearToken(usuario);
	}

	private Usuario usuario(Long id, RolUsuario rol, Gimnasio gym) {
		Usuario usuario = new Usuario();
		usuario.setId(id);
		usuario.setNombre(rol.name());
		usuario.setEmail(rol.name().toLowerCase() + id + "@example.com");
		usuario.setRol(rol);
		usuario.setActivo(true);
		usuario.setGimnasio(gym);
		return usuario;
	}

	private Gimnasio gimnasio(Long id, String nombre) {
		Gimnasio gym = new Gimnasio();
		gym.setId(id);
		gym.setNombre(nombre);
		gym.setActivo(true);
		return gym;
	}

	private void assertStatus(HttpStatus expected, Runnable action) {
		ResponseStatusException error = assertThrows(ResponseStatusException.class, action::run);
		assertEquals(expected, error.getStatusCode());
	}
}
