package com.julia.gymflow.service;

import com.julia.gymflow.dto.CaducidadInvitacionCliente;
import com.julia.gymflow.dto.CrearInvitacionClienteRequest;
import com.julia.gymflow.dto.InvitacionClienteResponse;
import com.julia.gymflow.dto.RegistroInvitacionClienteRequest;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.InvitacionCliente;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.GimnasioRepository;
import com.julia.gymflow.repository.InvitacionClienteRepository;
import com.julia.gymflow.repository.MensajeRepository;
import com.julia.gymflow.repository.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class InvitacionClienteConcurrencyTests {

	@Autowired
	private InvitacionClienteService service;
	@Autowired
	private InvitacionClienteRepository invitacionRepository;
	@Autowired
	private UsuarioRepository usuarioRepository;
	@Autowired
	private GimnasioRepository gimnasioRepository;
	@Autowired
	private MensajeRepository mensajeRepository;
	@Autowired
	private AuthTokenService authTokenService;

	private Usuario admin;

	@BeforeEach
	void preparar() {
		limpiar();
		Gimnasio gimnasio = new Gimnasio();
		gimnasio.setNombre("UrbanFit concurrencia");
		gimnasio.setSlug("urbanfit-concurrencia");
		gimnasio.setActivo(true);
		gimnasio = gimnasioRepository.saveAndFlush(gimnasio);

		admin = new Usuario();
		admin.setNombre("Admin test");
		admin.setEmail("admin-concurrencia@example.com");
		admin.setPasswordHash(new PasswordService().hash("Password8"));
		admin.setRol(RolUsuario.ADMIN);
		admin.setActivo(true);
		admin.setGimnasio(gimnasio);
		admin = usuarioRepository.saveAndFlush(admin);
	}

	@AfterEach
	void terminar() {
		limpiar();
	}

	@Test
	void dosRegistrosSimultaneosNoConsumenDosVecesLaUltimaPlaza() throws Exception {
		CrearInvitacionClienteRequest createRequest = new CrearInvitacionClienteRequest();
		createRequest.setCaducidad(CaducidadInvitacionCliente.HORAS_24);
		createRequest.setLimiteRegistros(1);
		InvitacionClienteResponse invitation = service.crear(
				"Bearer " + authTokenService.crearToken(admin),
				createRequest
		);

		ExecutorService executor = Executors.newFixedThreadPool(2);
		CountDownLatch ready = new CountDownLatch(2);
		CountDownLatch start = new CountDownLatch(1);
		try {
			Future<Boolean> first = executor.submit(attempt(ready, start, invitation.getToken(), "one@example.com"));
			Future<Boolean> second = executor.submit(attempt(ready, start, invitation.getToken(), "two@example.com"));
			assertTrue(ready.await(5, TimeUnit.SECONDS));
			start.countDown();

			int successes = (first.get(10, TimeUnit.SECONDS) ? 1 : 0)
					+ (second.get(10, TimeUnit.SECONDS) ? 1 : 0);
			assertEquals(1, successes);
		} finally {
			executor.shutdownNow();
		}

		InvitacionCliente persisted = invitacionRepository
				.findByPublicId(invitation.getPublicId())
				.orElseThrow();
		assertEquals(1, persisted.getUsosConsumidos());
		List<Usuario> users = usuarioRepository.findByGimnasioId(admin.getGimnasio().getId());
		assertEquals(1, users.stream().filter(user -> user.getRol() == RolUsuario.CLIENTE).count());
	}

	private Callable<Boolean> attempt(
			CountDownLatch ready,
			CountDownLatch start,
			String token,
			String email
	) {
		return () -> {
			ready.countDown();
			start.await(5, TimeUnit.SECONDS);
			RegistroInvitacionClienteRequest request = new RegistroInvitacionClienteRequest();
			request.setToken(token);
			request.setNombre("Cliente concurrente");
			request.setEmail(email);
			request.setPassword("Password8");
			request.setConfirmarPassword("Password8");
			try {
				service.registrar(request);
				return true;
			} catch (ResponseStatusException error) {
				return false;
			}
		};
	}

	private void limpiar() {
		invitacionRepository.deleteAll();
		mensajeRepository.deleteAll();
		usuarioRepository.deleteAll();
		gimnasioRepository.deleteAll();
	}
}
