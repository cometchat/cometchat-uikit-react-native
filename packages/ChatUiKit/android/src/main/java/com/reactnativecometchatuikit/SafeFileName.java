package com.reactnativecometchatuikit;

import java.io.File;
import java.net.URI;

/**
 * Checks for the native copy and download code, kept free of Android classes so they can be unit
 * tested on the JVM. A destination name keeps only its base name, as the Android UI Kit's share copy
 * does (MediaViewerSource.copyForShare uses File(displayName).name). A local source must also lie
 * inside the offline media cache ({@link #confinedLocalFile}), which is stricter than the Android
 * UI Kit's MediaViewerSource.localFile (it only checks that the file exists).
 */
final class SafeFileName {

    private SafeFileName() {}

    /**
     * The base name of [name], so a `..` or a path separator can never leave the destination
     * folder, or null when there is no usable name (empty, `.`, `..`, or a NUL character).
     */
    static String of(String name) {
        if (name == null || name.indexOf('\0') >= 0) return null;
        String base = new File(name).getName();
        if (base.isEmpty() || base.equals(".") || base.equals("..")) return null;
        return base;
    }

    /** The path behind a `file://` [uri], or null for any other scheme or an empty path. */
    static String localPath(String uri) {
        if (uri == null) return null;
        try {
            URI parsed = new URI(uri);
            if (!"file".equalsIgnoreCase(parsed.getScheme())) return null;
            String path = parsed.getPath();
            return path == null || path.isEmpty() ? null : path;
        } catch (Exception e) {
            return null;
        }
    }

    /** True when [file] is an existing regular file that can be read. */
    static boolean isReadableLocalFile(File file) {
        return file != null && file.isFile() && file.canRead();
    }

    /** True when [uri] has the `file` scheme, in any letter case. */
    static boolean isFileUri(String uri) {
        return uri != null && uri.length() > 5 && uri.regionMatches(true, 0, "file:", 0, 5);
    }

    /**
     * The file behind a `file://` [uri] when it may be copied out of the app: after `..` and every
     * symlink are resolved, it is a readable regular file strictly inside one of [roots] (the offline
     * media cache). Anything else is null, so a message cannot name a private file of the app (its
     * database, its storage, `/etc/hosts`) and have it copied into public storage or shared.
     *
     * The Android UI Kit's MediaViewerSource.localFile only checks that the file exists, so it is not
     * the model here. The returned file is the resolved one: the caller reads exactly what was checked.
     */
    static File confinedLocalFile(String uri, File... roots) {
        String path = localPath(uri);
        if (path == null || roots == null) return null;
        try {
            File source = new File(path).getCanonicalFile();
            if (!isReadableLocalFile(source)) return null;
            String resolved = source.getPath();
            for (File root : roots) {
                if (root == null) continue;
                String base = root.getCanonicalPath();
                if (base.isEmpty() || base.equals(File.separator)) continue;
                if (resolved.startsWith(base + File.separator)) return source;
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }
}
