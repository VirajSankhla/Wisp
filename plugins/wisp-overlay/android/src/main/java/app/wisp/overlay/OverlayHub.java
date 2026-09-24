package app.wisp.overlay;

public final class OverlayHub {
    public static volatile long rev = 0;

    private OverlayHub() {}

    public static synchronized void bump() {
        rev += 1;
    }
}
