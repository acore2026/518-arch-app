package com.acore2026.intentlink;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class UpgradeConfirmationActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_upgrade_confirmation);

        String title = getIntent().getStringExtra(DemoFlowManager.EXTRA_TITLE);
        if (title == null) {
            title = getString(R.string.upgrade_confirmation_title);
        }

        String body = getIntent().getStringExtra(DemoFlowManager.EXTRA_BODY);
        if (body == null) {
            body = getString(R.string.upgrade_confirmation_message);
        }

        String upgradeAction = getIntent().getStringExtra(DemoFlowManager.EXTRA_UPGRADE_ACTION);
        if (upgradeAction == null) {
            upgradeAction = DemoFlowManager.DEFAULT_UPGRADE_ACTION;
        }

        TextView titleView = findViewById(R.id.upgrade_confirmation_title);
        TextView messageView = findViewById(R.id.upgrade_confirmation_message);
        Button laterButton = findViewById(R.id.upgrade_confirmation_later);
        Button confirmButton = findViewById(R.id.upgrade_confirmation_confirm);

        titleView.setText(title);
        messageView.setText(body);

        final String finalUpgradeAction = upgradeAction;
        laterButton.setOnClickListener(v -> {
            DemoFlowManager.cancelLatencyNotification(this);
            finish();
        });

        confirmButton.setOnClickListener(v -> {
            DemoFlowManager.queuePendingUpgradeAction(finalUpgradeAction);
            DemoFlowManager.cancelLatencyNotification(this);

            Intent appIntent = new Intent(this, MainActivity.class);
            appIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(appIntent);
            finish();
        });
    }
}
