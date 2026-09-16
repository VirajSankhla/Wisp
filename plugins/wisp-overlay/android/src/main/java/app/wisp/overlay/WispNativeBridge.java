package app.wisp.overlay;

import android.os.Handler;
import android.os.Looper;
import android.webkit.JavascriptInterface;

public class WispNativeBridge {
    private final OverlayService service;
    private final Handler main = new Handler(Looper.getMainLooper());

    public WispNativeBridge(OverlayService service) {
        this.service = service;
    }

    @JavascriptInterface
    public void collapse() {
        main.post(service::collapse);
    }

    @JavascriptInterface
    public void resize(double width, double height) {
        int w = (int) Math.round(width);
        int h = (int) Math.round(height);
        main.post(() -> service.resizePanel(w, h));
    }

    @JavascriptInterface
    public void publishSnapshot(String json) {
        OverlayHub.publish(json);
    }

    @JavascriptInterface
    public String takeIncoming() {
        return OverlayHub.takeIncoming();
    }

    @JavascriptInterface
    public String localAddress() {
        return OverlayHub.ipv4();
    }
}
