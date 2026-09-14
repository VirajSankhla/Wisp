package app.wisp.overlay;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

public class SyncServer {
    private ServerSocket server;
    private Thread thread;
    private volatile boolean running;

    public void start() {
        if (running) return;
        running = true;
        thread = new Thread(this::loop, "wisp-lan");
        thread.setDaemon(true);
        thread.start();
    }

    public void stop() {
        running = false;
        try {
            if (server != null) server.close();
        } catch (Exception ignored) {}
    }

    private void loop() {
        try (ServerSocket ss = new ServerSocket(OverlayHub.PORT)) {
            server = ss;
            while (running) {
                try {
                    Socket socket = ss.accept();
                    Thread worker = new Thread(() -> handle(socket));
                    worker.setDaemon(true);
                    worker.start();
                } catch (Exception closed) {
                    if (!running) return;
                }
            }
        } catch (Exception ignored) {}
    }

    private void handle(Socket socket) {
        try (Socket s = socket) {
            s.setSoTimeout(4000);
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(s.getInputStream(), StandardCharsets.UTF_8)
            );
            String line = reader.readLine();
            if (line == null) return;
            String method = line.startsWith("PUT") ? "PUT" : line.startsWith("OPTIONS") ? "OPTIONS" : "GET";
            int contentLength = 0;
            String header;
            while ((header = reader.readLine()) != null && !header.isEmpty()) {
                if (header.toLowerCase().startsWith("content-length:")) {
                    try {
                        contentLength = Integer.parseInt(header.substring(15).trim());
                    } catch (NumberFormatException ignored) {}
                }
            }
            String body = "";
            if (contentLength > 0 && contentLength < 1_000_000) {
                char[] buf = new char[contentLength];
                int read = 0;
                while (read < contentLength) {
                    int n = reader.read(buf, read, contentLength - read);
                    if (n < 0) break;
                    read += n;
                }
                body = new String(buf, 0, Math.max(0, read));
            }
            if ("PUT".equals(method) && !body.isEmpty()) {
                OverlayHub.receive(body);
            }
            String payload = "OPTIONS".equals(method) ? "" : OverlayHub.snapshot;
            byte[] bytes = payload.getBytes(StandardCharsets.UTF_8);
            String response =
                "HTTP/1.1 200 OK\r\n" +
                "Access-Control-Allow-Origin: *\r\n" +
                "Access-Control-Allow-Methods: GET, PUT, OPTIONS\r\n" +
                "Access-Control-Allow-Headers: content-type\r\n" +
                "Content-Type: application/json\r\n" +
                "Content-Length: " + bytes.length + "\r\n" +
                "Connection: close\r\n\r\n";
            OutputStream out = s.getOutputStream();
            out.write(response.getBytes(StandardCharsets.US_ASCII));
            if (bytes.length > 0) out.write(bytes);
            out.flush();
        } catch (Exception ignored) {}
    }
}
