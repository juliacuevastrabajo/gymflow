package com.julia.gymflow.service;

import com.julia.gymflow.controller.ArchivoController;
import com.julia.gymflow.controller.ArchivoExceptionHandler;
import com.julia.gymflow.dto.ArchivoSubidoResponse;
import com.julia.gymflow.entity.ArchivoSubido;
import com.julia.gymflow.entity.EstadoArchivoSubido;
import com.julia.gymflow.entity.FinalidadArchivo;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.TipoArchivoSubido;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.ArchivoSubidoRepository;
import com.julia.gymflow.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ArchivoServiceTests {

    @TempDir
    Path temporal;

    private ArchivoSubidoRepository archivoRepository;
    private UsuarioRepository usuarioRepository;
    private AuthTokenService authTokenService;
    private ArchivoService service;
    private Gimnasio gimnasio;
    private Usuario admin;

    @BeforeEach
    void preparar() {
        archivoRepository = mock(ArchivoSubidoRepository.class);
        usuarioRepository = mock(UsuarioRepository.class);
        authTokenService = mock(AuthTokenService.class);
        service = new ArchivoService(temporal.toString(), archivoRepository, usuarioRepository, authTokenService);
        gimnasio = gimnasio(1L);
        admin = usuario(1L, RolUsuario.ADMIN, gimnasio);
        autenticar(admin);
        when(archivoRepository.save(any(ArchivoSubido.class))).thenAnswer(invocacion -> invocacion.getArgument(0));
    }

    @Test
    void endpointSinTokenDevuelveUnauthorized() throws Exception {
        when(authTokenService.obtenerUsuarioId(null))
                .thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion no valida."));
        MockMvc mvc = MockMvcBuilders
                .standaloneSetup(new ArchivoController(service))
                .setControllerAdvice(new ArchivoExceptionHandler())
                .build();

        mvc.perform(post("/api/archivos/imagenes"))
                .andExpect(status().isUnauthorized());
    }

    @ParameterizedTest
    @MethodSource("formatosValidos")
    void aceptaFormatosPermitidosYGeneraNombreFisico(
            String nombre,
            String mime,
            byte[] contenido,
            boolean multimedia,
            TipoArchivoSubido tipoEsperado
    ) throws Exception {
        ArchivoSubidoResponse response = multimedia
                ? service.guardarMultimedia("Bearer token", archivo(nombre, mime, contenido), FinalidadArchivo.MULTIMEDIA_EJERCICIO)
                : service.guardarImagen("Bearer token", archivo(nombre, mime, contenido), FinalidadArchivo.FOTO_PERFIL, admin.getId());

        ArgumentCaptor<ArchivoSubido> captor = ArgumentCaptor.forClass(ArchivoSubido.class);
        verify(archivoRepository).save(captor.capture());
        ArchivoSubido guardado = captor.getValue();
        assertEquals(tipoEsperado, guardado.getTipo());
        assertEquals(EstadoArchivoSubido.TEMPORAL, guardado.getEstado());
        assertEquals(gimnasio.getId(), guardado.getGimnasio().getId());
        assertEquals(admin.getId(), guardado.getSubidoPor().getId());
        assertFalse(guardado.getNombreFisico().contains(nombre));
        assertTrue(guardado.getUrl().startsWith("/uploads/"));
        assertTrue(response.isTemporal());
        assertTrue(Files.exists(temporal.resolve(guardado.getNombreFisico())));
        assertNotEquals(nombre, guardado.getNombreFisico());
    }

    @Test
    void rechazaArchivoVacioMimeFalsoYEjecutableRenombrado() {
        ResponseStatusException vacio = assertThrows(ResponseStatusException.class,
                () -> service.guardarImagen("Bearer token", archivo("vacio.png", "image/png", new byte[0]),
                        FinalidadArchivo.FOTO_PERFIL, admin.getId()));
        assertEquals(HttpStatus.BAD_REQUEST, vacio.getStatusCode());

        ResponseStatusException mimeFalso = assertThrows(ResponseStatusException.class,
                () -> service.guardarImagen("Bearer token", archivo("foto.png", "image/png", jpeg()),
                        FinalidadArchivo.FOTO_PERFIL, admin.getId()));
        assertEquals(HttpStatus.BAD_REQUEST, mimeFalso.getStatusCode());

        ResponseStatusException ejecutable = assertThrows(ResponseStatusException.class,
                () -> service.guardarImagen("Bearer token",
                        archivo("foto.jpg", "image/jpeg", "MZ ejecutable".getBytes(StandardCharsets.US_ASCII)),
                        FinalidadArchivo.FOTO_PERFIL, admin.getId()));
        assertEquals(HttpStatus.BAD_REQUEST, ejecutable.getStatusCode());
    }

    @Test
    void rechazaTamanoExcesivoAntesDeEscribir() throws Exception {
        MultipartFile enorme = mock(MultipartFile.class);
        when(enorme.isEmpty()).thenReturn(false);
        when(enorme.getSize()).thenReturn(ArchivoService.TAMANO_MAXIMO_IMAGEN + 1);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.guardarImagen("Bearer token", enorme, FinalidadArchivo.FOTO_PERFIL, admin.getId()));

        assertEquals(HttpStatus.PAYLOAD_TOO_LARGE, error.getStatusCode());
        assertEquals(0, Files.list(temporal.resolve(".tmp")).count());
    }

    @Test
    void aplicaPermisosDeRolFinalidadYGimnasio() {
        Usuario cliente = usuario(2L, RolUsuario.CLIENTE, gimnasio);
        gimnasio.setClientesPuedenCambiarFotoPerfil(false);
        autenticar(cliente);
        ResponseStatusException sinPermiso = assertThrows(ResponseStatusException.class,
                () -> service.guardarImagen("Bearer token", archivo("foto.jpg", "image/jpeg", jpeg()),
                        FinalidadArchivo.FOTO_PERFIL, cliente.getId()));
        assertEquals(HttpStatus.FORBIDDEN, sinPermiso.getStatusCode());

        ResponseStatusException finalidadAdmin = assertThrows(ResponseStatusException.class,
                () -> service.guardarImagen("Bearer token", archivo("fondo.jpg", "image/jpeg", jpeg()),
                        FinalidadArchivo.FONDO_GIMNASIO, null));
        assertEquals(HttpStatus.FORBIDDEN, finalidadAdmin.getStatusCode());

        autenticar(admin);
        Usuario externo = usuario(9L, RolUsuario.CLIENTE, gimnasio(2L));
        when(usuarioRepository.findById(externo.getId())).thenReturn(Optional.of(externo));
        ResponseStatusException otroGimnasio = assertThrows(ResponseStatusException.class,
                () -> service.guardarImagen("Bearer token", archivo("foto.jpg", "image/jpeg", jpeg()),
                        FinalidadArchivo.FOTO_PERFIL, externo.getId()));
        assertEquals(HttpStatus.FORBIDDEN, otroGimnasio.getStatusCode());
    }

    @Test
    void adminNoPuedeSubirFotoParaOtroAdministrador() {
        Usuario otroAdmin = usuario(3L, RolUsuario.ADMIN, gimnasio);
        when(usuarioRepository.findById(otroAdmin.getId())).thenReturn(Optional.of(otroAdmin));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.guardarImagen("Bearer token", archivo("foto.jpg", "image/jpeg", jpeg()),
                        FinalidadArchivo.FOTO_PERFIL, otroAdmin.getId()));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
    }

    @Test
    void limitaRafagaDeSubidas() {
        for (int i = 0; i < 30; i++) {
            service.guardarImagen("Bearer token", archivo("foto.jpg", "image/jpeg", jpeg()),
                    FinalidadArchivo.FOTO_PERFIL, admin.getId());
        }

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.guardarImagen("Bearer token", archivo("foto.jpg", "image/jpeg", jpeg()),
                        FinalidadArchivo.FOTO_PERFIL, admin.getId()));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, error.getStatusCode());
    }

    private void autenticar(Usuario actor) {
        when(authTokenService.obtenerUsuarioId("Bearer token")).thenReturn(actor.getId());
        when(usuarioRepository.findById(actor.getId())).thenReturn(Optional.of(actor));
    }

    private static Stream<Arguments> formatosValidos() {
        return Stream.of(
                Arguments.of("original.jpg", "image/jpeg", jpeg(), false, TipoArchivoSubido.IMAGEN),
                Arguments.of("original.png", "image/png", png(), false, TipoArchivoSubido.IMAGEN),
                Arguments.of("original.webp", "image/webp", webp(), false, TipoArchivoSubido.IMAGEN),
                Arguments.of("original.mp4", "video/mp4", isoVideo("isom"), true, TipoArchivoSubido.VIDEO),
                Arguments.of("original.mov", "video/quicktime", isoVideo("qt  "), true, TipoArchivoSubido.VIDEO),
                Arguments.of("original.webm", "video/webm", webm(), true, TipoArchivoSubido.VIDEO)
        );
    }

    private static MockMultipartFile archivo(String nombre, String mime, byte[] contenido) {
        return new MockMultipartFile("archivo", nombre, mime, contenido);
    }

    private static byte[] jpeg() {
        return new byte[]{(byte) 0xff, (byte) 0xd8, (byte) 0xff, (byte) 0xe0, 1, 2, (byte) 0xff, (byte) 0xd9};
    }

    private static byte[] png() {
        byte[] contenido = new byte[32];
        byte[] firma = new byte[]{(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
        System.arraycopy(firma, 0, contenido, 0, firma.length);
        System.arraycopy("IHDR".getBytes(StandardCharsets.US_ASCII), 0, contenido, 12, 4);
        System.arraycopy("IEND".getBytes(StandardCharsets.US_ASCII), 0, contenido, 24, 4);
        return contenido;
    }

    private static byte[] webp() {
        byte[] contenido = new byte[20];
        System.arraycopy("RIFF".getBytes(StandardCharsets.US_ASCII), 0, contenido, 0, 4);
        ByteBuffer.wrap(contenido, 4, 4).order(ByteOrder.LITTLE_ENDIAN).putInt(12);
        System.arraycopy("WEBPVP8X".getBytes(StandardCharsets.US_ASCII), 0, contenido, 8, 8);
        return contenido;
    }

    private static byte[] isoVideo(String marca) {
        byte[] contenido = new byte[20];
        ByteBuffer.wrap(contenido, 0, 4).order(ByteOrder.BIG_ENDIAN).putInt(20);
        System.arraycopy("ftyp".getBytes(StandardCharsets.US_ASCII), 0, contenido, 4, 4);
        System.arraycopy(marca.getBytes(StandardCharsets.US_ASCII), 0, contenido, 8, 4);
        return contenido;
    }

    private static byte[] webm() {
        byte[] contenido = new byte[20];
        contenido[0] = 0x1a;
        contenido[1] = 0x45;
        contenido[2] = (byte) 0xdf;
        contenido[3] = (byte) 0xa3;
        System.arraycopy("webm".getBytes(StandardCharsets.US_ASCII), 0, contenido, 8, 4);
        return contenido;
    }

    private static Gimnasio gimnasio(Long id) {
        Gimnasio gimnasio = new Gimnasio();
        gimnasio.setId(id);
        gimnasio.setNombre("Gym " + id);
        gimnasio.setActivo(true);
        return gimnasio;
    }

    private static Usuario usuario(Long id, RolUsuario rol, Gimnasio gimnasio) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setNombre(rol.name());
        usuario.setEmail(rol.name().toLowerCase() + id + "@gymflow.test");
        usuario.setRol(rol);
        usuario.setGimnasio(gimnasio);
        usuario.setActivo(true);
        return usuario;
    }
}
