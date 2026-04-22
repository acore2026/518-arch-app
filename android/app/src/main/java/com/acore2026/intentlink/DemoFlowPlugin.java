package com.acore2026.intentlink;

import android.Manifest;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "DemoFlow",
    permissions = {
        @Permission(
            alias = "notifications",
            strings = { Manifest.permission.POST_NOTIFICATIONS }
        )
    }
)
public class DemoFlowPlugin extends Plugin {
    @PluginMethod
    public void ensureNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }

        if (getPermissionState("notifications") == PermissionState.GRANTED) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }

        requestPermissionForAlias("notifications", call, "notificationsPermissionCallback");
    }

    @PermissionCallback
    private void notificationsPermissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", getPermissionState("notifications") == PermissionState.GRANTED);
        call.resolve(result);
    }

    @PluginMethod
    public void scheduleLatencyAlert(PluginCall call) {
        String title = call.getString("title", getContext().getString(R.string.upgrade_confirmation_title));
        String body = call.getString("body", getContext().getString(R.string.upgrade_confirmation_message));
        Integer delayMs = call.getInt("delayMs", 6000);
        String upgradeAction = call.getString("upgradeAction", DemoFlowManager.DEFAULT_UPGRADE_ACTION);

        DemoFlowManager.scheduleLatencyAlert(getContext(), title, body, delayMs.longValue(), upgradeAction);
        call.resolve();
    }

    @PluginMethod
    public void consumePendingUpgradeAction(PluginCall call) {
        JSObject result = new JSObject();
        String action = DemoFlowManager.consumePendingUpgradeAction();
        if (action != null) {
            result.put("action", action);
        }
        call.resolve(result);
    }
}
