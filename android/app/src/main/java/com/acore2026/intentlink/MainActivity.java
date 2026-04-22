package com.acore2026.intentlink;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DemoFlowPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
