package app.wisp.overlay;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WispOverlay")
public class WispOverlayPlugin extends Plugin {

    @PluginMethod
    public void canDrawOverlays(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("value", Settings.canDrawOverlays(getContext()));
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        Intent intent = new Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:" + getContext().getPackageName())
        );
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void start(PluginCall call) {
        Context ctx = getContext();
        if (!Settings.canDrawOverlays(ctx)) {
            call.reject("Allow “Display over other apps” for Wisp, then try again.");
            return;
        }
        ctx.getSharedPreferences(OverlayService.PREF, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(OverlayService.PREF_ENABLED, true)
            .apply();
        Intent service = new Intent(ctx, OverlayService.class);
        if (Build.VERSION.SDK_INT >= 26) {
            ctx.startForegroundService(service);
        } else {
            ctx.startService(service);
        }
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Context ctx = getContext();
        ctx.getSharedPreferences(OverlayService.PREF, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(OverlayService.PREF_ENABLED, false)
            .apply();
        ctx.stopService(new Intent(ctx, OverlayService.class));
        call.resolve();
    }

    @PluginMethod
    public void isRunning(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("value", OverlayService.isRunning());
        call.resolve(ret);
    }

    @PluginMethod
    public void localAddress(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("value", OverlayHub.ipv4());
        call.resolve(ret);
    }

    @PluginMethod
    public void publishSnapshot(PluginCall call) {
        OverlayHub.publish(call.getString("json", ""));
        call.resolve();
    }

    @PluginMethod
    public void takeIncoming(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("value", OverlayHub.takeIncoming());
        call.resolve(ret);
    }

    @PluginMethod
    public void resize(PluginCall call) {
        call.resolve();
    }

    @PluginMethod
    public void setLook(PluginCall call) {
        int handleDp = call.getInt("handleDp", 44);
        Context ctx = getContext();
        ctx.getSharedPreferences(OverlayService.PREF, Context.MODE_PRIVATE)
            .edit()
            .putInt(OverlayService.PREF_HANDLE, handleDp)
            .apply();
        OverlayService.applyHandleDp(handleDp);
        call.resolve();
    }

    @PluginMethod
    public void readStore(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("value", OverlayStore.read(getContext(), call.getString("name", "")));
        call.resolve(ret);
    }

    @PluginMethod
    public void writeStore(PluginCall call) {
        OverlayStore.write(
            getContext(),
            call.getString("name", ""),
            call.getString("json", "")
        );
        call.resolve();
    }

    @PluginMethod
    public void storeRev(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("value", OverlayHub.rev);
        call.resolve(ret);
    }

    @Override
    public void handleOnResume() {
        OverlayService.setAppForeground(true);
    }

    @Override
    public void handleOnPause() {
        OverlayService.setAppForeground(false);
    }
}
