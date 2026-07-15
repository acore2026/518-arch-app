package com.acore2026.intentlink;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "ComputeNode")
public class ComputeNodePlugin extends Plugin {
    private static final int TIMEOUT_MS = 5000;

    @PluginMethod
    public void armScenario(PluginCall call) {
        String url = call.getString("url", "");
        String scenario = call.getString("scenario", "");

        if (url.isEmpty() || scenario.isEmpty()) {
            call.reject("Compute Node url and scenario are required.");
            return;
        }

        new Thread(() -> {
            HttpURLConnection connection = null;
            try {
                connection = (HttpURLConnection) new URL(url).openConnection();
                connection.setConnectTimeout(TIMEOUT_MS);
                connection.setReadTimeout(TIMEOUT_MS);
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Accept", "application/json");
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setDoOutput(true);
                connection.setFixedLengthStreamingMode(0);
                connection.getOutputStream().close();

                int status = connection.getResponseCode();
                String body = readResponseBody(status >= 200 && status < 300 ? connection.getInputStream() : connection.getErrorStream());
                JSObject result = new JSObject();
                result.put("status", status);
                result.put("body", body);

                if (status < 200 || status >= 300) {
                    result.put("ok", false);
                    call.resolve(result);
                    return;
                }

                JSONObject payload = new JSONObject(body);
                result.put("ok", payload.optBoolean("ok", false));
                if (payload.has("activeScenario")) {
                    result.put("activeScenario", payload.optString("activeScenario"));
                }
                call.resolve(result);
            } catch (IOException | JSONException error) {
                call.reject(error.getMessage() == null ? error.toString() : error.getMessage());
            } finally {
                if (connection != null) {
                    connection.disconnect();
                }
            }
        }).start();
    }

    private static String readResponseBody(InputStream stream) throws IOException {
        if (stream == null) {
            return "";
        }

        StringBuilder body = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                body.append(line);
            }
        }
        return body.toString();
    }
}
