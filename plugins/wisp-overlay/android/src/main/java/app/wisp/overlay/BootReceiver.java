package app.wisp.overlay;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            return;
        }
        boolean enabled =
            context.getSharedPreferences(OverlayService.PREF, Context.MODE_PRIVATE)
                .getBoolean(OverlayService.PREF_ENABLED, false);
        if (!enabled || !Settings.canDrawOverlays(context)) return;
        Intent service = new Intent(context, OverlayService.class);
        if (Build.VERSION.SDK_INT >= 26) {
            context.startForegroundService(service);
        } else {
            context.startService(service);
        }
    }
}
