# ============ Stage 1: Build ============
FROM golang:1.23-alpine AS builder

WORKDIR /build

# 利用 Docker 缓存层：先复制依赖文件，再下载依赖
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# 静态编译，关闭 CGO，生成无外部依赖的二进制
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app main.go

# ============ Stage 2: Runtime ============
FROM scratch

# 从构建阶段复制二进制文件
COPY --from=builder /app /app

EXPOSE 8081

ENTRYPOINT ["/app"]
