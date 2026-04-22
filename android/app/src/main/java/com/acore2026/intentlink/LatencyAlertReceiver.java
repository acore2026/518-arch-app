package com.acore2026.intentlink;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class LatencyAlertReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String title = intent.getStringExtra(DemoFlowManager.EXTRA_TITLE);
        if (title == null) {
            title = context.getString(R.string.upgrade_confirmation_title);
        }

        String body = intent.getStringExtra(DemoFlowManager.EXTRA_BODY);
        if (body == null) {
            body = context.getString(R.string.upgrade_confirmation_message);
        }

        String upgradeAction = intent.getStringExtra(DemoFlowManager.EXTRA_UPGRADE_ACTION);
        if (upgradeAction == null) {
            upgradeAction = DemoFlowManager.DEFAULT_UPGRADE_ACTION;
        }

        DemoFlowManager.showLatencyNotification(context, title, body, upgradeAction);
    }
}
