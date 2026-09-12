package com.julia.gymflow.service;

import com.julia.gymflow.dto.PagoMarcarPagadoRequest;
import com.julia.gymflow.dto.PagoRequest;
import com.julia.gymflow.dto.PagoResponse;
import com.julia.gymflow.entity.EstadoPago;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.MetodoPago;
import com.julia.gymflow.entity.Pago;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.PagoRepository;
import com.julia.gymflow.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PagoServiceTests {

    @Mock
    private PagoRepository pagoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private AuthTokenService authTokenService;

    private PagoService pagoService;
    private Gimnasio gimnasioUno;
    private Gimnasio gimnasioDos;
    private Usuario admin;
    private Usuario cliente;
    private Usuario entrenador;

    @BeforeEach
    void preparar() {
        pagoService = new PagoService(pagoRepository, usuarioRepository, authTokenService);
        gimnasioUno = gimnasio(1L, "UrbanFit");
        gimnasioDos = gimnasio(2L, "Otro Gym");
        admin = usuario(10L, "Julia", RolUsuario.ADMIN, gimnasioUno, true);
        cliente = usuario(20L, "Marta", RolUsuario.CLIENTE, gimnasioUno, true);
        entrenador = usuario(30L, "Pablo", RolUsuario.ENTRENADOR, gimnasioUno, true);
    }

    @Test
    void adminCreaCobroParaClienteDeSuGimnasio() {
        autenticar("Bearer admin", admin);
        when(usuarioRepository.findById(cliente.getId())).thenReturn(Optional.of(cliente));
        when(pagoRepository.save(any(Pago.class))).thenAnswer(invocacion -> {
            Pago pago = invocacion.getArgument(0);
            pago.setId(100L);
            return pago;
        });

        PagoResponse response = pagoService.crearPago("Bearer admin", request(cliente.getId(), "35.50"));

        assertEquals(100L, response.getId());
        assertEquals("PENDIENTE", response.getEstado());
        assertEquals(new BigDecimal("35.50"), response.getImporte());
        assertEquals("EUR", response.getMoneda());
        assertEquals(cliente.getId(), response.getClienteId());
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "-12.50"})
    void noPermiteImporteCeroONegativo(String importe) {
        autenticar("Bearer admin", admin);
        when(usuarioRepository.findById(cliente.getId())).thenReturn(Optional.of(cliente));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> pagoService.crearPago("Bearer admin", request(cliente.getId(), importe))
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verify(pagoRepository, never()).save(any());
    }

    @Test
    void noPermiteAsignarCobroAEntrenador() {
        autenticar("Bearer admin", admin);
        when(usuarioRepository.findById(entrenador.getId())).thenReturn(Optional.of(entrenador));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> pagoService.crearPago("Bearer admin", request(entrenador.getId(), "20"))
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    }

    @Test
    void noPermiteClienteDeOtroGimnasio() {
        Usuario clienteExterno = usuario(40L, "Externo", RolUsuario.CLIENTE, gimnasioDos, true);
        autenticar("Bearer admin", admin);
        when(usuarioRepository.findById(clienteExterno.getId())).thenReturn(Optional.of(clienteExterno));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> pagoService.crearPago("Bearer admin", request(clienteExterno.getId(), "20"))
        );

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
    }

    @Test
    void adminListaSoloPagosDeSuGimnasio() {
        autenticar("Bearer admin", admin);
        Pago pago = pagoPendiente(1L, cliente, LocalDate.now().plusDays(5));
        when(pagoRepository.findByGimnasioId(gimnasioUno.getId())).thenReturn(List.of(pago));

        List<PagoResponse> resultado = pagoService.listarPagos("Bearer admin");

        assertEquals(1, resultado.size());
        assertEquals(cliente.getId(), resultado.get(0).getClienteId());
        verify(pagoRepository).findByGimnasioId(gimnasioUno.getId());
        verify(pagoRepository, never()).findAll();
    }

    @Test
    void clienteListaSoloSusPropiosPagos() {
        autenticar("Bearer cliente", cliente);
        when(pagoRepository.findByClienteId(cliente.getId()))
                .thenReturn(List.of(pagoPendiente(1L, cliente, LocalDate.now().plusDays(2))));

        List<PagoResponse> resultado = pagoService.listarMisPagos("Bearer cliente");

        assertEquals(1, resultado.size());
        assertEquals(cliente.getId(), resultado.get(0).getClienteId());
        verify(pagoRepository).findByClienteId(cliente.getId());
    }

    @Test
    void pagoPendienteVencidoSeRespondeComoVencido() {
        autenticar("Bearer admin", admin);
        when(pagoRepository.findByGimnasioId(gimnasioUno.getId()))
                .thenReturn(List.of(pagoPendiente(1L, cliente, LocalDate.now().minusDays(1))));

        List<PagoResponse> resultado = pagoService.listarPagos("Bearer admin");

        assertEquals("VENCIDO", resultado.get(0).getEstado());
    }

    @Test
    void marcarPagadoExigeMetodo() {
        autenticar("Bearer admin", admin);
        Pago pago = pagoPendiente(1L, cliente, LocalDate.now().plusDays(2));
        when(pagoRepository.findById(pago.getId())).thenReturn(Optional.of(pago));
        PagoMarcarPagadoRequest request = new PagoMarcarPagadoRequest();
        request.setFechaPago(LocalDate.now());

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> pagoService.marcarComoPagado("Bearer admin", pago.getId(), request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    }

    @Test
    void noPermiteFechaPagoFutura() {
        autenticar("Bearer admin", admin);
        Pago pago = pagoPendiente(1L, cliente, LocalDate.now().plusDays(2));
        when(pagoRepository.findById(pago.getId())).thenReturn(Optional.of(pago));
        PagoMarcarPagadoRequest request = marcarPagadoRequest();
        request.setFechaPago(LocalDate.now().plusDays(1));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> pagoService.marcarComoPagado("Bearer admin", pago.getId(), request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertEquals("La fecha de pago no puede ser futura.", error.getReason());
        assertEquals(EstadoPago.PENDIENTE, pago.getEstado());
        assertNull(pago.getFechaPago());
        assertNull(pago.getMetodoPago());
        assertNull(pago.getReferencia());
        verify(pagoRepository, never()).save(any());
    }

    @Test
    void noPermiteMarcarDosVecesComoPagado() {
        autenticar("Bearer admin", admin);
        Pago pago = pagoPendiente(1L, cliente, LocalDate.now());
        pago.setEstado(EstadoPago.PAGADO);
        when(pagoRepository.findById(pago.getId())).thenReturn(Optional.of(pago));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> pagoService.marcarComoPagado("Bearer admin", pago.getId(), marcarPagadoRequest())
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
    }

    @Test
    void noPermiteCancelarPagoPagado() {
        autenticar("Bearer admin", admin);
        Pago pago = pagoPendiente(1L, cliente, LocalDate.now());
        pago.setEstado(EstadoPago.PAGADO);
        when(pagoRepository.findById(pago.getId())).thenReturn(Optional.of(pago));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> pagoService.cancelarPago("Bearer admin", pago.getId())
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
    }

    @Test
    void cancelarMantieneRegistroEnHistorial() {
        autenticar("Bearer admin", admin);
        Pago pago = pagoPendiente(1L, cliente, LocalDate.now().plusDays(1));
        when(pagoRepository.findById(pago.getId())).thenReturn(Optional.of(pago));
        when(pagoRepository.save(any(Pago.class))).thenAnswer(invocacion -> invocacion.getArgument(0));

        PagoResponse response = pagoService.cancelarPago("Bearer admin", pago.getId());

        assertEquals("CANCELADO", response.getEstado());
        ArgumentCaptor<Pago> captor = ArgumentCaptor.forClass(Pago.class);
        verify(pagoRepository).save(captor.capture());
        assertEquals(EstadoPago.CANCELADO, captor.getValue().getEstado());
        verify(pagoRepository, never()).delete(any());
    }

    @Test
    void entrenadorNoPuedeGestionarPagos() {
        autenticar("Bearer entrenador", entrenador);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> pagoService.crearPago("Bearer entrenador", request(cliente.getId(), "20"))
        );

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
    }

    @Test
    void clienteNoPuedeConsultarPagoDeOtroCliente() {
        Usuario otroCliente = usuario(50L, "Ana", RolUsuario.CLIENTE, gimnasioUno, true);
        autenticar("Bearer cliente", cliente);
        Pago pagoAjeno = pagoPendiente(7L, otroCliente, LocalDate.now().plusDays(2));
        when(pagoRepository.findById(pagoAjeno.getId())).thenReturn(Optional.of(pagoAjeno));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> pagoService.consultarPago("Bearer cliente", pagoAjeno.getId())
        );

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
    }

    private void autenticar(String token, Usuario usuario) {
        when(authTokenService.obtenerUsuarioId(token)).thenReturn(usuario.getId());
        when(usuarioRepository.findById(usuario.getId())).thenReturn(Optional.of(usuario));
    }

    private PagoRequest request(Long clienteId, String importe) {
        PagoRequest request = new PagoRequest();
        request.setClienteId(clienteId);
        request.setConcepto("Cuota mensual");
        request.setDescripcion("Acceso al gimnasio");
        request.setImporte(new BigDecimal(importe));
        request.setFechaVencimiento(LocalDate.now().plusDays(10));
        return request;
    }

    private PagoMarcarPagadoRequest marcarPagadoRequest() {
        PagoMarcarPagadoRequest request = new PagoMarcarPagadoRequest();
        request.setFechaPago(LocalDate.now());
        request.setMetodoPago(MetodoPago.TRANSFERENCIA);
        return request;
    }

    private Pago pagoPendiente(Long id, Usuario pagoCliente, LocalDate vencimiento) {
        Pago pago = new Pago();
        pago.setId(id);
        pago.setGimnasio(pagoCliente.getGimnasio());
        pago.setCliente(pagoCliente);
        pago.setCreadoPor(admin);
        pago.setConcepto("Cuota mensual");
        pago.setImporte(new BigDecimal("35.00"));
        pago.setMoneda("EUR");
        pago.setFechaEmision(LocalDate.now().minusDays(10));
        pago.setFechaVencimiento(vencimiento);
        pago.setEstado(EstadoPago.PENDIENTE);
        pago.setFechaCreacion(LocalDateTime.now().minusDays(10));
        pago.setFechaActualizacion(LocalDateTime.now());
        return pago;
    }

    private Gimnasio gimnasio(Long id, String nombre) {
        Gimnasio gimnasio = new Gimnasio();
        gimnasio.setId(id);
        gimnasio.setNombre(nombre);
        return gimnasio;
    }

    private Usuario usuario(
            Long id,
            String nombre,
            RolUsuario rol,
            Gimnasio gimnasio,
            boolean activo
    ) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setNombre(nombre);
        usuario.setEmail(nombre.toLowerCase() + "@gymflow.test");
        usuario.setRol(rol);
        usuario.setGimnasio(gimnasio);
        usuario.setActivo(activo);
        return usuario;
    }
}
