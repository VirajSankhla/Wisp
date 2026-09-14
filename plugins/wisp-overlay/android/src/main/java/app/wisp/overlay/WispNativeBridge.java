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
    public void resize(int width, int height) {
        main.post(() -> service.resizePanel(width, height));
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
