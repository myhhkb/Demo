# Gin Fullstack 中后台系统二次开发

## 项目基本信息

- 学校：请填写你的学校
- 姓名：请填写你的姓名
- 学号：请填写你的学号
- 作业目录：`week06/homework/gin-fullstack`

## 开发任务索引

1. 任务 1 - 环境搭建与初始化
   - 将后端默认数据库类型切换为 SQLite。
   - 在 `server/config.yaml` 中配置 `system.db-type: sqlite`。
   - 保持 `sqlite` 连接信息为空，便于首次访问初始化页面时选择 SQLite 并写入配置。
   - 后端 SQLite 初始化逻辑会自动创建数据库目录，避免目录缺失导致数据库文件创建失败。

2. 任务 2 - 用户行为追踪功能开发
   - 在用户表 `sys_users` 中新增最后登录 IP 字段 `last_login_ip`。
   - 在用户表 `sys_users` 中新增最后登录时间字段 `last_login_time`。
   - 用户登录成功后自动记录本次登录 IP 与登录时间。
   - 在前端“用户管理”列表中新增“登录 IP”和“登录时间”两列。
   - 登录时间按 `YYYY-MM-DD HH:mm` 格式展示。

## 核心技术实现

### SQLite 环境切换

项目后端使用 Gin + Gorm。通过修改 `server/config.yaml` 中的数据库类型为 `sqlite`，让首次访问初始化页面时可以选择 SQLite 并写入数据库配置。初始化前配置如下：

- `system.db-type: sqlite`
- `sqlite.path: ""`
- `sqlite.db-name: ""`

初始化页面选择 SQLite 后，会把数据库路径和数据库名称写入 `server/config.yaml`。后端 SQLite 初始化逻辑会自动确保数据库目录存在，避免首次运行时因为目录缺失导致数据库文件创建失败。

### 用户最后登录信息记录

在后端用户模型 `server/model/system/sys_user.go` 中扩展两个字段：

- `lastLoginIp`：记录用户最后一次登录 IP。
- `lastLoginTime`：记录用户最后一次登录时间。

系统已有自动迁移逻辑，启动后会通过 Gorm `AutoMigrate` 同步新增字段到 `sys_users` 表。

用户登录成功后，在 `TokenNext` 签发 JWT 的流程中调用用户服务更新登录轨迹，保证只有认证成功的登录才会写入最后登录 IP 和时间。

### 用户管理列表展示

前端用户管理页面位于 `web/src/view/superAdmin/user/user.vue`。页面在原有用户列表基础上新增两列：

- 登录 IP：直接展示后端返回的 `lastLoginIp`。
- 登录时间：使用项目已有时间格式化工具格式化为 `yyyy-MM-dd hh:mm`。

## 运行方式

### 启动后端

```bash
cd gin-fullstack/server
go run main.go
```

### 启动前端

```bash
cd gin-fullstack/web
npm install
npm run dev
```

启动后访问前端地址，初始化时选择 SQLite，完成初始化后登录系统，进入“用户管理”即可查看用户最后登录 IP 和登录时间。

## 验收说明

1. 使用管理员账号登录系统。
2. 进入“用户管理”，新增用户 `a`。
3. 使用第二个浏览器登录用户 `a`。
4. 返回管理员浏览器，刷新“用户管理”列表。
5. 用户 `a` 行应展示“登录 IP”和“登录时间”。
