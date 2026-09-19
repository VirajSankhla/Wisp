package app.wisp.overlay;

import android.content.Context;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

public final class OverlayStore {
    private OverlayStore() {}

    public static synchronized void write(Context ctx, String name, String json) {
        if (ctx == null || json == null) return;
        try {
            FileOutputStream out = new FileOutputStream(file(ctx, name));
            out.write(json.getBytes(StandardCharsets.UTF_8));
            out.close();
            OverlayHub.bump();
        } catch (Exception ignored) {}
    }

    public static synchronized String read(Context ctx, String name) {
        if (ctx == null) return "";
        try {
            File f = file(ctx, name);
            if (!f.exists() || f.length() == 0) return "";
            byte[] buf = new byte[(int) f.length()];
            FileInputStream in = new FileInputStream(f);
            int n = in.read(buf);
            in.close();
            if (n <= 0) return "";
            return new String(buf, 0, n, StandardCharsets.UTF_8);
        } catch (Exception ignored) {
            return "";
        }
    }

    private static File file(Context ctx, String name) {
        String filename = "wisp-misc.json";
        if ("wisp.notes.v1".equals(name)) filename = "wisp-notes.json";
        else if ("wisp.prefs.v1".equals(name)) filename = "wisp-prefs.json";
        return new File(ctx.getFilesDir(), filename);
    }
}
