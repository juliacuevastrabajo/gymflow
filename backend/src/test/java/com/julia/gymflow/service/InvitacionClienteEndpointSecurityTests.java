package com.julia.gymflow.service;

import com.julia.gymflow.controller.InvitacionClienteController;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.InvitacionClienteRepository;
import com.julia.gymflow.repository.MensajeRepository;
import com.julia.gymflow.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class InvitacionClienteEndpointSecurityTests {

	@Mock
	private InvitacionClienteRepository invitacionRepository;
	@Mock
	private UsuarioRepository usuarioRepository;
	@Mock
	private MensajeRepository mensajeRepository;

	private MockMvc mockMvc;
	private AuthTokenService authTokenService;

	@BeforeEach
	void preparar() {
		authTokenService = new AuthTokenService("invitation-endpoint-auth-secret-with-32-characters");
		InvitacionClienteService service = new InvitacionClienteService(
				invitacionRepository,
				usuarioRepository,
				new PasswordService(),
				authTokenService,
				new InvitacionTokenService("invitation-endpoint-token-secret-at-least-32"),
				new MensajeBienvenidaService(mensajeRepository)
		);
		mockMvc = MockMvcBuilders
				.standaloneSetup(new InvitacionClienteController(service))
				.build();
	}

	@Test
	void crearSinSesionEsUnauthorized() throws Exception {
		mockMvc.perform(post("/api/invitaciones-clientes")
						.contentType(MediaType.APPLICATION_JSON)
						.content(crearJson()))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void listarSinSesionEsUnauthorized() throws Exception {
		mockMvc.perform(get("/api/invitaciones-clientes"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void revocarSinSesionEsUnauthorized() throws Exception {
		mockMvc.perform(post("/api/invitaciones-clientes/4/revocar"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void entrenadorAutenticadoNoPuedeGestionarInvitaciones() throws Exception {
		Usuario entrenador = usuario(4L, RolUsuario.ENTRENADOR);
		when(usuarioRepository.findById(entrenador.getId())).thenReturn(Optional.of(entrenador));

		mockMvc.perform(get("/api/invitaciones-clientes")
						.header("Authorization", "Bearer " + authTokenService.crearToken(entrenador)))
				.andExpect(status().isForbidden());
	}

	private String crearJson() {
		return """
				{
				  "caducidad": "DIAS_7",
				  "limiteRegistros": 10
				}
				""";
	}

	private Usuario usuario(Long id, RolUsuario rol) {
		Gimnasio gimnasio = new Gimnasio();
		gimnasio.setId(3L);
		gimnasio.setNombre("UrbanFit");
		gimnasio.setActivo(true);

		Usuario usuario = new Usuario();
		usuario.setId(id);
		usuario.setNombre("Entrenador");
		usuario.setEmail("entrenador@example.com");
		usuario.setRol(rol);
		usuario.setActivo(true);
		usuario.setGimnasio(gimnasio);
		return usuario;
	}
}
