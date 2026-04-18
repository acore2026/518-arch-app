# IntentLink

IntentLink 是一套面向网络能力演示的 Web 与 Android 应用。用户不需要理解切片、边缘计算或网络编排，只需说出自己想做什么，NETAGENT 就会把意图交给系统代理或引导用户使用可用的计算资源。

这个仓库同时维护浏览器版本和基于 Capacitor 的 Android 版本，两端共用同一套 React 界面和业务逻辑。

## 演示流程

应用包含 Streaming、Gaming 和 Direct Intent 三个体验。Direct Intent 又分为 Experience 与 Compute 两类意图。

- Experience 意图通过 WebSocket 发送给 System Agent。后端可以继续追问，应用会在同一会话中保存并复用 `session_id`，直到返回最终结果。
- Compute 意图用于游戏启动。用户确认 Compute Available Card 后，应用先让 Compute Node 进入 overload 场景，再打开 Moonlight。
- Moonlight 运行一段时间后，Android 会显示网络延迟通知。用户点击 `Fix` 返回 IntentLink，应用切换到 base 场景并展示体验升级过程。
- 未配置 System Agent 时，Direct Intent 使用本地演示逻辑，便于单机展示。

## 运行环境

- Node.js `^20.19.0` 或 `>=22.12.0`
- npm
- Android 构建需要 JDK 21、Android SDK 36 和可用的 Gradle 环境
- Android 设备最低版本为 Android 7.0（API 24）
- 游戏跳转需要安装 Moonlight，支持 `com.limelight.debug` 和 `com.limelight`

## 本地开发

```bash
npm install
npm run dev
```

开发服务器监听 `http://localhost:7100`。如需检查生产构建：

```bash
npm run build
npm run preview
```

## 后端配置

点击应用右下角的 `Controls` 打开 Control Panel，只需填写主机名或 IP 地址，端口和路径由应用补齐。

- System Agent Backend：`ws://<host>:7201/api/ws`
- Compute Node overload：`POST http://<host>:7878/scenarios/overload/arm`
- Compute Node base：`POST http://<host>:7878/scenarios/base/arm`

System Agent 地址也可以在开发构建中通过 `VITE_INTENT_BACKEND_HOST` 提供。界面保存的配置写入浏览器或 WebView 的 `localStorage`。

## 测试

```bash
npm test
npm run build
```

Playwright 检查需要先启动本地服务：

```bash
npm run dev
npx playwright test video-check.spec.ts
```

## Android 构建

先生成 Web 资源并同步到 Android 工程：

```bash
npm run build:android
cd android
./gradlew assembleDebug
```

调试 APK 输出到 `android/app/build/outputs/apk/debug/app-debug.apk`。真机测试时，手机、System Agent 和 Compute Node 应位于可互通的网络中，并允许应用发送通知。

## 相关文档

- [软件设计](SOFTWARE_DESIGN.md)
- [命名模型](NAMING_MODEL.md)
- [仓库协作指南](AGENTS.md)

本项目用于演示网络意图、外部应用跳转和体验修复流程。当前接口使用明文 `ws://` 与 `http://`，也没有用户认证，不应直接作为公网生产方案部署。
