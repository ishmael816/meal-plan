# 构建 APK 指南

本项目使用 Capacitor 构建 Android 应用。以下是两种构建 APK 的方法：

## 方法一：使用 Android Studio（推荐，适合初学者）

### 前置要求
1. 安装 [Android Studio](https://developer.android.com/studio)
2. 安装 Android SDK（Android Studio 会自动安装）
3. 确保已安装 Java JDK（Android Studio 自带）

### 步骤

1. **构建 Web 应用并同步到 Android**
   ```bash
   npm run cap:sync
   ```

2. **打开 Android Studio**
   ```bash
   npm run cap:open
   ```
   或者手动打开 Android Studio，然后选择 `android` 文件夹

3. **等待 Gradle 同步完成**
   - Android Studio 会自动下载依赖
   - 首次打开可能需要几分钟

4. **构建 APK**
   - 点击菜单：`Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - 或者使用快捷键：`Ctrl+Shift+A`（Windows/Linux）或 `Cmd+Shift+A`（Mac），搜索 "Build APK"

5. **找到生成的 APK**
   - 构建完成后，会弹出通知
   - 点击 "locate" 链接，或手动导航到：
     ```
     android/app/build/outputs/apk/debug/app-debug.apk
     ```

6. **安装到手机**
   - 将 APK 文件传输到手机（USB、云盘、微信等）
   - 在手机上启用"允许安装未知来源应用"
   - 点击 APK 文件安装

---

## 方法二：使用命令行（更快，适合有经验的开发者）

### 前置要求
1. **安装 Java JDK**
   - 下载并安装 [Oracle JDK](https://www.oracle.com/java/technologies/downloads/) 或 [OpenJDK](https://adoptium.net/)
   - 推荐版本：JDK 17 或 JDK 11（Android Gradle Plugin 8.2.1 支持）
   
2. **配置 JAVA_HOME 环境变量（Windows）**
   - 打开"系统属性" → "高级" → "环境变量"
   - 在"系统变量"中点击"新建"
   - 变量名：`JAVA_HOME`
   - 变量值：Java 安装路径（例如：`C:\Program Files\Java\jdk-17`）
   - 在 PATH 中添加：`%JAVA_HOME%\bin`
   - 重新打开终端验证：`java -version`

3. **安装 Android SDK**（可通过 Android Studio 安装）
   - 配置环境变量：
     - `ANDROID_HOME`：指向 Android SDK 目录（通常在 `C:\Users\你的用户名\AppData\Local\Android\Sdk`）
     - 将 `%ANDROID_HOME%\platform-tools` 和 `%ANDROID_HOME%\tools` 添加到 PATH

### 步骤

1. **构建 Web 应用并同步**
   ```bash
   npm run cap:sync
   ```

2. **进入 Android 目录**
   ```bash
   cd android
   ```

3. **构建 Debug APK**
   ```bash
   .\gradlew assembleDebug
   ```

4. **构建 Release APK（需要签名配置）**
   ```bash
   .\gradlew assembleRelease
   ```

5. **找到 APK 文件**
   - Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
   - Release APK: `android/app/build/outputs/apk/release/app-release.apk`

---

## 构建 Release APK（用于正式发布）

如果要构建签名后的 Release APK，需要先配置签名：

1. **生成签名密钥**（如果还没有）
   ```bash
   keytool -genkey -v -keystore meal-plan-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias meal-plan
   ```

2. **创建签名配置文件**
   - 在 `android` 目录下创建 `keystore.properties` 文件：
     ```
     storePassword=你的密钥库密码
     keyPassword=你的密钥密码
     keyAlias=meal-plan
     storeFile=../meal-plan-release-key.jks
     ```

3. **修改 `android/app/build.gradle`** 添加签名配置（已自动配置）

4. **构建 Release APK**
   ```bash
   cd android
   .\gradlew assembleRelease
   ```

---

## 常见问题

### 1. ❌ ERROR: JAVA_HOME is not set（Java 环境未配置）

**问题**：构建时提示找不到 Java 或 JAVA_HOME 未设置

**解决方案**：

**选项 A：使用 Android Studio（推荐，最简单）**
- Android Studio 自带 JDK，无需单独配置
- 直接运行 `npm run android` 打开 Android Studio 构建

**选项 B：手动安装并配置 Java**
1. 下载并安装 JDK 17：
   - Oracle JDK: https://www.oracle.com/java/technologies/downloads/#java17
   - 或 OpenJDK: https://adoptium.net/zh-CN/temurin/releases/?version=17
   
2. 设置环境变量（Windows）：
   ```
   1. 右键"此电脑" → "属性" → "高级系统设置" → "环境变量"
   2. 在"系统变量"中点击"新建"
   3. 变量名：JAVA_HOME
   4. 变量值：C:\Program Files\Java\jdk-17（你的 JDK 安装路径）
   5. 编辑 PATH 变量，添加：%JAVA_HOME%\bin
   6. 确定保存，重新打开终端
   ```

3. 验证安装：
   ```bash
   java -version
   # 应该显示 Java 版本信息
   ```

**快速检查 Java 是否已安装**：
- 在 PowerShell 中运行：`where.exe java`
- 如果显示路径，说明已安装，只需配置 JAVA_HOME
- 如果没有输出，需要先安装 JDK

### 2. Gradle 同步失败
- 检查网络连接（需要下载依赖）
- 尝试使用国内镜像或 VPN

### 3. 找不到 Android SDK
- 在 Android Studio 中：`File` → `Settings` → `Appearance & Behavior` → `System Settings` → `Android SDK`
- 确保已安装 Android SDK Platform 34 和 Build Tools

### 4. APK 安装失败
- 确保手机允许安装未知来源应用
- 检查 Android 版本是否满足最低要求（API 22，Android 5.1+）

### 5. 应用崩溃
- 确保已运行 `npm run cap:sync` 同步最新代码
- 检查 `dist` 文件夹是否存在且包含构建产物

---

## 快速命令

```bash
# 一键构建并打开 Android Studio
npm run android

# 仅同步代码（不打开 Android Studio）
npm run cap:sync

# 构建 Debug APK（命令行）
cd android && .\gradlew assembleDebug
```
