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
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.content.res.AssetManager;
import android.webkit.MimeTypeMap;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.ImageView;
import androidx.core.app.NotificationCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;
import java.io.IOException;
import java.io.InputStream;

public class OverlayService extends Service {
    public static final String PREF = "wisp_overlay";
    public static final String PREF_ENABLED = "enabled";
    public static final String PREF_PEEK = "peek";
    public static final String PREF_Y = "y";
    public static final String ACTION_STOP = "app.wisp.overlay.STOP";

    private static final String CHANNEL = "wisp-edge";
    private static final int NOTIF = 71;
    private static volatile boolean running = false;

    private WindowManager windowManager;
    private View handleView;
    private View panelView;
    private ImageView dropView;
    private View nubView;
    private boolean expanded = false;
    private boolean peeked = false;
    private int handleY = 0;
    private final SyncServer syncServer = new SyncServer();
    private int handleY = 0;
    private float downRawX;
    private float downRawY;
    private int downY;
    private boolean moved;

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
        peeked = getSharedPreferences(PREF, MODE_PRIVATE).getBoolean(PREF_PEEK, false);
        handleY = getSharedPreferences(PREF, MODE_PRIVATE).getInt(PREF_Y, -1);
        syncServer.start();
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
        syncServer.stop();
        detach(handleView);
        detach(panelView);
        handleView = null;
        panelView = null;
        super.onDestroy();
    }

    public void resizePanel(int cssWidth, int cssHeight) {
        if (!expanded || panelView == null || windowManager == null) return;
        float density = getResources().getDisplayMetrics().density;
        int w = Math.max(dp(160), Math.round(cssWidth * density) + dp(4));
        int h = Math.max(dp(56), Math.round(cssHeight * density) + dp(4));
        int maxH = (int) (screenH() * 0.7f);
        if (h > maxH) h = maxH;
        WindowManager.LayoutParams params = (WindowManager.LayoutParams) panelView.getLayoutParams();
        params.width = w;
        params.height = h;
        try {
            windowManager.updateViewLayout(panelView, params);
        } catch (Exception ignored) {}
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
        FrameLayout bubble = new FrameLayout(this);
        dropView = new ImageView(this);
        dropView.setImageResource(R.drawable.wisp_drop);
        dropView.setPadding(dp(11), dp(11), dp(11), dp(11));
        bubble.addView(
            dropView,
            new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        );
        nubView = new View(this);
        GradientDrawable line = new GradientDrawable();
        line.setColor(0xD9C5CDD8);
        line.setCornerRadii(new float[] { dp(4), dp(4), 0, 0, 0, 0, dp(4), dp(4) });
        nubView.setBackground(line);
        FrameLayout.LayoutParams nubLp = new FrameLayout.LayoutParams(dp(5), dp(36));
        nubLp.gravity = Gravity.END | Gravity.CENTER_VERTICAL;
        bubble.addView(nubView, nubLp);
        bubble.setOnTouchListener(this::onHandleTouch);
        handleView = bubble;
        if (handleY < 0) {
            handleY = Math.max(dp(80), screenH() / 2 - dp(22));
        }
        applyHandleLayout();
        windowManager.addView(handleView, handleParams());
    }

    private boolean onHandleTouch(View view, MotionEvent event) {
        switch (event.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                downRawX = event.getRawX();
                downRawY = event.getRawY();
                downY = handleY;
                moved = false;
                return true;
            case MotionEvent.ACTION_MOVE: {
                float dx = event.getRawX() - downRawX;
                float dy = event.getRawY() - downRawY;
                if (Math.abs(dx) + Math.abs(dy) > dp(6)) moved = true;
                handleY = clampY(downY + (int) dy);
                if (!peeked && dx > dp(28)) {
                    peeked = true;
                    persistHandle();
                } else if (peeked && dx < -dp(22)) {
                    peeked = false;
                    persistHandle();
                }
                windowManager.updateViewLayout(handleView, handleParams());
                return true;
            }
            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_CANCEL:
                if (!moved) {
                    if (peeked) {
                        peeked = false;
                        persistHandle();
                        windowManager.updateViewLayout(handleView, handleParams());
                    } else {
                        expand(false);
                    }
                } else {
                    persistHandle();
                    windowManager.updateViewLayout(handleView, handleParams());
                }
                return true;
            default:
                return false;
        }
    }

    private void persistHandle() {
        getSharedPreferences(PREF, MODE_PRIVATE)
            .edit()
            .putBoolean(PREF_PEEK, peeked)
            .putInt(PREF_Y, handleY)
            .apply();
    }

    private void applyHandleLayout() {
        if (handleView == null) return;
        FrameLayout bubble = (FrameLayout) handleView;
        bubble.setBackgroundColor(Color.TRANSPARENT);
        if (peeked) {
            GradientDrawable circle = new GradientDrawable();
            circle.setShape(GradientDrawable.OVAL);
            circle.setColor(Color.TRANSPARENT);
            bubble.setBackground(circle);
            if (dropView != null) dropView.setVisibility(View.INVISIBLE);
            if (nubView != null) nubView.setVisibility(View.VISIBLE);
        } else {
            GradientDrawable circle = new GradientDrawable();
            circle.setShape(GradientDrawable.OVAL);
            circle.setColor(0xF01C1A17);
            circle.setStroke(dp(1), 0x44F3EFE7);
            bubble.setBackground(circle);
            if (dropView != null) dropView.setVisibility(View.VISIBLE);
            if (nubView != null) nubView.setVisibility(View.INVISIBLE);
        }
    }

    private WindowManager.LayoutParams handleParams() {
        applyHandleLayout();
        WindowManager.LayoutParams params = baseParams();
        if (peeked) {
            params.width = dp(22);
            params.height = dp(52);
            params.x = 0;
        } else {
            params.width = dp(44);
            params.height = dp(44);
            params.x = dp(8);
        }
        params.gravity = Gravity.TOP | Gravity.END;
        params.y = handleY;
        params.flags =
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL;
        return params;
    }

    private int screenH() {
        return getResources().getDisplayMetrics().heightPixels;
    }

    private int clampY(int y) {
        int max = Math.max(dp(24), screenH() - dp(80));
        if (y < dp(24)) return dp(24);
        if (y > max) return max;
        return y;
    }

    private void showPanel(boolean freshNote) {
        Context ctx = getApplicationContext();
        WebView web = new WebView(ctx);
        web.setBackgroundColor(Color.TRANSPARENT);
        web.setLayerType(View.LAYER_TYPE_HARDWARE, null);
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
        params.width = dp(220);
        params.height = dp(72);
        params.gravity = Gravity.TOP | Gravity.END;
        params.x = dp(8);
        params.y = Math.max(dp(48), handleY - dp(8));
        params.flags =
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
            WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH;
        panelView = web;
        web.setOnTouchListener((v, event) -> {
            if (event.getAction() == MotionEvent.ACTION_OUTSIDE) {
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
