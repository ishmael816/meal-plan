# 更新日志

## [2.0.0] - 2026-02-11

### 🏗️ 架构升级

#### IndexedDB 存储层
- **完全替代 localStorage**，支持更大容量数据存储
- 新增数据索引加速查询：`by-date`、`by-date-slot`
- 提供精细化数据操作方法：
  - `getLogsByDate(date)` - 按日期获取记录
  - `getLogsByDateAndSlot(date, slotId)` - 按日期和餐次获取
  - `addLog(log)` - 单条添加
  - `updateLog(id, updates)` - 局部更新
- **自动数据迁移**：首次启动自动从 localStorage 迁移旧数据

#### Zustand 状态管理
- 引入 Zustand 替代 React Context + useState
- **消除 Props Drilling**：组件直接通过 Hooks 获取状态
- **防抖写入机制**：300ms 延迟避免频繁 I/O 操作
- 提供细粒度 Selector Hooks：
  ```typescript
  const settings = useSettings()
  const logs = useLogs()
  const setLogs = useAppStore(s => s.setLogs)
  ```

---

### ✨ 全新交互体验

#### 1. 今日页面重构

**快速打卡**
- 首页直接显示餐次卡片，无需进入详情页
- 每个卡片展示前 3 个食物，一键打勾完成
- 超过 3 个显示 "+N 更多" 提示

**进度可视化**
- 顶部总进度环：实时显示今日完成百分比
- 卡片内嵌进度：每个餐次独立进度指示
- 已完成餐次高亮显示

**自动保存**
- 所有操作（打卡、调克数）自动持久化
- 消除手动保存意识负担
- Toast 提示操作结果

#### 2. 底部抽屉组件 (BottomSheet)

**流畅体验**
- 从底部滑出的详情面板，无需跳转页面
- **下滑手势关闭**：符合移动端操作习惯
- 点击遮罩区域关闭
- 流畅的进入/退出动画

**功能整合**
- 套餐切换：横向芯片组，点击即切换
- 食物列表：打卡 + 克数编辑一体化
- 一键全部完成：快速标记整餐

#### 3. Toast 通知系统

**即时反馈**
```typescript
showToast('已完成', 'success')  // 绿色 ✓
showToast('出错了', 'error')    // 红色 ✕
showToast('提示信息', 'info')   // 蓝色 ℹ
```

- 顶部居中显示
- 2.5秒自动消失
- 进场/离场动画

#### 4. 快速添加食物 (QuickAddFood)

**替代原生 Prompt**
- 内联输入框，不打断用户体验
- 支持连续添加多个食物
- Enter 提交，Esc 取消
- 自动聚焦输入框

#### 5. 进度环组件 (ProgressRing)

**可视化组件**
- SVG 环形进度条
- 支持自定义尺寸、颜色、线宽
- 中间可嵌套文字或图标
- 平滑动画过渡

---

### 🔔 通知系统优化

#### Page Visibility API
- 页面从后台切换回前台时立即检查通知
- 避免后台定时器不准确问题

#### 防抖去重
- 使用 Set 防止同一分钟内重复通知
- 跨天自动清理过期通知记录

#### 调试工具
```javascript
// 浏览器控制台测试通知
testNotification()
```

---

### ⚙️ 设置页面改进

**防误触保护**
- 删除餐次/套餐前弹出确认对话框
- 避免误操作导致数据丢失

**操作反馈**
- 添加套餐后自动展开编辑
- 删除成功后 Toast 提示
- 创建新套餐后自动聚焦名称输入

---

### 📁 新增文件

```
src/
├── db.ts                      # IndexedDB 封装
├── stores/
│   ├── appStore.ts           # Zustand 状态管理
│   └── index.ts              # Store 导出
├── components/
│   ├── Toast.tsx             # Toast 通知组件
│   ├── BottomSheet.tsx       # 底部抽屉组件
│   ├── ProgressRing.tsx      # 进度环组件
│   └── QuickAddFood.tsx      # 快速添加食物组件
└── pages/
    └── TodayPageNew.tsx      # 重构的今日页面
```

---

### 🔧 技术细节

**依赖新增**
```json
{
  "zustand": "^4.x",
  "idb": "^7.x"
}
```

**性能优化**
- 状态更新防抖（300ms）
- 组件级 Memo 优化
- Selector 细粒度订阅

**兼容性**
- 自动迁移 localStorage 数据
- 保留旧 API 接口兼容
- Graceful Degradation

---

### 🐛 修复问题

- 修复页面不活跃时通知延迟问题
- 修复数据量大时 localStorage 容量限制
- 优化组件重渲染性能

---

## [1.0.0] - 初始版本

### 核心功能
- 餐次设置（名称、时间）
- 多套食谱管理
- 每日执行追踪（打卡、调克数）
- 数据导出（CSV/JSON）
- 本地通知提醒
- Android APK 打包支持
