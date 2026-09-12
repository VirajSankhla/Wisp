package app.wisp.overlay;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.IBinder;
import android.provider.Settings;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.content.res.AssetManager;
import android.webkit.MimeTypeMap;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.core.app.NotificationCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;
import java.io.IOException;
import java.io.InputStream;

public class OverlayService extends Service {
    public static final String PREF = "wisp_overlay";
    public static final String PREF_ENABLED = "enabled";
    public static final String ACTION_STOP = "app.wisp.overlay.STOP";

    private static final String CHANNEL = "wisp-edge";
    private static final int NOTIF = 71;
    private static volatile boolean running = false;

    private WindowManager windowManager;
    private View handleView;
    private View panelView;
    private boolean expanded = false;

    public static boolean isRunning() {
        return running;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        running = true;
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        startForeground(NOTIF, buildNotification());
        if (!Settings.canDrawOverlays(this)) {
            stopSelf();
            return;
        }
        showHandle();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            getSharedPreferences(PREF, MODE_PRIVATE).edit().putBoolean(PREF_ENABLED, false).apply();
            stopSelf();
            return START_NOT_STICKY;
        }
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        running = false;
        detach(handleView);
        detach(panelView);
        handleView = null;
        panelView = null;
        super.onDestroy();
    }

    public void collapse() {
        if (!expanded) return;
        expanded = false;
        detach(panelView);
        panelView = null;
        showHandle();
    }

    private void expand(boolean freshNote) {
        if (expanded) return;
        expanded = true;
        detach(handleView);
        handleView = null;
        showPanel(freshNote);
    }

    private void showHandle() {
        if (handleView != null) return;
        LinearLayout pill = new LinearLayout(this);
        pill.setOrientation(LinearLayout.VERTICAL);
        pill.setGravity(Gravity.CENTER_HORIZONTAL);
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(0xF01C1A17);
        bg.setCornerRadii(new float[] { dp(18), dp(18), 0, 0, 0, 0, dp(18), dp(18) });
        pill.setBackground(bg);
        pill.setPadding(0, dp(8), 0, dp(8));

        TextView plus = label("＋", 18);
        plus.setOnClickListener(v -> expand(true));
        TextView mark = label("W", 20);
        mark.setOnClickListener(v -> expand(false));
        TextView hint = label("notes", 10);
        hint.setTextColor(0xFF6F6A62);
        hint.setOnClickListener(v -> expand(false));

        pill.addView(plus);
        pill.addView(mark);
        pill.addView(hint);

        WindowManager.LayoutParams params = baseParams();
        params.width = dp(48);
        params.height = WindowManager.LayoutParams.WRAP_CONTENT;
        params.gravity = Gravity.END | Gravity.CENTER_VERTICAL;
        params.flags =
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL;
        handleView = pill;
        windowManager.addView(handleView, params);
    }

    private void showPanel(boolean freshNote) {
        Context ctx = getApplicationContext();
        WebView web = new WebView(ctx);
        web.setBackgroundColor(Color.TRANSPARENT);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        web.addJavascriptInterface(new WispNativeBridge(this), "WispNative");

        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .setDomain("localhost")
            .setHttpAllowed(false)
            .addPathHandler("/", new PublicAssetsHandler(ctx))
            .build();

        web.setWebViewClient(new WebViewClientCompat() {
            @Override
            public android.webkit.WebResourceResponse shouldInterceptRequest(
                WebView view,
                android.webkit.WebResourceRequest request
            ) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
                return false;
            }
        });

        String path = freshNote ? "/?overlay=1&new=1" : "/?overlay=1&open=1";
        web.loadUrl("https://localhost" + path);

        WindowManager.LayoutParams params = baseParams();
        params.width = dp(400);
        params.height = WindowManager.LayoutParams.MATCH_PARENT;
        params.gravity = Gravity.END | Gravity.TOP;
        params.flags =
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
            WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH;
        panelView = web;
        web.setOnTouchListener((v, event) -> {
            if (event.getAction() == android.view.MotionEvent.ACTION_OUTSIDE) {
                collapse();
                return true;
            }
            return false;
        });
        windowManager.addView(panelView, params);
    }

    private WindowManager.LayoutParams baseParams() {
        int type = Build.VERSION.SDK_INT >= 26
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            type,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        );
        params.softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE;
        return params;
    }

    private void detach(View view) {
        if (view == null || windowManager == null) return;
        try {
            windowManager.removeView(view);
        } catch (Exception ignored) {}
    }

    private TextView label(String text, int sp) {
        TextView view = new TextView(this);
        view.setText(text);
        view.setTextColor(0xFFC5CDD8);
        view.setGravity(Gravity.CENTER);
        view.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
        view.setPadding(dp(4), dp(10), dp(4), dp(10));
        return view;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private Notification buildNotification() {
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL,
                "Wisp edge",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Keeps the notes tab on the side of the screen");
            manager.createNotificationChannel(channel);
        }
        Intent stop = new Intent(this, OverlayService.class);
        stop.setAction(ACTION_STOP);
        PendingIntent stopPi = PendingIntent.getService(
            this,
            2,
            stop,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent content = launch == null
            ? stopPi
            : PendingIntent.getActivity(
                this,
                1,
                launch,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
        return new NotificationCompat.Builder(this, CHANNEL)
            .setContentTitle("Wisp is at the edge")
            .setContentText("Over other apps. Hide from the notification if you want it gone.")
            .setSmallIcon(android.R.drawable.ic_menu_edit)
            .setOngoing(true)
            .setContentIntent(content)
            .addAction(0, "Hide", stopPi)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }

    /** Capacitor copies the web app to assets/public. Map / → that folder. */
    private static final class PublicAssetsHandler implements WebViewAssetLoader.PathHandler {
        private final AssetManager assets;

        PublicAssetsHandler(Context ctx) {
            this.assets = ctx.getAssets();
        }

        @Override
        public WebResourceResponse handle(String path) {
            String rel = path == null ? "" : path;
            if (rel.startsWith("/")) rel = rel.substring(1);
            if (rel.isEmpty() || rel.endsWith("/")) rel = rel + "index.html";
            try {
                InputStream stream = assets.open("public/" + rel);
                return new WebResourceResponse(mime(rel), "utf-8", stream);
            } catch (IOException missing) {
                if (rel.contains(".")) return null;
                try {
                    return new WebResourceResponse(
                        "text/html",
                        "utf-8",
                        assets.open("public/index.html")
                    );
                } catch (IOException ignored) {
                    return null;
                }
            }
        }

        private static String mime(String rel) {
            String ext = MimeTypeMap.getFileExtensionFromUrl(rel);
            if (ext == null) ext = "";
            switch (ext) {
                case "js":
                case "mjs":
                    return "application/javascript";
                case "css":
                    return "text/css";
                case "svg":
                    return "image/svg+xml";
                case "json":
                    return "application/json";
                case "html":
                    return "text/html";
                case "png":
                    return "image/png";
                case "webp":
                    return "image/webp";
                case "woff2":
                    return "font/woff2";
                default:
                    String guessed = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
                    return guessed != null ? guessed : "application/octet-stream";
            }
        }
    }
}
