# 食谱小助手

轻量级食谱规划与执行追踪应用：自定义每日用餐时间与食谱，到点提醒，打勾记录、滑杆调克数，支持临时增减食物，并导出 CSV/JSON 方便制表或营养分析。支持**网页**与 **Android 应用**两种形态。

## 功能

- **设置**：配置每日餐次（如早餐 10:00、午餐 13:00、下午加餐 15:00、晚餐 18:00）及每餐食物与克数。
- **今日执行**：到点通知提醒（浏览器或手机原生）；对每项打勾完成，用滑杆调整实际克数；可「添加本餐食物」做临时增减，自定义项可删除。
- **数据**：查看已保存的本地记录，并导出为 CSV（方便 Excel）或 JSON（方便程序分析）。

## 网页运行

```bash
npm install
npm run dev
```

浏览器打开提示的本地地址（如 `http://localhost:5173`）。建议允许通知权限以便到点提醒。

## 构建网页

```bash
npm run build
npm run preview   # 本地预览构建结果
```

## 打包为 Android 应用

本工程使用 [Capacitor](https://capacitorjs.com/) 将同一套界面打包为 Android App，到点使用系统本地通知提醒。

### 环境要求

- 已安装 [Node.js](https://nodejs.org/)（含 npm）
- 已安装 [Android Studio](https://developer.android.com/studio)，并完成 SDK 与虚拟设备配置（若要真机调试，需开启开发者选项与 USB 调试）

### 步骤

1. **安装依赖并添加 Android 平台**

   ```bash
   npm install
   npx cap add android
   ```

2. **构建前端并同步到 Android 工程**

   ```bash
   npm run build
   npx cap sync android
   ```

   也可使用快捷命令（构建 + 同步）：

   ```bash
   npm run cap:sync
   ```

3. **用 Android Studio 打开并运行**

   ```bash
   npx cap open android
   ```

   在 Android Studio 中选择模拟器或真机，点击 Run 即可安装运行。

   或使用一条命令完成同步并打开 Android 工程：

   ```bash
   npm run android
   ```

### 精确定时提醒（可选）

若希望到点提醒更准时（尤其在 Android 12+），可在 Android 工程中为“精确定时”放行：

1. 用 Android Studio 打开 `android` 工程（见上）。
2. 在 `android/app/src/main/AndroidManifest.xml` 的 `<manifest>` 内增加：

   ```xml
   <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
   ```

3. 重新构建并安装到设备。

首次进入 App 时，请按系统提示允许“通知”权限，否则不会弹出用餐提醒。

## 数据与存储

- 网页版：数据保存在浏览器 **localStorage**，清除站点数据会丢失设置与记录。
- Android 版：数据保存在 WebView 的本地存储中，卸载应用会一并清除。

## 技术栈

- React 18 + TypeScript + Vite
- React Router（Hash 路由，便于静态/本地加载）
- Capacitor 6（Android 打包与本地通知）
