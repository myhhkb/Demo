# 在线海报设计器

## 项目基本信息

- **姓名**: [请填写您的姓名]
- **学校**: [请填写您的学校]
- **学号**: [请填写您的学号]

## 项目简介

这是一个功能完整的在线海报设计器，采用前后端分离架构，支持文本、形状、图片等多种元素的编辑和排版。

## 技术栈

### 前端
- **Vite** - 现代化的前端构建工具
- **React 18** - 用户界面库
- **TypeScript** - 类型安全的 JavaScript
- **Tailwind CSS** - 原子化 CSS 框架
- **Zustand** - 轻量级状态管理
- **html-to-image** - 画布导出为图片

### 后端
- **Go** - 高性能后端语言
- **Gin** - Web 框架
- **GORM** - ORM 框架
- **SQLite** - 轻量级数据库

## 开发任务索引

### 已完成功能

- [x] 用户登录/注册系统
- [x] 会话持久化
- [x] 三栏布局（左侧素材面板 + 中间画布区 + 右侧属性面板）
- [x] 顶部工具栏（Logo、撤销/重做、下载、退出登录）
- [x] 画布功能
  - [x] 默认尺寸 600×800px
  - [x] 自定义修改宽高（带锁定宽高比功能）
  - [x] 背景颜色选择（颜色选择器 + 推荐色板）
  - [x] 背景图片上传
  - [x] 重置背景
  - [x] 缩放控制（+/- 按钮和输入框）
- [x] 文本元素
  - [x] 点击/拖拽绘制文本框
  - [x] 字体选择、字号调整、文字颜色
  - [x] 样式：加粗、斜体、下划线、删除线
  - [x] 对齐方式：左对齐、居中、右对齐、两端对齐
  - [x] 字间距、行间距（滑块 + 数值输入）
  - [x] 透明度调整
  - [x] 阴影效果（开关控制）
  - [x] 双击直接编辑文字内容
- [x] 形状元素
  - [x] 三个分类标签：基础、节日、其它
  - [x] SVG 图标形式展示
  - [x] 点击后在画布上放置
  - [x] 背景色修改、描边、阴影
- [x] 图片元素
  - [x] 预设图片
  - [x] 本地图片上传（支持阿里云 OSS）
  - [x] AI 生成图片（阿里云百炼模型）
  - [x] 填充方式、圆角、透明度、阴影
- [x] 元素通用操作
  - [x] 选中框（虚线边框 + 控制手柄）
  - [x] 拖拽移动元素位置
  - [x] 智能对齐辅助线（画布中线、与其他元素对齐）
  - [x] 通过手柄缩放元素大小
  - [x] 旋转元素（旋转手柄）
  - [x] 右键弹出菜单：图层上移/下移/置顶/置底
  - [x] 排版功能：水平居中、垂直居中
- [x] 撤销与重做
  - [x] 记录用户操作历史
  - [x] 支持撤销和重做
  - [x] 无可撤销/重做操作时按钮置灰
- [x] 下载导出
  - [x] 导出为 PNG 格式图片

## 核心技术实现

### 1. 文字绘制

使用 React 的 `contentEditable` 属性实现文本的即时编辑。通过 CSS 样式动态控制字体、字号、颜色、对齐方式等属性。文本阴影使用 CSS `text-shadow` 属性实现。

```typescript
// 文本元素渲染核心逻辑
<div
  contentEditable={isEditing}
  style={{
    fontFamily: textEl.fontFamily,
    fontSize: textEl.fontSize,
    fontWeight: textEl.fontWeight,
    textAlign: textEl.textAlign,
    color: textEl.color,
    letterSpacing: textEl.letterSpacing,
    lineHeight: textEl.lineHeight,
    textShadow: shadow ? `${offsetX}px ${offsetY}px ${blur}px ${color}` : 'none',
  }}
>
  {content}
</div>
```

### 2. 形状绘制

形状元素使用 SVG 实现，通过 `viewBox` 保持比例，支持动态修改填充色、描边色和描边宽度。阴影效果使用 SVG 的 `filter: drop-shadow()` 实现。

```typescript
// SVG 形状渲染
<svg viewBox="0 0 100 100" style={{ filter: shadow ? `drop-shadow(...)` : undefined }}>
  <g fill={fill} stroke={stroke} strokeWidth={strokeWidth}>
    {/* SVG 路径内容 */}
  </g>
</svg>
```

### 3. 图片上传

前端使用 `FormData` 上传图片文件，后端支持两种存储方式：
- **本地存储**：保存到 `uploads` 目录
- **阿里云 OSS**：配置环境变量后自动使用 OSS 存储

```go
// 后端上传处理
if ossConfigured {
    bucket.PutObject(objectKey, file)
    url = fmt.Sprintf("https://%s.%s/%s", bucketName, endpoint, objectKey)
} else {
    io.Copy(localFile, file)
    url = "/uploads/" + filename
}
```

### 4. 状态管理与撤销/重做

使用 Zustand 进行状态管理，通过维护 `past` 和 `future` 数组实现撤销/重做功能。每次操作前保存当前状态快照。

```typescript
// 撤销/重做实现
undo: () => {
  const previous = past[past.length - 1];
  set({
    past: past.slice(0, -1),
    future: [currentState, ...future],
    ...previous,
  });
},
```

### 5. 智能对齐辅助线

拖拽元素时实时计算元素中心点与画布中心、其他元素中心的距离，当距离小于阈值时显示对齐辅助线。

### 6. 画布导出

使用 `html-to-image` 库将画布 DOM 元素转换为 PNG 图片，支持高清导出（2x 像素比）。

## 项目结构

```
poster/
├── client/                 # 前端项目
│   ├── src/
│   │   ├── api/           # API 请求封装
│   │   ├── components/    # React 组件
│   │   │   ├── panels/    # 左侧面板组件
│   │   │   └── properties/# 右侧属性面板组件
│   │   ├── pages/         # 页面组件
│   │   ├── store/         # Zustand 状态管理
│   │   └── types/         # TypeScript 类型定义
│   ├── package.json
│   └── vite.config.ts
├── server/                 # 后端项目
│   ├── handlers/          # 请求处理器
│   ├── middleware/        # 中间件
│   ├── models/            # 数据模型
│   ├── main.go
│   └── go.mod
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## 快速开始

### 开发模式

1. 启动后端：
```bash
cd server
go run .
```

2. 启动前端：
```bash
cd client
npm install
npm run dev
```

3. 访问 http://localhost:5173

### Docker 部署

```bash
cd poster
docker compose up -d --build
```

访问 http://localhost:8080

## 环境变量配置

在 `.env` 文件中配置以下环境变量（可选）：

```env
# 阿里云 OSS 配置（用于图片上传）
OSS_ENDPOINT=oss-cn-beijing.aliyuncs.com
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=your_bucket_name

# 阿里云百炼 API（用于 AI 生图）
DASHSCOPE_API_KEY=your_dashscope_api_key
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/register | 用户注册 |
| POST | /api/login | 用户登录 |
| GET | /api/user | 获取当前用户信息 |
| POST | /api/logout | 退出登录 |
| POST | /api/upload | 上传图片 |
| POST | /api/ai/generate-image | AI 生成图片 |

## 其他说明

- 项目使用 Session 进行用户认证，支持 7 天免登录
- 画布数据存储在 SQLite 数据库中
- 支持键盘快捷键：Ctrl+Z 撤销，Ctrl+Y 重做，Delete 删除选中元素
