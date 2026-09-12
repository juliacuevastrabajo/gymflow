package com.julia.gymflow.service;

import com.julia.gymflow.controller.UsuarioController;
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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UsuarioEndpointSecurityTests {

	@Mock
	private UsuarioRepository usuarioRepository;
	@Mock
	private GimnasioRepository gimnasioRepository;
	@Mock
	private MensajeRepository mensajeRepository;
	@Mock
	private ArchivoAsociacionService archivoAsociacionService;
	@Mock
	private ArchivoReferenciaService archivoReferenciaService;

	private AuthTokenService authTokenService;
	private MockMvc mockMvc;
	private Usuario admin;

	@BeforeEach
	void preparar() {
		authTokenService = new AuthTokenService("usuario-endpoint-tests-secret-with-32-characters");
		UsuarioService usuarioService = new UsuarioService(
				usuarioRepository,
				gimnasioRepository,
				new MensajeBienvenidaService(mensajeRepository),
				new PasswordService(),
				authTokenService,
				archivoAsociacionService,
				archivoReferenciaService
		);
		mockMvc = MockMvcBuilders.standaloneSetup(new UsuarioController(usuarioService)).build();
		admin = usuario(1L, RolUsuario.ADMIN, true);
	}

	@Test
	void listadoSinTokenEsUnauthorized() throws Exception {
		mockMvc.perform(get("/api/usuarios"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void altaSinTokenEsUnauthorized() throws Exception {
		mockMvc.perform(post("/api/usuarios")
						.contentType(MediaType.APPLICATION_JSON)
						.content(requestJson("CLIENTE")))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void bajaSinTokenEsUnauthorized() throws Exception {
		mockMvc.perform(delete("/api/usuarios/10"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void tokenInvalidoEsUnauthorized() throws Exception {
		mockMvc.perform(get("/api/usuarios").header("Authorization", "Bearer invalido"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void adminCreaCuentaSinExponerHash() throws Exception {
		when(usuarioRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
		when(usuarioRepository.findByEmail("nueva@gymflow.test")).thenReturn(Optional.empty());
		when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> {
			Usuario usuario = invocation.getArgument(0);
			usuario.setId(10L);
			return usuario;
		});
		when(mensajeRepository.save(any(Mensaje.class))).thenAnswer(invocation -> invocation.getArgument(0));

		mockMvc.perform(post("/api/usuarios")
						.header("Authorization", bearer(admin))
						.contentType(MediaType.APPLICATION_JSON)
						.content(requestJson("CLIENTE")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.usuario.id").value(10))
				.andExpect(jsonPath("$.usuario.gimnasioId").value(3))
				.andExpect(jsonPath("$.usuario.passwordHash").doesNotExist())
				.andExpect(jsonPath("$.passwordInicial").isString());
	}

	@Test
	void listadoAutenticadoSoloDevuelveRepositorioDelGimnasio() throws Exception {
		Usuario cliente = usuario(10L, RolUsuario.CLIENTE, true);
		when(usuarioRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
		when(usuarioRepository.findByGimnasioId(3L)).thenReturn(List.of(admin, cliente));

		mockMvc.perform(get("/api/usuarios").header("Authorization", bearer(admin)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(2))
				.andExpect(jsonPath("$[1].id").value(10));
	}

	private String requestJson(String rol) {
		return """
				{
				  "nombre": "Nueva Persona",
				  "email": "nueva@gymflow.test",
				  "fotoPerfilUrl": "/uploads/nueva.jpg",
				  "rol": "%s"
				}
				""".formatted(rol);
	}

	private String bearer(Usuario usuario) {
		return "Bearer " + authTokenService.crearToken(usuario);
	}

	private Usuario usuario(Long id, RolUsuario rol, boolean activo) {
		Gimnasio gimnasio = new Gimnasio();
		gimnasio.setId(3L);
		gimnasio.setNombre("UrbanFit");
		Usuario usuario = new Usuario();
		usuario.setId(id);
		usuario.setNombre(rol.name());
		usuario.setEmail(rol.name().toLowerCase() + id + "@gymflow.test");
		usuario.setRol(rol);
		usuario.setActivo(activo);
		usuario.setGimnasio(gimnasio);
		return usuario;
	}
}
