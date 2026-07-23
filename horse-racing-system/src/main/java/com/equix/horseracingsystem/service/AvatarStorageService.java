package com.equix.horseracingsystem.service;

import com.equix.horseracingsystem.controller.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class AvatarStorageService {

    public static final long MAX_AVATAR_BYTES = 5L * 1024 * 1024;
    private static final String PUBLIC_PREFIX = "/uploads/avatars/";
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp");
    private static final Logger log = LoggerFactory.getLogger(AvatarStorageService.class);

    private final Path directory;

    public AvatarStorageService(@Value("${app.upload.avatar-dir:uploads/avatars}") String directory) {
        this.directory = Path.of(directory).toAbsolutePath().normalize();
    }

    public String store(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose an avatar image to upload");
        }
        if (file.getSize() > MAX_AVATAR_BYTES) {
            throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "Image must not exceed 5 MB");
        }

        String contentType = file.getContentType() == null
                ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        String extension = EXTENSIONS.get(contentType);
        if (extension == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Avatar must be a JPG, PNG, or WebP image");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Avatar image could not be read");
        }
        if (!hasExpectedSignature(bytes, contentType)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Avatar file content does not match its image type");
        }

        String filename = userId + "-" + UUID.randomUUID() + extension;
        Path target = directory.resolve(filename).normalize();
        if (!target.getParent().equals(directory)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid avatar filename");
        }

        try {
            Files.createDirectories(directory);
            Files.write(target, bytes, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Avatar image could not be stored");
        }
        return PUBLIC_PREFIX + filename;
    }

    public void deleteManaged(String avatarUrl) {
        if (avatarUrl == null || !avatarUrl.startsWith(PUBLIC_PREFIX)) return;
        String filename = avatarUrl.substring(PUBLIC_PREFIX.length());
        if (filename.isBlank() || filename.contains("/") || filename.contains("\\")) return;
        Path target = directory.resolve(filename).normalize();
        if (!target.getParent().equals(directory)) return;
        try {
            Files.deleteIfExists(target);
        } catch (IOException exception) {
            log.warn("Could not delete replaced avatar {}", target.getFileName());
        }
    }

    private boolean hasExpectedSignature(byte[] bytes, String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> bytes.length >= 3
                    && unsigned(bytes[0]) == 0xFF && unsigned(bytes[1]) == 0xD8 && unsigned(bytes[2]) == 0xFF;
            case "image/png" -> bytes.length >= 8
                    && unsigned(bytes[0]) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47
                    && bytes[4] == 0x0D && bytes[5] == 0x0A && bytes[6] == 0x1A && bytes[7] == 0x0A;
            case "image/webp" -> bytes.length >= 12
                    && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                    && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P';
            default -> false;
        };
    }

    private int unsigned(byte value) {
        return Byte.toUnsignedInt(value);
    }
}
