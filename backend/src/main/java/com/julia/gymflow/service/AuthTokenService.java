package com.julia.gymflow.service;

import com.julia.gymflow.entity.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

@Service
public class AuthTokenService {

	private static final Duration TOKEN_DURATION = Duration.ofDays(30);
	private static final int MIN_SECRET_LENGTH = 32;

	private final String secret;

	public AuthTokenService(
			@Value("${gymflow.auth.secret}") String secret
	) {
		if (secret == null || secret.length() < MIN_SECRET_LENGTH) {
			throw new IllegalStateException(
					"gymflow.auth.secret debe tener al menos 32 caracteres."
			);
		}
		this.secret = secret;
	}

	public String crearToken(Usuario usuario) {
		return crearTokenConExpiracion(usuario, Instant.now().plus(TOKEN_DURATION));
	}

	String crearTokenConExpiracion(Usuario usuario, Instant expiracion) {
		long expiresAt = expiracion.toEpochMilli();
		String payload = usuario.getId() + ":" + expiresAt;
		String firma = firmar(payload);
		String tokenPlano = payload + ":" + firma;

		return Base64.getUrlEncoder()
				.withoutPadding()
				.encodeToString(tokenPlano.getBytes(StandardCharsets.UTF_8));
	}

	public Long obtenerUsuarioId(String authorizationHeader) {
		if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion no valida.");
		}

		try {
			String token = authorizationHeader.substring("Bearer ".length()).trim();
			String tokenPlano = new String(
					Base64.getUrlDecoder().decode(token),
					StandardCharsets.UTF_8
			);
			String[] partes = tokenPlano.split(":");

			if (partes.length != 3) {
				throw new IllegalArgumentException("Token incompleto.");
			}

			String payload = partes[0] + ":" + partes[1];
			String firmaEsperada = firmar(payload);

			if (!MessageDigest.isEqual(
					firmaEsperada.getBytes(StandardCharsets.UTF_8),
					partes[2].getBytes(StandardCharsets.UTF_8)
			)) {
				throw new IllegalArgumentException("Firma no valida.");
			}

			long expiresAt = Long.parseLong(partes[1]);
			if (Instant.now().toEpochMilli() > expiresAt) {
				throw new IllegalArgumentException("Token caducado.");
			}

			return Long.parseLong(partes[0]);
		} catch (IllegalArgumentException error) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion no valida.");
		}
	}

	private String firmar(String payload) {
		try {
			Mac mac = Mac.getInstance("HmacSHA256");
			SecretKeySpec keySpec = new SecretKeySpec(
					secret.getBytes(StandardCharsets.UTF_8),
					"HmacSHA256"
			);
			mac.init(keySpec);

			return Base64.getUrlEncoder()
					.withoutPadding()
					.encodeToString(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
		} catch (Exception error) {
			throw new IllegalStateException("No se pudo firmar la sesion.", error);
		}
	}
}
