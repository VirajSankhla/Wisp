package app.wisp.overlay;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Enumeration;

public final class OverlayHub {
    public static final int PORT = 17892;
    public static volatile String snapshot = "";
    public static volatile String incoming = "";

    private OverlayHub() {}

    public static synchronized void publish(String json) {
        if (json == null) return;
        snapshot = json;
    }

    public static synchronized void receive(String json) {
        if (json == null || json.isEmpty()) return;
        incoming = json;
    }

    public static synchronized String takeIncoming() {
        String next = incoming;
        incoming = "";
        return next == null ? "" : next;
    }

    public static String ipv4() {
        try {
            Enumeration<NetworkInterface> nets = NetworkInterface.getNetworkInterfaces();
            while (nets.hasMoreElements()) {
                NetworkInterface nif = nets.nextElement();
                if (!nif.isUp() || nif.isLoopback()) continue;
                Enumeration<InetAddress> addrs = nif.getInetAddresses();
                while (addrs.hasMoreElements()) {
                    InetAddress addr = addrs.nextElement();
                    if (addr instanceof Inet4Address && addr.isSiteLocalAddress()) {
                        return addr.getHostAddress();
                    }
                }
            }
        } catch (Exception ignored) {}
        return "";
    }
}
