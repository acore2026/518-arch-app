# 仓库协作指南

## 项目结构与模块划分

这是一个 Vite + React + TypeScript 项目，业务模块位于仓库根目录。`main.tsx` 启动应用，`App.tsx` 管理顶层状态和跨体验编排。较大的界面拆分为 `IntentExperience.tsx`、`ControlsSheet.tsx`、`ShowcaseExperiences.tsx`、`CloudGame.tsx` 和 `UpgradeModal.tsx` 等组件。共享领域类型放在 `app-types.ts`，意图辅助函数放在 `intent-utils.ts`；后端连接、WebSocket 和 Compute Node 逻辑分别放在对应的 `*-config.ts`、`*-repository.ts` 或场景模块中。`dist/` 是生成目录，不要手工修改。浏览器测试位于 `video-check.spec.ts`，单元测试使用 `*.test.ts`。

## 构建、测试与开发命令

- `npm install`：按照 `package-lock.json` 安装依赖。
- `npm run dev`：在 `http://localhost:7100` 启动 Vite 开发服务器。
- `npm run build`：执行 TypeScript 检查，并将生产构建输出到 `dist/`。
- `npm run preview`：在本地 `7100` 端口预览生产构建。
- `npm test`：运行 Vitest 单元测试。
- `npx playwright test video-check.spec.ts`：针对已启动的本地服务运行 Playwright 检查。

## 编码风格与命名

使用 TypeScript、React 函数组件和 Hooks。遵循现有格式：2 空格缩进、语句末尾使用分号，`.ts` 和 `.tsx` 文件使用单引号。组件使用 `PascalCase`，例如 `ControlsSheet.tsx`；变量和函数使用 `camelCase`，例如 `triggerDegradation`。Hooks 状态名称应直接表达用途。跨体验编排保留在 `App.tsx`，可复用界面、领域辅助函数和 IO 客户端应拆到独立模块。

## 测试要求

Vitest 负责辅助函数和仓库层测试，Playwright 负责用户可见流程。单元测试文件以 `*.test.ts` 结尾，浏览器测试以 `*.spec.ts` 结尾。提交 PR 前必须确认 `npm test` 和 `npm run build` 通过；如果修改了界面行为、视频播放或截图结果，还要运行相关 Playwright 用例。

## 提交与 Pull Request

提交历史采用简短的祈使句，例如 `Initial project import`。继续使用简洁主题，不加句号，每次提交只处理一个逻辑改动。PR 应说明改动内容和已执行的测试；界面发生变化时附上截图。有对应 issue 或任务时应添加链接。

## 配置注意事项

不要提交 `node_modules/`、`dist/`、`test-results/` 或本地工具状态目录。演示视频使用远程媒体地址，排查播放问题时应同时确认外部资源是否可访问。
