package com.julia.gymflow.service;

import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.TipoAudienciaMensaje;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
public class MensajeDestinatarioService {

    private final UsuarioRepository usuarioRepository;

    public MensajeDestinatarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public LinkedHashSet<Long> resolver(
            Gimnasio gimnasio,
            TipoAudienciaMensaje audiencia,
            Collection<Long> destinatariosExplicitos,
            boolean exigirTodosLosIndividuales
    ) {
        if (gimnasio == null || gimnasio.getId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El mensaje no tiene un gimnasio valido.");
        }

        TipoAudienciaMensaje audienciaFinal = audiencia != null
                ? audiencia
                : TipoAudienciaMensaje.TODOS;
        List<Usuario> usuariosActivos = usuarioRepository.findByGimnasioIdAndActivoTrue(gimnasio.getId());

        if (audienciaFinal == TipoAudienciaMensaje.INDIVIDUAL) {
            Set<Long> solicitados = destinatariosExplicitos == null
                    ? Set.of()
                    : new LinkedHashSet<>(destinatariosExplicitos);

            if (solicitados.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Selecciona al menos un destinatario individual."
                );
            }

            LinkedHashSet<Long> validos = usuariosActivos.stream()
                    .filter(usuario -> solicitados.contains(usuario.getId()))
                    .filter(usuario -> usuario.getGimnasio() != null)
                    .filter(usuario -> Objects.equals(usuario.getGimnasio().getId(), gimnasio.getId()))
                    .map(Usuario::getId)
                    .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));

            if (exigirTodosLosIndividuales && validos.size() != solicitados.size()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Hay destinatarios inexistentes, inactivos o ajenos al gimnasio."
                );
            }
            return validos;
        }

        return usuariosActivos.stream()
                .filter(usuario -> usuario.getGimnasio() != null)
                .filter(usuario -> Objects.equals(usuario.getGimnasio().getId(), gimnasio.getId()))
                .filter(usuario -> coincideConAudiencia(usuario.getRol(), audienciaFinal))
                .map(Usuario::getId)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
    }

    private boolean coincideConAudiencia(RolUsuario rol, TipoAudienciaMensaje audiencia) {
        if (audiencia == TipoAudienciaMensaje.CLIENTES) {
            return rol == RolUsuario.CLIENTE;
        }
        if (audiencia == TipoAudienciaMensaje.ENTRENADORES) {
            return rol == RolUsuario.ENTRENADOR;
        }
        return rol == RolUsuario.CLIENTE || rol == RolUsuario.ENTRENADOR;
    }
}
