package com.julia.gymflow.service;

import com.julia.gymflow.entity.EstadoMensaje;
import com.julia.gymflow.entity.FrecuenciaMensaje;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.Mensaje;
import com.julia.gymflow.entity.PrioridadMensaje;
import com.julia.gymflow.entity.TipoAudienciaMensaje;
import com.julia.gymflow.entity.TipoProgramacionMensaje;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.MensajeRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;

@Service
public class MensajeBienvenidaService {

    private final MensajeRepository mensajeRepository;

    public MensajeBienvenidaService(MensajeRepository mensajeRepository) {
        this.mensajeRepository = mensajeRepository;
    }

    public void crearPara(Usuario usuario) {
        if (usuario == null || usuario.getId() == null || usuario.getGimnasio() == null) {
            throw new IllegalArgumentException("El usuario de bienvenida debe estar guardado y tener gimnasio.");
        }
        if (mensajeRepository.existsByBienvenidaUsuarioId(usuario.getId())) {
            return;
        }

        Gimnasio gimnasio = usuario.getGimnasio();
        String nombreGimnasio = tieneTexto(gimnasio.getNombre()) ? gimnasio.getNombre().trim() : "tu gimnasio";
        String nombreUsuario = tieneTexto(usuario.getNombre()) ? usuario.getNombre().trim() : "bienvenido";
        LocalDateTime ahora = LocalDateTime.now();
        LinkedHashSet<Long> destinatarios = new LinkedHashSet<>();
        destinatarios.add(usuario.getId());

        Mensaje mensaje = new Mensaje();
        mensaje.setAsunto("Bienvenida a " + nombreGimnasio);
        mensaje.setTexto(
                "Hola " + nombreUsuario
                        + ", tu acceso ya est\u00E1 listo. Desde la app puedes revisar avisos, reservas y novedades del gimnasio."
        );
        mensaje.setAutomatico(true);
        mensaje.setAudiencia(TipoAudienciaMensaje.INDIVIDUAL);
        mensaje.setEstado(EstadoMensaje.ENVIADO);
        mensaje.setTipoProgramacion(TipoProgramacionMensaje.AHORA);
        mensaje.setFrecuencia(FrecuenciaMensaje.NINGUNA);
        mensaje.setPrioridad(PrioridadMensaje.NORMAL);
        mensaje.setFechaCreacion(ahora);
        mensaje.setFechaEnvio(ahora);
        mensaje.setGimnasio(gimnasio);
        mensaje.setDestinatarioIds(destinatarios);
        mensaje.setDestinatariosMaterializados(true);
        mensaje.setBienvenidaUsuarioId(usuario.getId());
        mensaje.setActivo(true);

        mensajeRepository.save(mensaje);
    }

    private boolean tieneTexto(String valor) {
        return valor != null && !valor.isBlank();
    }
}
