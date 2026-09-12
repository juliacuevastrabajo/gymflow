package com.julia.gymflow.service;

import com.julia.gymflow.dto.MensajeRequest;
import com.julia.gymflow.entity.EstadoMensaje;
import com.julia.gymflow.entity.FrecuenciaMensaje;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.Mensaje;
import com.julia.gymflow.entity.PrioridadMensaje;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.TipoAudienciaMensaje;
import com.julia.gymflow.entity.TipoProgramacionMensaje;
import com.julia.gymflow.entity.Usuario;
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

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MensajeServiceTests {

    private static final String TOKEN = "Bearer token";

    @Mock
    private MensajeRepository mensajeRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private AuthTokenService authTokenService;
    @Mock
    private MensajeDestinatarioService destinatarioService;

    private MensajeService service;
    private Gimnasio gimnasio;
    private Usuario admin;
    private Usuario cliente;

    @BeforeEach
    void preparar() {
        service = new MensajeService(
                mensajeRepository,
                usuarioRepository,
                authTokenService,
                destinatarioService
        );
        gimnasio = gimnasio(1L, "UrbanFit");
        admin = usuario(10L, RolUsuario.ADMIN, gimnasio);
        cliente = usuario(20L, RolUsuario.CLIENTE, gimnasio);
    }

    @Test
    void usuarioNuevoNoVeMensajesLegacyAnterioresSinImportarPrioridad() {
        cliente.setFechaAlta(LocalDateTime.of(2026, 8, 18, 12, 0));

        for (PrioridadMensaje prioridad : List.of(
                PrioridadMensaje.NORMAL,
                PrioridadMensaje.IMPORTANTE,
                PrioridadMensaje.URGENTE
        )) {
            Mensaje anterior = mensajeLegacyGeneral(LocalDateTime.of(2026, 8, 18, 11, 59), prioridad);
            assertFalse(service.mensajeEsVisibleParaUsuario(anterior, cliente));
        }
    }

    @Test
    void usuarioLegacyConservaVisibilidadYUsuarioNuevoVeMensajesPosteriores() {
        Mensaje enviado = mensajeLegacyGeneral(LocalDateTime.of(2026, 8, 18, 12, 0), PrioridadMensaje.NORMAL);
        Usuario legacy = usuario(21L, RolUsuario.CLIENTE, gimnasio);
        cliente.setFechaAlta(LocalDateTime.of(2026, 8, 18, 12, 0));

        assertTrue(service.mensajeEsVisibleParaUsuario(enviado, legacy));
        assertTrue(service.mensajeEsVisibleParaUsuario(enviado, cliente));
    }

    @Test
    void envioInmediatoCongelaDestinatariosEIgnoraActorYGimnasioFalsificados() {
        autenticar(admin);
        Usuario clientePosterior = usuario(30L, RolUsuario.CLIENTE, gimnasio);
        when(destinatarioService.resolver(
                eq(gimnasio), eq(TipoAudienciaMensaje.CLIENTES), any(), eq(true)
        )).thenReturn(ids(cliente.getId()));
        when(mensajeRepository.save(any(Mensaje.class))).thenAnswer(invocation -> {
            Mensaje mensaje = invocation.getArgument(0);
            mensaje.setId(100L);
            return mensaje;
        });

        MensajeRequest request = request(TipoAudienciaMensaje.CLIENTES, TipoProgramacionMensaje.AHORA);
        request.setGimnasioId(999L);
        request.setRemitenteId(888L);
        request.setEstado(EstadoMensaje.PAUSADO);
        service.crearMensaje(TOKEN, request);

        ArgumentCaptor<Mensaje> captor = ArgumentCaptor.forClass(Mensaje.class);
        verify(mensajeRepository).save(captor.capture());
        Mensaje guardado = captor.getValue();
        assertEquals(gimnasio, guardado.getGimnasio());
        assertEquals(admin, guardado.getRemitente());
        assertEquals(EstadoMensaje.ENVIADO, guardado.getEstado());
        assertTrue(guardado.isDestinatariosMaterializados());
        assertEquals(Set.of(cliente.getId()), guardado.getDestinatarioIds());
        assertFalse(service.mensajeEsVisibleParaUsuario(guardado, clientePosterior));
    }

    @Test
    void programadoResuelveDestinatariosSoloAlEnviar() {
        autenticar(admin);
        when(mensajeRepository.save(any(Mensaje.class))).thenAnswer(invocation -> invocation.getArgument(0));
        MensajeRequest request = request(TipoAudienciaMensaje.CLIENTES, TipoProgramacionMensaje.FECHA);
        request.setFechaProgramada(LocalDateTime.now().plusHours(1));
        service.crearMensaje(TOKEN, request);

        ArgumentCaptor<Mensaje> createCaptor = ArgumentCaptor.forClass(Mensaje.class);
        verify(mensajeRepository).save(createCaptor.capture());
        Mensaje regla = createCaptor.getValue();
        assertFalse(regla.isDestinatariosMaterializados());
        assertTrue(regla.getDestinatarioIds().isEmpty());
        verify(destinatarioService, never()).resolver(
                eq(gimnasio), eq(TipoAudienciaMensaje.CLIENTES), any(), anyBoolean()
        );

        regla.setFechaProgramada(LocalDateTime.now().minusSeconds(1));
        when(mensajeRepository.findPendientesParaProcesar(eq(EstadoMensaje.PROGRAMADO), any()))
                .thenReturn(List.of(regla));
        when(mensajeRepository.findPendientesParaProcesar(eq(EstadoMensaje.ACTIVO), any()))
                .thenReturn(List.of());
        when(destinatarioService.resolver(
                eq(gimnasio), eq(TipoAudienciaMensaje.CLIENTES), any(), eq(false)
        )).thenReturn(ids(cliente.getId()));

        service.procesarMensajesPendientes();

        assertEquals(EstadoMensaje.ENVIADO, regla.getEstado());
        assertTrue(regla.isDestinatariosMaterializados());
        assertEquals(Set.of(cliente.getId()), regla.getDestinatarioIds());
    }

    @Test
    void recurrenteGeneraEntregasIndependientesYNuevosUsuariosSoloEnFuturas() {
        Usuario clienteNuevo = usuario(31L, RolUsuario.CLIENTE, gimnasio);
        Mensaje regla = reglaRecurrente();
        when(mensajeRepository.save(any(Mensaje.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(mensajeRepository.findPendientesParaProcesar(eq(EstadoMensaje.PROGRAMADO), any()))
                .thenReturn(List.of());
        when(mensajeRepository.findPendientesParaProcesar(eq(EstadoMensaje.ACTIVO), any()))
                .thenReturn(List.of(regla), List.of(regla));
        when(destinatarioService.resolver(
                eq(gimnasio), eq(TipoAudienciaMensaje.CLIENTES), any(), eq(false)
        )).thenReturn(ids(cliente.getId()), ids(cliente.getId(), clienteNuevo.getId()));

        service.procesarMensajesPendientes();
        regla.setFechaProgramada(LocalDateTime.now().minusSeconds(1));
        service.procesarMensajesPendientes();

        ArgumentCaptor<Mensaje> captor = ArgumentCaptor.forClass(Mensaje.class);
        verify(mensajeRepository, org.mockito.Mockito.atLeast(4)).save(captor.capture());
        List<Mensaje> entregas = captor.getAllValues().stream()
                .filter(mensaje -> mensaje != regla)
                .toList();
        assertEquals(2, entregas.size());
        assertEquals(Set.of(cliente.getId()), entregas.get(0).getDestinatarioIds());
        assertEquals(Set.of(cliente.getId(), clienteNuevo.getId()), entregas.get(1).getDestinatarioIds());
        assertFalse(service.mensajeEsVisibleParaUsuario(entregas.get(0), clienteNuevo));
        assertTrue(service.mensajeEsVisibleParaUsuario(entregas.get(1), clienteNuevo));
        assertFalse(service.mensajeEsVisibleParaUsuario(regla, cliente));
    }

    @Test
    void clienteNoPuedeCrearAudienciasNiAutomatizaciones() {
        autenticar(cliente);
        MensajeRequest general = request(TipoAudienciaMensaje.CLIENTES, TipoProgramacionMensaje.AHORA);
        ResponseStatusException generalError = assertThrows(
                ResponseStatusException.class,
                () -> service.crearMensaje(TOKEN, general)
        );
        assertEquals(HttpStatus.FORBIDDEN, generalError.getStatusCode());

        MensajeRequest recurrente = request(TipoAudienciaMensaje.INDIVIDUAL, TipoProgramacionMensaje.RECURRENTE);
        recurrente.setDestinatarioIds(List.of(admin.getId()));
        recurrente.setFechaProgramada(LocalDateTime.now().plusHours(1));
        recurrente.setFrecuencia(FrecuenciaMensaje.DIARIA);
        assertThrows(ResponseStatusException.class, () -> service.crearMensaje(TOKEN, recurrente));
    }

    @Test
    void marcadoComoLeidoSoloAfectaAlActorAutenticado() {
        autenticar(cliente);
        Mensaje mensaje = entregaMaterializada(cliente.getId());
        when(mensajeRepository.findById(mensaje.getId())).thenReturn(Optional.of(mensaje));
        when(mensajeRepository.save(mensaje)).thenReturn(mensaje);

        service.marcarMensajeComoLeido(TOKEN, mensaje.getId());

        assertEquals(Set.of(cliente.getId()), mensaje.getLeidoPorUsuarioIds());
    }

    @Test
    void aislamientoEntreGimnasiosYPrivacidadDeRespuesta() {
        Gimnasio otroGimnasio = gimnasio(2L, "Otro");
        Usuario clienteExterno = usuario(40L, RolUsuario.CLIENTE, otroGimnasio);
        Mensaje mensaje = entregaMaterializada(cliente.getId());
        assertFalse(service.mensajeEsVisibleParaUsuario(mensaje, clienteExterno));

        var response = new com.julia.gymflow.dto.MensajeResponse(mensaje, cliente, false);
        assertNull(response.getDestinatarioIds());
        assertNull(response.getLeidoPorUsuarioIds());
        assertEquals(List.of(admin.getId()), response.getInterlocutorIds());
    }

    private void autenticar(Usuario actor) {
        when(authTokenService.obtenerUsuarioId(TOKEN)).thenReturn(actor.getId());
        when(usuarioRepository.findById(actor.getId())).thenReturn(Optional.of(actor));
    }

    private MensajeRequest request(TipoAudienciaMensaje audiencia, TipoProgramacionMensaje tipo) {
        MensajeRequest request = new MensajeRequest();
        request.setAsunto("Aviso");
        request.setTexto("Contenido seguro");
        request.setAudiencia(audiencia);
        request.setTipoProgramacion(tipo);
        request.setFrecuencia(FrecuenciaMensaje.NINGUNA);
        request.setPrioridad(PrioridadMensaje.NORMAL);
        return request;
    }

    private Mensaje mensajeLegacyGeneral(LocalDateTime fechaEnvio, PrioridadMensaje prioridad) {
        Mensaje mensaje = baseMensaje();
        mensaje.setAudiencia(TipoAudienciaMensaje.TODOS);
        mensaje.setPrioridad(prioridad);
        mensaje.setFechaEnvio(fechaEnvio);
        mensaje.setDestinatariosMaterializados(null);
        return mensaje;
    }

    private Mensaje reglaRecurrente() {
        Mensaje regla = baseMensaje();
        regla.setId(200L);
        regla.setAudiencia(TipoAudienciaMensaje.CLIENTES);
        regla.setTipoProgramacion(TipoProgramacionMensaje.RECURRENTE);
        regla.setFrecuencia(FrecuenciaMensaje.DIARIA);
        regla.setEstado(EstadoMensaje.ACTIVO);
        regla.setFechaEnvio(null);
        regla.setFechaProgramada(LocalDateTime.now().minusSeconds(1));
        regla.setDestinatariosMaterializados(false);
        return regla;
    }

    private Mensaje entregaMaterializada(Long... ids) {
        Mensaje mensaje = baseMensaje();
        mensaje.setId(300L);
        mensaje.setRemitente(admin);
        mensaje.setAudiencia(TipoAudienciaMensaje.INDIVIDUAL);
        mensaje.setDestinatarioIds(ids(ids));
        mensaje.setDestinatariosMaterializados(true);
        return mensaje;
    }

    private Mensaje baseMensaje() {
        Mensaje mensaje = new Mensaje();
        mensaje.setAsunto("Aviso");
        mensaje.setTexto("Contenido");
        mensaje.setGimnasio(gimnasio);
        mensaje.setEstado(EstadoMensaje.ENVIADO);
        mensaje.setTipoProgramacion(TipoProgramacionMensaje.AHORA);
        mensaje.setFrecuencia(FrecuenciaMensaje.NINGUNA);
        mensaje.setPrioridad(PrioridadMensaje.NORMAL);
        mensaje.setFechaCreacion(LocalDateTime.now());
        mensaje.setFechaEnvio(LocalDateTime.now());
        mensaje.setActivo(true);
        return mensaje;
    }

    private LinkedHashSet<Long> ids(Long... ids) {
        return new LinkedHashSet<>(List.of(ids));
    }

    private Gimnasio gimnasio(Long id, String nombre) {
        Gimnasio value = new Gimnasio();
        value.setId(id);
        value.setNombre(nombre);
        value.setActivo(true);
        value.setMensajesUsuariosPermitidos(true);
        return value;
    }

    private Usuario usuario(Long id, RolUsuario rol, Gimnasio gym) {
        Usuario value = new Usuario();
        value.setId(id);
        value.setNombre(rol.name());
        value.setEmail(id + "@example.com");
        value.setRol(rol);
        value.setActivo(true);
        value.setGimnasio(gym);
        return value;
    }
}
