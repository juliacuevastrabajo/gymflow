package com.julia.gymflow.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.julia.gymflow.entity.Gimnasio;

import java.util.Optional;

public interface GimnasioRepository extends JpaRepository<Gimnasio, Long> {

	Optional<Gimnasio> findBySlug(String slug);

	boolean existsByImagenFondoUrl(String imagenFondoUrl);

}
