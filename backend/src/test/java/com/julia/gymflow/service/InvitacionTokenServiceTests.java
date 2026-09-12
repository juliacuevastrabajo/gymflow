package com.julia.gymflow.service;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class InvitacionTokenServiceTests {

	private static final String SECRET = "invitation-token-tests-secret-32-chars-minimum";
	private final InvitacionTokenService tokenService = new InvitacionTokenService(SECRET);

	@Test
	void creaYLeeUnTokenSinDatosPersonales() {
		String publicId = "c9d38bdb-a731-4af4-85a5-bf27ef5e7446";
		Instant expiration = Instant.now().plusSeconds(3600);

		String token = tokenService.crearToken(publicId, 7L, expiration);
		InvitacionTokenService.Claims claims = tokenService.leerToken(token);

		assertEquals(publicId, claims.publicId());
		assertEquals(7L, claims.gimnasioId());
		assertEquals(expiration.getEpochSecond(), claims.fechaExpiracion().getEpochSecond());
	}

	@Test
	void rechazaTokenManipulado() {
		String token = tokenService.crearToken(
				"b6b0798d-c4b2-4425-a6bd-94a69de2074d",
				3L,
				Instant.now().plusSeconds(3600)
		);
		String manipulado = token.substring(0, token.length() - 1)
				+ (token.endsWith("A") ? "B" : "A");

		assertThrows(IllegalArgumentException.class, () -> tokenService.leerToken(manipulado));
	}
}
