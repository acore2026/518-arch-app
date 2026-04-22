package com.acore2026.intentlink;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.SystemClock;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

public final class DemoFlowManager {
    public static final String CHANNEL_ID = "intentlink_latency_alerts";
    public static final String ACTION_SHOW_LATENCY_ALERT = "com.acore2026.intentlink.SHOW_LATENCY_ALERT";
    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_BODY = "body";
    public static final String EXTRA_UPGRADE_ACTION = "upgradeAction";
    public static final String DEFAULT_UPGRADE_ACTION = "gaming-upgrade";

    private static final int ALERT_REQUEST_CODE = 6101;
    private static final int CONFIRM_REQUEST_CODE = 6102;
    private static final int LATENCY_NOTIFICATION_ID = 6103;

    private static volatile String pendingUpgradeAction;

    private DemoFlowManager() {}

    public static void scheduleLatencyAlert(Context context, String title, String body, long delayMs, String upgradeAction) {
        ensureNotificationChannel(context);

        Intent intent = new Intent(context, LatencyAlertReceiver.class)
            .setAction(ACTION_SHOW_LATENCY_ALERT)
            .putExtra(EXTRA_TITLE, title)
            .putExtra(EXTRA_BODY, body)
            .putExtra(EXTRA_UPGRADE_ACTION, upgradeAction);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            ALERT_REQUEST_CODE,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        long triggerAt = SystemClock.elapsedRealtime() + Math.max(delayMs, 2000L);

        if (alarmManager == null) {
            showLatencyNotification(context, title, body, upgradeAction);
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pendingIntent);
        } else {
            alarmManager.setExact(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pendingIntent);
        }
    }

    public static void showLatencyNotification(Context context, String title, String body, String upgradeAction) {
        ensureNotificationChannel(context);

        Intent confirmIntent = new Intent(context, UpgradeConfirmationActivity.class)
            .putExtra(EXTRA_TITLE, title)
            .putExtra(EXTRA_BODY, body)
            .putExtra(EXTRA_UPGRADE_ACTION, upgradeAction)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        PendingIntent fixIntent = PendingIntent.getActivity(
            context,
            CONFIRM_REQUEST_CODE,
            confirmIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher_foreground)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setContentIntent(fixIntent)
            .addAction(android.R.drawable.ic_menu_manage, context.getString(R.string.latency_notification_fix), fixIntent);

        NotificationManagerCompat.from(context).notify(LATENCY_NOTIFICATION_ID, builder.build());
    }

    public static void ensureNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager notificationManager = context.getSystemService(NotificationManager.class);
        if (notificationManager == null || notificationManager.getNotificationChannel(CHANNEL_ID) != null) {
            return;
        }

        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            context.getString(R.string.latency_notification_channel_name),
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription(context.getString(R.string.latency_notification_channel_description));
        channel.enableVibration(true);
        channel.enableLights(true);
        notificationManager.createNotificationChannel(channel);
    }

    public static void queuePendingUpgradeAction(String action) {
        pendingUpgradeAction = action;
    }

    public static String consumePendingUpgradeAction() {
        String action = pendingUpgradeAction;
        pendingUpgradeAction = null;
        return action;
    }

    public static void cancelLatencyNotification(Context context) {
        NotificationManagerCompat.from(context).cancel(LATENCY_NOTIFICATION_ID);
    }
}
