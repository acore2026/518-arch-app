# 应用命名模型

本文档定义 IntentLink 的统一用语。代码讨论、界面评审、演示脚本、issue 和后续文档都应采用这些名称。

## 产品名称

- **App**：`IntentLink`
  指 Android 应用、共享 SPA 或整个项目时使用该名称。
- **Agent Brand**：`NETAGENT`
  指 Direct Intent 中面向用户的网络感知助手。

## 路由

- **App Route**：`/`
  Web 和 Android 共用的主界面，包含用户体验和实时 Control Panel。

## 主要体验

- **Streaming**：应用内品牌为 `StreamFlex` 的视频演示体验。
- **Gaming**：应用内品牌为 `CloudPlay` 的云游戏演示体验。
- **Direct Intent**：由 `NETAGENT` 提供的对话式意图体验。

统一使用 **experience（体验）** 作为上位概念。只有明确描述界面切换控件时才使用“页签”或“模式”。

## Direct Intent 用语

- **Transcript**：可滚动的消息记录区域。
- **Composer**：页面底部的输入栏。
- **Intent Message**：Transcript 中的一条对话消息。
- **Action Card**：嵌在网络回复中的决策卡片。
- **Compute Available Card**：游戏启动请求使用的特定 Action Card。
- **Primary CTA**：`Deduct & Launch`。

推荐使用以下流程表述：

- 用户提交 **game-launch intent**。
- `NETAGENT` 返回 **compute-available response**。
- 用户确认 **Action Card**。
- 应用执行 **Moonlight Handoff**。

## 控制面板用语

- **Control Panel**：通过 `Controls` 按钮打开的应用内浮层。
- **Controls Button**：打开 Control Panel 的悬浮按钮。
- **System Agent Backend**：Control Panel 中供 Direct Intent 使用的可配置后端地址。
- **Compute Node Host**：用于切换 Moonlight 串流场景的可配置主机。
- **Live Controls**：Control Panel 顶部的小标题。

默认使用 **Control Panel**，不要称为 admin page 或 presenter page。

## 网络与升级用语

- **Network Tier**：`5G`、`Degraded` 或 `6G`。
- **Network Degradation**：模拟的网络拥塞事件。
- **6G Boost**：Streaming 的体验升级路径。
- **6G Edge Boost**：Gaming 的体验升级路径。
- **Moonlight Handoff**：打开外部 Moonlight Android 应用。
- **Base Scenario**：用户点击 `Fix` 后激活的 Compute Node 场景。
- **Overload Scenario**：Moonlight Handoff 之前激活的 Compute Node 场景。

## 避免使用的说法

- 不要用 `phone shell`、`container app` 或 `fake phone UI` 描述当前 `/` 体验。
- 不要把 Direct Intent 称为 `chatbot`，应使用 `NETAGENT` 或 `Direct Intent`。
- 不要使用 `admin route`、`/admin` 或 `presenter page`，这些入口已经不存在。
- 本地演示路径不要笼统称为 `backend integration`；应根据实际情况使用 `stubbed flow`、`stubbed orchestration` 或 `System Agent Backend`。
