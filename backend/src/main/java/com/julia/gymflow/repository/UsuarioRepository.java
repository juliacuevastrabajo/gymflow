package com.julia.gymflow.repository;

import com.julia.gymflow.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

	List<Usuario> findByGimnasioId(Long gimnasioId);

	List<Usuario> findByGimnasioIdAndActivoTrue(Long gimnasioId);

	Optional<Usuario> findByEmail(String email);

	boolean existsByFotoPerfilUrl(String fotoPerfilUrl);
}
