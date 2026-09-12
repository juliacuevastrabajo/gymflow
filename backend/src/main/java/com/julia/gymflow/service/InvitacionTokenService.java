package com.julia.gymflow.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
public class InvitacionTokenService {

	private static final String VERSION = "v1";
	private static final String PURPOSE = "client-invitation";
	private static final String HMAC_ALGORITHM = "HmacSHA256";
	private static final int MIN_SECRET_LENGTH = 32;

	private final byte[] secret;

	public InvitacionTokenService(
			@Value("${gymflow.invitation.secret}") String secret
	) {
		if (secret == null || secret.length() < MIN_SECRET_LENGTH) {
			throw new IllegalArgumentException(
					"gymflow.invitation.secret debe contener al menos 32 caracteres."
			);
		}
		this.secret = secret.getBytes(StandardCharsets.UTF_8);
	}

	public String crearToken(String publicId, Long gimnasioId, Instant fechaExpiracion) {
		String payload = String.join(
				"|",
				VERSION,
				PURPOSE,
				publicId,
				String.valueOf(gimnasioId),
				String.valueOf(fechaExpiracion.getEpochSecond())
		);
		String payloadCodificado = codificar(payload.getBytes(StandardCharsets.UTF_8));
		return payloadCodificado + "." + codificar(firmar(payloadCodificado));
	}

	public Claims leerToken(String token) {
		try {
			if (token == null || token.isBlank()) {
				throw new IllegalArgumentException("Token vacío.");
			}

			String[] segmentos = token.trim().split("\\.", -1);
			if (segmentos.length != 2 || segmentos[0].isBlank() || segmentos[1].isBlank()) {
				throw new IllegalArgumentException("Token incompleto.");
			}

			byte[] firmaRecibida = Base64.getUrlDecoder().decode(segmentos[1]);
			byte[] firmaEsperada = firmar(segmentos[0]);
			if (!MessageDigest.isEqual(firmaEsperada, firmaRecibida)) {
				throw new IllegalArgumentException("Firma no válida.");
			}

			String payload = new String(
					Base64.getUrlDecoder().decode(segmentos[0]),
					StandardCharsets.UTF_8
			);
			String[] partes = payload.split("\\|", -1);
			if (partes.length != 5
					|| !VERSION.equals(partes[0])
					|| !PURPOSE.equals(partes[1])) {
				throw new IllegalArgumentException("Propósito no válido.");
			}

			UUID.fromString(partes[2]);
			Long gimnasioId = Long.parseLong(partes[3]);
			Instant fechaExpiracion = Instant.ofEpochSecond(Long.parseLong(partes[4]));
			return new Claims(partes[2], gimnasioId, fechaExpiracion);
		} catch (RuntimeException error) {
			throw new IllegalArgumentException("La invitación no es válida.");
		}
	}

	private byte[] firmar(String payloadCodificado) {
		try {
			Mac mac = Mac.getInstance(HMAC_ALGORITHM);
			mac.init(new SecretKeySpec(secret, HMAC_ALGORITHM));
			return mac.doFinal(payloadCodificado.getBytes(StandardCharsets.UTF_8));
		} catch (Exception error) {
			throw new IllegalStateException("No se pudo firmar la invitación.", error);
		}
	}

	private String codificar(byte[] value) {
		return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
	}

	public record Claims(String publicId, Long gimnasioId, Instant fechaExpiracion) {
	}
}
