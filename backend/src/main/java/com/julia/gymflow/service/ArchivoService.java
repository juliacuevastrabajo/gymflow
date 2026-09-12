package com.julia.gymflow.service;

import com.julia.gymflow.dto.ArchivoSubidoResponse;
import com.julia.gymflow.entity.ArchivoSubido;
import com.julia.gymflow.entity.EstadoArchivoSubido;
import com.julia.gymflow.entity.FinalidadArchivo;
import com.julia.gymflow.entity.Gimnasio;
import com.julia.gymflow.entity.RolUsuario;
import com.julia.gymflow.entity.TipoArchivoSubido;
import com.julia.gymflow.entity.Usuario;
import com.julia.gymflow.repository.ArchivoSubidoRepository;
import com.julia.gymflow.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ArchivoService {

    static final long TAMANO_MAXIMO_IMAGEN = 8L * 1024L * 1024L;
    static final long TAMANO_MAXIMO_VIDEO = 80L * 1024L * 1024L;
    private static final int MAX_SUBIDAS_VENTANA = 30;
    private static final Duration VENTANA_SUBIDAS = Duration.ofMinutes(10);
    private static final int CABECERA_MAXIMA = 8192;
    private static final Map<String, String> MIME_DECLARADO_NORMALIZADO = Map.of(
            "image/jpg", "image/jpeg",
            "image/jpeg", "image/jpeg",
            "image/png", "image/png",
            "image/webp", "image/webp",
            "video/mp4", "video/mp4",
            "video/quicktime", "video/quicktime",
            "video/webm", "video/webm"
    );

    private final Path directorio;
    private final Path directorioTemporal;
    private final ArchivoSubidoRepository archivoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuthTokenService authTokenService;
    private final ConcurrentHashMap<Long, Deque<Instant>> subidasPorUsuario = new ConcurrentHashMap<>();

    public ArchivoService(
            @Value("${gymflow.upload-dir:uploads}") String uploadDir,
            ArchivoSubidoRepository archivoRepository,
            UsuarioRepository usuarioRepository,
            AuthTokenService authTokenService
    ) {
        this.directorio = Path.of(uploadDir).toAbsolutePath().normalize();
        this.directorioTemporal = directorio.resolve(".tmp").normalize();
        this.archivoRepository = archivoRepository;
        this.usuarioRepository = usuarioRepository;
        this.authTokenService = authTokenService;

        try {
            Files.createDirectories(this.directorio);
            Files.createDirectories(this.directorioTemporal);
        } catch (IOException error) {
            throw new IllegalStateException("No se pudo preparar la carpeta de archivos.", error);
        }
    }

    public ArchivoSubidoResponse guardarImagen(
            String authorizationHeader,
            MultipartFile archivo,
            FinalidadArchivo finalidad,
            Long objetivoUsuarioId
    ) {
        Usuario actor = obtenerActorActivo(authorizationHeader);
        validarFinalidad(actor, finalidad, objetivoUsuarioId, false);
        return guardarTemporal(actor, archivo, finalidad, TAMANO_MAXIMO_IMAGEN, false);
    }

    public ArchivoSubidoResponse guardarMultimedia(
            String authorizationHeader,
            MultipartFile archivo,
            FinalidadArchivo finalidad
    ) {
        Usuario actor = obtenerActorActivo(authorizationHeader);
        validarFinalidad(actor, finalidad, null, true);
        return guardarTemporal(actor, archivo, finalidad, TAMANO_MAXIMO_VIDEO, true);
    }

    public Path getDirectorio() {
        return directorio;
    }

    private ArchivoSubidoResponse guardarTemporal(
            Usuario actor,
            MultipartFile archivo,
            FinalidadArchivo finalidad,
            long limiteInicial,
            boolean permiteVideo
    ) {
        validarLimiteSubidas(actor.getId());
        if (archivo == null || archivo.isEmpty() || archivo.getSize() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un archivo con contenido.");
        }
        if (archivo.getSize() > limiteInicial) {
            throw demasiadoGrande(permiteVideo ? "El archivo no puede superar los 80 MB." : "La imagen no puede superar los 8 MB.");
        }

        Path temporal = crearRutaTemporal();
        Path definitivo = null;
        try {
            long tamano = copiarConLimite(archivo, temporal, limiteInicial);
            FormatoDetectado formato = detectarFormato(temporal, tamano);
            validarFormatoDeclarado(archivo.getContentType(), formato);
            if (!permiteVideo && formato.tipo() != TipoArchivoSubido.IMAGEN) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este flujo solo admite imagenes.");
            }
            if (formato.tipo() == TipoArchivoSubido.IMAGEN && tamano > TAMANO_MAXIMO_IMAGEN) {
                throw demasiadoGrande("La imagen no puede superar los 8 MB.");
            }
            if (formato.tipo() == TipoArchivoSubido.VIDEO && finalidad != FinalidadArchivo.MULTIMEDIA_EJERCICIO) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La finalidad seleccionada no admite video.");
            }

            UUID identificador = UUID.randomUUID();
            String nombreFisico = identificador + formato.extension();
            definitivo = rutaConfinada(nombreFisico);
            moverAtomico(temporal, definitivo);

            ArchivoSubido metadatos = new ArchivoSubido();
            metadatos.setIdentificadorPublico(identificador.toString());
            metadatos.setNombreFisico(nombreFisico);
            metadatos.setUrl("/uploads/" + nombreFisico);
            metadatos.setMimeDetectado(formato.mime());
            metadatos.setTipo(formato.tipo());
            metadatos.setFinalidad(finalidad);
            metadatos.setTamano(tamano);
            metadatos.setSubidoPor(actor);
            metadatos.setGimnasio(actor.getGimnasio());
            LocalDateTime ahora = LocalDateTime.now();
            metadatos.setFechaCreacion(ahora);
            metadatos.setFechaEstado(ahora);
            metadatos.setEstado(EstadoArchivoSubido.TEMPORAL);

            try {
                return new ArchivoSubidoResponse(archivoRepository.save(metadatos));
            } catch (RuntimeException error) {
                borrarSilenciosamente(definitivo);
                throw error;
            }
        } catch (ResponseStatusException error) {
            throw error;
        } catch (IOException error) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo guardar el archivo.", error);
        } finally {
            borrarSilenciosamente(temporal);
        }
    }

    private Usuario obtenerActorActivo(String authorizationHeader) {
        Long usuarioId = authTokenService.obtenerUsuarioId(authorizationHeader);
        Usuario actor = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion no valida."));
        Gimnasio gimnasio = actor.getGimnasio();
        if (!actor.isActivo() || gimnasio == null || gimnasio.getId() == null || !gimnasio.isActivo()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La cuenta no puede subir archivos.");
        }
        return actor;
    }

    private void validarFinalidad(
            Usuario actor,
            FinalidadArchivo finalidad,
            Long objetivoUsuarioId,
            boolean endpointMultimedia
    ) {
        if (finalidad == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Indica la finalidad del archivo.");
        }
        if (endpointMultimedia && finalidad != FinalidadArchivo.MULTIMEDIA_EJERCICIO) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La subida multimedia solo puede utilizarse en ejercicios.");
        }

        switch (finalidad) {
            case FOTO_PERFIL -> validarFotoPerfil(actor, objetivoUsuarioId);
            case FONDO_GIMNASIO, PORTADA_CLASE -> {
                if (actor.getRol() != RolUsuario.ADMIN) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo administracion puede subir este archivo.");
                }
            }
            case MULTIMEDIA_EJERCICIO -> {
                if (actor.getRol() != RolUsuario.ADMIN && actor.getRol() != RolUsuario.ENTRENADOR) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permisos para gestionar ejercicios.");
                }
            }
        }
    }

    private void validarFotoPerfil(Usuario actor, Long objetivoUsuarioId) {
        if (actor.getRol() == RolUsuario.ADMIN) {
            if (objetivoUsuarioId == null) {
                return;
            }
            Usuario objetivo = usuarioRepository.findById(objetivoUsuarioId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuario de destino no encontrado."));
            if (!mismoGimnasio(actor, objetivo)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El usuario pertenece a otro gimnasio.");
            }
            if (objetivo.getRol() == RolUsuario.ADMIN && !Objects.equals(actor.getId(), objetivo.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes cambiar la foto de otro administrador.");
            }
            return;
        }

        if (objetivoUsuarioId != null && !Objects.equals(actor.getId(), objetivoUsuarioId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo puedes subir tu propia foto.");
        }
        if (actor.getRol() == RolUsuario.CLIENTE && actor.getGimnasio().isClientesPuedenCambiarFotoPerfil()) {
            return;
        }
        if (actor.getRol() == RolUsuario.ENTRENADOR && actor.getGimnasio().isEntrenadoresPuedenCambiarFotoPerfil()) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El gimnasio no permite cambiar la foto de perfil.");
    }

    private boolean mismoGimnasio(Usuario a, Usuario b) {
        return a.getGimnasio() != null && b.getGimnasio() != null
                && Objects.equals(a.getGimnasio().getId(), b.getGimnasio().getId());
    }

    private void validarLimiteSubidas(Long usuarioId) {
        Instant ahora = Instant.now();
        Instant inicioVentana = ahora.minus(VENTANA_SUBIDAS);
        Deque<Instant> marcas = subidasPorUsuario.computeIfAbsent(usuarioId, ignored -> new ArrayDeque<>());
        synchronized (marcas) {
            while (!marcas.isEmpty() && marcas.peekFirst().isBefore(inicioVentana)) {
                marcas.removeFirst();
            }
            if (marcas.size() >= MAX_SUBIDAS_VENTANA) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Has realizado demasiadas subidas. Espera unos minutos.");
            }
            marcas.addLast(ahora);
        }
    }

    private Path crearRutaTemporal() {
        return directorioTemporal.resolve(UUID.randomUUID() + ".part").normalize();
    }

    private long copiarConLimite(MultipartFile archivo, Path destino, long limite) throws IOException {
        long total = 0;
        byte[] buffer = new byte[8192];
        try (InputStream entrada = archivo.getInputStream();
             OutputStream salida = Files.newOutputStream(destino, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE)) {
            int leidos;
            while ((leidos = entrada.read(buffer)) != -1) {
                total += leidos;
                if (total > limite) {
                    throw demasiadoGrande("El archivo supera el tamano maximo permitido.");
                }
                salida.write(buffer, 0, leidos);
            }
        }
        if (total == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo esta vacio.");
        }
        return total;
    }

    private FormatoDetectado detectarFormato(Path archivo, long tamano) throws IOException {
        int cantidad = (int) Math.min(tamano, CABECERA_MAXIMA);
        byte[] cabecera = new byte[cantidad];
        try (InputStream entrada = Files.newInputStream(archivo)) {
            int offset = 0;
            while (offset < cantidad) {
                int leidos = entrada.read(cabecera, offset, cantidad - offset);
                if (leidos < 0) break;
                offset += leidos;
            }
        }

        if (esJpeg(cabecera, archivo, tamano)) {
            return new FormatoDetectado("image/jpeg", ".jpg", TipoArchivoSubido.IMAGEN);
        }
        if (esPng(cabecera, archivo, tamano)) {
            return new FormatoDetectado("image/png", ".png", TipoArchivoSubido.IMAGEN);
        }
        if (esWebp(cabecera, tamano)) {
            return new FormatoDetectado("image/webp", ".webp", TipoArchivoSubido.IMAGEN);
        }
        if (esWebm(cabecera)) {
            return new FormatoDetectado("video/webm", ".webm", TipoArchivoSubido.VIDEO);
        }
        String mimeIso = detectarIsoBaseMedia(cabecera);
        if (mimeIso != null) {
            return "video/quicktime".equals(mimeIso)
                    ? new FormatoDetectado(mimeIso, ".mov", TipoArchivoSubido.VIDEO)
                    : new FormatoDetectado(mimeIso, ".mp4", TipoArchivoSubido.VIDEO);
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El contenido del archivo no corresponde a un formato permitido.");
    }

    private void validarFormatoDeclarado(String mimeDeclarado, FormatoDetectado formato) {
        String normalizado = MIME_DECLARADO_NORMALIZADO.get(
                mimeDeclarado == null ? "" : mimeDeclarado.split(";", 2)[0].trim().toLowerCase(Locale.ROOT)
        );
        if (normalizado == null || !normalizado.equals(formato.mime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El tipo declarado no coincide con el contenido del archivo.");
        }
    }

    private boolean esJpeg(byte[] b, Path archivo, long tamano) throws IOException {
        return b.length >= 4 && byteSinSigno(b[0]) == 0xff && byteSinSigno(b[1]) == 0xd8
                && byteSinSigno(b[2]) == 0xff && terminaCon(archivo, tamano, new byte[]{(byte) 0xff, (byte) 0xd9});
    }

    private boolean esPng(byte[] b, Path archivo, long tamano) throws IOException {
        byte[] firma = new byte[]{(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
        byte[] finalPng = new byte[]{0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44};
        return empiezaCon(b, firma) && b.length >= 16
                && b[12] == 0x49 && b[13] == 0x48 && b[14] == 0x44 && b[15] == 0x52
                && contieneAlFinal(archivo, tamano, finalPng, 12);
    }

    private boolean esWebp(byte[] b, long tamano) {
        if (b.length < 16 || !texto(b, 0, 4).equals("RIFF") || !texto(b, 8, 4).equals("WEBP")) return false;
        String subtipo = texto(b, 12, 4);
        long tamanoRiff = Integer.toUnsignedLong(ByteBuffer.wrap(b, 4, 4).order(ByteOrder.LITTLE_ENDIAN).getInt());
        return (subtipo.equals("VP8 ") || subtipo.equals("VP8L") || subtipo.equals("VP8X"))
                && tamanoRiff + 8 == tamano;
    }

    private boolean esWebm(byte[] b) {
        if (b.length < 8 || byteSinSigno(b[0]) != 0x1a || byteSinSigno(b[1]) != 0x45
                || byteSinSigno(b[2]) != 0xdf || byteSinSigno(b[3]) != 0xa3) return false;
        return new String(b, StandardCharsets.ISO_8859_1).toLowerCase(Locale.ROOT).contains("webm");
    }

    private String detectarIsoBaseMedia(byte[] b) {
        if (b.length < 16 || !texto(b, 4, 4).equals("ftyp")) return null;
        long caja = Integer.toUnsignedLong(ByteBuffer.wrap(b, 0, 4).order(ByteOrder.BIG_ENDIAN).getInt());
        if (caja < 16 || caja > b.length) return null;
        String marca = texto(b, 8, 4);
        return marca.equals("qt  ") ? "video/quicktime" : "video/mp4";
    }

    private boolean empiezaCon(byte[] datos, byte[] firma) {
        if (datos.length < firma.length) return false;
        for (int i = 0; i < firma.length; i++) if (datos[i] != firma[i]) return false;
        return true;
    }

    private boolean terminaCon(Path archivo, long tamano, byte[] firma) throws IOException {
        return contieneAlFinal(archivo, tamano, firma, firma.length);
    }

    private boolean contieneAlFinal(Path archivo, long tamano, byte[] firma, int ventana) throws IOException {
        if (tamano < ventana) return false;
        byte[] finalArchivo = new byte[ventana];
        try (var canal = Files.newByteChannel(archivo, StandardOpenOption.READ)) {
            canal.position(tamano - ventana);
            canal.read(ByteBuffer.wrap(finalArchivo));
        }
        for (int inicio = 0; inicio <= finalArchivo.length - firma.length; inicio++) {
            boolean coincide = true;
            for (int i = 0; i < firma.length; i++) {
                if (finalArchivo[inicio + i] != firma[i]) { coincide = false; break; }
            }
            if (coincide) return true;
        }
        return false;
    }

    private String texto(byte[] datos, int inicio, int longitud) {
        return new String(datos, inicio, longitud, StandardCharsets.US_ASCII);
    }

    private int byteSinSigno(byte valor) {
        return valor & 0xff;
    }

    private Path rutaConfinada(String nombreFisico) {
        Path ruta = directorio.resolve(nombreFisico).normalize();
        if (!ruta.startsWith(directorio) || ruta.startsWith(directorioTemporal)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ruta de archivo no valida.");
        }
        return ruta;
    }

    private void moverAtomico(Path origen, Path destino) throws IOException {
        try {
            Files.move(origen, destino, StandardCopyOption.ATOMIC_MOVE);
        } catch (AtomicMoveNotSupportedException error) {
            Files.move(origen, destino);
        }
    }

    private void borrarSilenciosamente(Path archivo) {
        if (archivo == null) return;
        try {
            if (archivo.normalize().startsWith(directorio)) Files.deleteIfExists(archivo);
        } catch (IOException ignored) {
            // La limpieza programada recupera cualquier temporal que no pueda retirarse aqui.
        }
    }

    private ResponseStatusException demasiadoGrande(String mensaje) {
        return new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, mensaje);
    }

    private record FormatoDetectado(String mime, String extension, TipoArchivoSubido tipo) {}
}
