package com.julia.gymflow.service;

import com.julia.gymflow.dto.PagoMarcarPagadoRequest;
import com.julia.gymflow.dto.PagoRequest;
import com.julia.gymflow.dto.PagoResponse;
import com.julia.gymflow.entity.EstadoPago;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.Pago;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.PagoRepository;
import com.julia.gymflow.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
public class PagoService {

    private final PagoRepository pagoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuthTokenService authTokenService;

    public PagoService(
            PagoRepository pagoRepository,
            UsuarioRepository usuarioRepository,
            AuthTokenService authTokenService
    ) {
        this.pagoRepository = pagoRepository;
        this.usuarioRepository = usuarioRepository;
        this.authTokenService = authTokenService;
    }

    @Transactional(readOnly = true)
    public List<PagoResponse> listarPagos(String authorizationHeader) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
        validarAdmin(actor);
        Long gimnasioId = obtenerGimnasio(actor).getId();

        return ordenarYConvertir(pagoRepository.findByGimnasioId(gimnasioId));
    }

    @Transactional(readOnly = true)
    public List<PagoResponse> listarMisPagos(String authorizationHeader) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
        if (actor.getRol() != RolUsuario.CLIENTE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo los clientes consultan sus propios pagos.");
        }

        return ordenarYConvertir(pagoRepository.findByClienteId(actor.getId()));
    }

    @Transactional(readOnly = true)
    public PagoResponse consultarPago(String authorizationHeader, Long pagoId) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
        Pago pago = obtenerPago(pagoId);
        validarPuedeConsultar(actor, pago);
        return new PagoResponse(pago, LocalDate.now());
    }

    @Transactional
    public PagoResponse crearPago(String authorizationHeader, PagoRequest request) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
        validarAdmin(actor);
        Gimnasio gimnasio = obtenerGimnasio(actor);
        Usuario cliente = obtenerClienteAsignable(request.getClienteId(), gimnasio);

        Pago pago = new Pago();
        pago.setGimnasio(gimnasio);
        pago.setCliente(cliente);
        pago.setCreadoPor(actor);
        pago.setFechaEmision(LocalDate.now());
        pago.setEstado(EstadoPago.PENDIENTE);
        pago.setMoneda("EUR");
        pago.setFechaCreacion(LocalDateTime.now());
        pago.setFechaActualizacion(LocalDateTime.now());
        aplicarDatosEditables(pago, request);

        return new PagoResponse(pagoRepository.save(pago), LocalDate.now());
    }

    @Transactional
    public PagoResponse actualizarPago(String authorizationHeader, Long pagoId, PagoRequest request) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
        validarAdmin(actor);
        Pago pago = obtenerPagoDelGimnasio(pagoId, obtenerGimnasio(actor));
        validarPendiente(pago, "Solo se pueden editar cobros pendientes.");

        pago.setCliente(obtenerClienteAsignable(request.getClienteId(), pago.getGimnasio()));
        aplicarDatosEditables(pago, request);
        pago.setFechaActualizacion(LocalDateTime.now());

        return new PagoResponse(pagoRepository.save(pago), LocalDate.now());
    }

    @Transactional
    public PagoResponse marcarComoPagado(
            String authorizationHeader,
            Long pagoId,
            PagoMarcarPagadoRequest request
    ) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
        validarAdmin(actor);
        Pago pago = obtenerPagoDelGimnasio(pagoId, obtenerGimnasio(actor));
        validarPendiente(pago, "El cobro ya no está pendiente.");

        if (request == null || request.getFechaPago() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de pago es obligatoria.");
        }
        if (request.getMetodoPago() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un método de pago.");
        }
        if (pago.getFechaEmision() != null && request.getFechaPago().isBefore(pago.getFechaEmision())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de pago no puede ser anterior a la emisión.");
        }
        if (request.getFechaPago().isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de pago no puede ser futura.");
        }

        pago.setFechaPago(request.getFechaPago());
        pago.setMetodoPago(request.getMetodoPago());
        pago.setReferencia(limpiarTextoOpcional(request.getReferencia(), 255, "referencia"));
        pago.setEstado(EstadoPago.PAGADO);
        pago.setFechaActualizacion(LocalDateTime.now());

        return new PagoResponse(pagoRepository.save(pago), LocalDate.now());
    }

    @Transactional
    public PagoResponse cancelarPago(String authorizationHeader, Long pagoId) {
        Usuario actor = obtenerUsuarioAutenticado(authorizationHeader);
        validarAdmin(actor);
        Pago pago = obtenerPagoDelGimnasio(pagoId, obtenerGimnasio(actor));
        validarPendiente(pago, "Solo se pueden cancelar cobros pendientes.");

        pago.setEstado(EstadoPago.CANCELADO);
        pago.setFechaActualizacion(LocalDateTime.now());
        return new PagoResponse(pagoRepository.save(pago), LocalDate.now());
    }

    private List<PagoResponse> ordenarYConvertir(List<Pago> pagos) {
        LocalDate hoy = LocalDate.now();
        return pagos.stream()
                .sorted(comparadorPagos(hoy))
                .map(pago -> new PagoResponse(pago, hoy))
                .toList();
    }

    private Comparator<Pago> comparadorPagos(LocalDate hoy) {
        return (primero, segundo) -> {
            int prioridad = Integer.compare(
                    prioridadEstado(primero, hoy),
                    prioridadEstado(segundo, hoy)
            );
            if (prioridad != 0) {
                return prioridad;
            }

            int fecha = compararFechaSegunEstado(primero, segundo);
            if (fecha != 0) {
                return fecha;
            }

            return Comparator.nullsLast(Comparator.<Long>reverseOrder())
                    .compare(primero.getId(), segundo.getId());
        };
    }

    private int prioridadEstado(Pago pago, LocalDate hoy) {
        if (esVencido(pago, hoy)) return 0;
        if (pago.getEstado() == EstadoPago.PENDIENTE) return 1;
        if (pago.getEstado() == EstadoPago.PAGADO) return 2;
        return 3;
    }

    private int compararFechaSegunEstado(Pago primero, Pago segundo) {
        if (primero.getEstado() == EstadoPago.PENDIENTE) {
            return Comparator.nullsLast(Comparator.<LocalDate>naturalOrder())
                    .compare(primero.getFechaVencimiento(), segundo.getFechaVencimiento());
        }
        if (primero.getEstado() == EstadoPago.PAGADO) {
            return Comparator.nullsLast(Comparator.<LocalDate>reverseOrder())
                    .compare(primero.getFechaPago(), segundo.getFechaPago());
        }
        return Comparator.nullsLast(Comparator.<LocalDateTime>reverseOrder())
                .compare(primero.getFechaActualizacion(), segundo.getFechaActualizacion());
    }

    private boolean esVencido(Pago pago, LocalDate hoy) {
        return pago.getEstado() == EstadoPago.PENDIENTE
                && pago.getFechaVencimiento() != null
                && pago.getFechaVencimiento().isBefore(hoy);
    }

    private void aplicarDatosEditables(Pago pago, PagoRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los datos del cobro son obligatorios.");
        }
        pago.setConcepto(limpiarTexto(request.getConcepto(), 140, "El concepto es obligatorio.", "concepto"));
        pago.setDescripcion(limpiarTextoOpcional(request.getDescripcion(), 2000, "descripción"));
        pago.setImporte(normalizarImporte(request.getImporte()));
        if (request.getFechaVencimiento() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de vencimiento es obligatoria.");
        }
        pago.setFechaVencimiento(request.getFechaVencimiento());
    }

    private BigDecimal normalizarImporte(BigDecimal importe) {
        if (importe == null || importe.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El importe debe ser mayor que cero.");
        }
        try {
            return importe.setScale(2, RoundingMode.UNNECESSARY);
        } catch (ArithmeticException error) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El importe admite como máximo dos decimales.");
        }
    }

    private Usuario obtenerUsuarioAutenticado(String authorizationHeader) {
        Long usuarioId = authTokenService.obtenerUsuarioId(authorizationHeader);
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesión no válida."));
    }

    private Gimnasio obtenerGimnasio(Usuario usuario) {
        if (usuario.getGimnasio() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El usuario no tiene gimnasio asociado.");
        }
        return usuario.getGimnasio();
    }

    private void validarAdmin(Usuario actor) {
        if (actor.getRol() != RolUsuario.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo la administración puede gestionar pagos.");
        }
    }

    private Usuario obtenerClienteAsignable(Long clienteId, Gimnasio gimnasio) {
        if (clienteId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un cliente.");
        }
        Usuario cliente = usuarioRepository.findById(clienteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado."));
        if (cliente.getRol() != RolUsuario.CLIENTE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El cobro solo puede asignarse a un cliente.");
        }
        if (!cliente.isActivo()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El cliente debe estar activo.");
        }
        if (cliente.getGimnasio() == null || !Objects.equals(cliente.getGimnasio().getId(), gimnasio.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El cliente pertenece a otro gimnasio.");
        }
        return cliente;
    }

    private Pago obtenerPago(Long pagoId) {
        return pagoRepository.findById(pagoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cobro no encontrado."));
    }

    private Pago obtenerPagoDelGimnasio(Long pagoId, Gimnasio gimnasio) {
        Pago pago = obtenerPago(pagoId);
        if (pago.getGimnasio() == null || !Objects.equals(pago.getGimnasio().getId(), gimnasio.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El cobro pertenece a otro gimnasio.");
        }
        return pago;
    }

    private void validarPuedeConsultar(Usuario actor, Pago pago) {
        if (actor.getRol() == RolUsuario.ADMIN) {
            obtenerPagoDelGimnasio(pago.getId(), obtenerGimnasio(actor));
            return;
        }
        if (actor.getRol() == RolUsuario.CLIENTE
                && pago.getCliente() != null
                && Objects.equals(actor.getId(), pago.getCliente().getId())) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes acceso a este cobro.");
    }

    private void validarPendiente(Pago pago, String mensaje) {
        if (pago.getEstado() != EstadoPago.PENDIENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, mensaje);
        }
    }

    private String limpiarTexto(String valor, int maximo, String obligatorio, String campo) {
        if (valor == null || valor.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, obligatorio);
        }
        String limpio = valor.trim();
        if (limpio.length() > maximo) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El " + campo + " supera " + maximo + " caracteres.");
        }
        return limpio;
    }

    private String limpiarTextoOpcional(String valor, int maximo, String campo) {
        if (valor == null || valor.trim().isEmpty()) {
            return null;
        }
        String limpio = valor.trim();
        if (limpio.length() > maximo) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La " + campo + " supera " + maximo + " caracteres.");
        }
        return limpio;
    }
}
