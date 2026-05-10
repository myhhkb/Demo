# 练习二：Go 后端 API 的容器化构建

## 项目说明

使用 Go (Gin) 编写一个最简单的 HTTP 接口，通过多阶段构建（Multi-stage Build）进行容器化，最终镜像体积 < 20MB。

### 接口

| 方法 | 路径    | 响应                      |
| ---- | ------- | ------------------------- |
| GET  | `/ping` | `{"message": "pong"}` |

### 端口

`8081`

## 项目结构

```
02_go_api/
├── main.go          # Gin 服务入口
├── go.mod           # Go 模块定义
├── go.sum           # 依赖校验
├── Dockerfile       # 多阶段构建
├── .dockerignore    # Docker 构建排除文件
└── README.md
```

## Dockerfile 多阶段构建说明

```
┌─────────────────────────────────────┐
│  Stage 1: builder (golang:1.23-alpine) │
│                                     │
│  - 下载依赖 (go mod download)       │
│  - 静态编译 (CGO_ENABLED=0)         │
│  - 使用 -ldflags="-s -w" 裁剪符号表 │
│  - 产出: /app 二进制文件             │
└──────────────┬──────────────────────┘
               │ COPY --from=builder /app
               ▼
┌─────────────────────────────────────┐
│  Stage 2: runtime (scratch)         │
│                                     │
│  - 空白基础镜像 (0 字节)            │
│  - 仅包含编译后的二进制文件          │
│  - 最终镜像 ≈ 10~15 MB             │
└─────────────────────────────────────┘
```

**关键技术点：**

- **`CGO_ENABLED=0`**：禁用 CGO，生成纯静态链接的二进制，无需依赖 libc
- **`-ldflags="-s -w"`**：`-s` 去掉符号表，`-w` 去掉 DWARF 调试信息，减小二进制体积
- **`scratch` 基础镜像**：零体积空镜像，比 alpine (~7MB) 更小

## 构建与运行

### 1. 构建镜像

```bash
docker build -t go-api .
```

### 2. 查看镜像大小（验证 < 20MB）

```bash
docker images go-api
```

预期输出：

```
REPOSITORY   TAG       IMAGE ID       CREATED         SIZE
go-api       latest    xxxxxxxxxxxx   x seconds ago   ~12MB
```

### 3. 运行容器

```bash
docker run -d -p 8081:8081 --name go-api go-api
```

### 4. 验证

```bash
curl http://localhost:8081/ping
```

预期输出：

```json
{"message":"pong"}
```

### 5. 清理

```bash
docker stop go-api && docker rm go-api
```
