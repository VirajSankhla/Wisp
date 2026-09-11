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
}
