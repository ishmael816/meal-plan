# Java 环境检查脚本
Write-Host "正在检查 Java 环境..." -ForegroundColor Cyan

# 检查 java 命令
$javaPath = (Get-Command java -ErrorAction SilentlyContinue).Source
if ($javaPath) {
    Write-Host "✓ 找到 Java: $javaPath" -ForegroundColor Green
    Write-Host "`nJava 版本信息:" -ForegroundColor Yellow
    java -version
} else {
    Write-Host "✗ 未找到 Java 命令" -ForegroundColor Red
    Write-Host "`n请安装 Java JDK:" -ForegroundColor Yellow
    Write-Host "1. 下载 JDK 17: https://adoptium.net/zh-CN/temurin/releases/?version=17" -ForegroundColor White
    Write-Host "2. 安装后设置 JAVA_HOME 环境变量" -ForegroundColor White
}

# 检查 JAVA_HOME 环境变量
$javaHome = $env:JAVA_HOME
if ($javaHome) {
    Write-Host "`n✓ JAVA_HOME 已设置: $javaHome" -ForegroundColor Green
    if (Test-Path "$javaHome\bin\java.exe") {
        Write-Host "✓ JAVA_HOME 路径有效" -ForegroundColor Green
    } else {
        Write-Host "✗ JAVA_HOME 路径无效（找不到 java.exe）" -ForegroundColor Red
    }
} else {
    Write-Host "`n✗ JAVA_HOME 未设置" -ForegroundColor Red
    Write-Host "`n设置方法:" -ForegroundColor Yellow
    Write-Host "1. 右键'此电脑' → '属性' → '高级系统设置' → '环境变量'" -ForegroundColor White
    Write-Host "2. 在'系统变量'中新建:" -ForegroundColor White
    Write-Host "   变量名: JAVA_HOME" -ForegroundColor White
    Write-Host "   变量值: C:\Program Files\Java\jdk-17 (你的 JDK 安装路径)" -ForegroundColor White
    Write-Host "3. 编辑 PATH，添加: %JAVA_HOME%\bin" -ForegroundColor White
    Write-Host "4. 重新打开终端" -ForegroundColor White
}

# 检查常见的 Java 安装位置
Write-Host "`n检查常见 Java 安装位置..." -ForegroundColor Cyan
$commonPaths = @(
    "C:\Program Files\Java",
    "C:\Program Files (x86)\Java",
    "$env:LOCALAPPDATA\Programs\Android\Android Studio\jbr"
)

$foundJava = $false
foreach ($path in $commonPaths) {
    if (Test-Path $path) {
        Write-Host "✓ 找到目录: $path" -ForegroundColor Green
        $jdkDirs = Get-ChildItem -Path $path -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "*jdk*" -or $_.Name -like "*jre*" }
        if ($jdkDirs) {
            foreach ($dir in $jdkDirs) {
                Write-Host "  - $($dir.FullName)" -ForegroundColor Gray
                $foundJava = $true
            }
        }
    }
}

if (-not $foundJava -and -not $javaPath) {
    Write-Host "`n建议: 使用 Android Studio 构建 APK（自带 JDK，无需配置）" -ForegroundColor Yellow
    Write-Host "运行: npm run android" -ForegroundColor Cyan
}
