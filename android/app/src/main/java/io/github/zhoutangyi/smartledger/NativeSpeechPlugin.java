package io.github.zhoutangyi.smartledger;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.speech.RecognizerIntent;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;
import java.util.Locale;

@CapacitorPlugin(
    name = "NativeSpeech",
    permissions = {
        @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO })
    }
)
public class NativeSpeechPlugin extends Plugin {

    @PluginMethod
    public void isAvailable(PluginCall call) {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        JSObject result = new JSObject();
        result.put("available", intent.resolveActivity(getContext().getPackageManager()) != null);
        call.resolve(result);
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            requestPermissionForAlias("microphone", call, "microphonePermissionCallback");
            return;
        }
        launchSpeechRecognizer(call);
    }

    @PermissionCallback
    private void microphonePermissionCallback(PluginCall call) {
        if (call == null) return;
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            call.reject("需要麦克风权限才能使用语音输入。");
            return;
        }
        launchSpeechRecognizer(call);
    }

    private void launchSpeechRecognizer(PluginCall call) {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, call.getString("language", "zh-CN"));
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, call.getString("language", "zh-CN"));
        intent.putExtra(RecognizerIntent.EXTRA_PROMPT, call.getString("prompt", "请开始说话"));
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);

        try {
            startActivityForResult(call, intent, "speechResult");
        } catch (ActivityNotFoundException error) {
            call.reject("当前设备没有可用的语音识别服务。");
        }
    }

    @ActivityCallback
    private void speechResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.reject("用户取消了语音输入。");
            return;
        }

        ArrayList<String> matches = result.getData().getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
        if (matches == null || matches.isEmpty()) {
            call.reject("没有识别到有效内容。");
            return;
        }

        JSObject payload = new JSObject();
        payload.put("transcript", matches.get(0));
        JSArray alternatives = new JSArray();
        for (String match : matches) {
            alternatives.put(match);
        }
        payload.put("alternatives", alternatives);
        payload.put("locale", Locale.getDefault().toLanguageTag());
        call.resolve(payload);
    }
}
