# API 接口文档

## 基础信息

- **Base URL**: `/api`
- **Content-Type**: `application/json`
- **认证方式**: JWT Token，在 Header 中携带 `Authorization: Bearer <token>`

## 通用响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

## 错误码说明

| 错误码 | 含义 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或 Token 过期 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如用户名已存在） |
| 500 | 服务器内部错误 |

---

## 1. 用户认证模块

### 1.1 用户注册

- **接口路径**: `POST /api/register`
- **鉴权说明**: 无需鉴权
- **请求参数** (Body):

```json
{
  "username": "testuser",
  "password": "123456"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名，3-32 个字符 |
| password | string | 是 | 密码，6-64 个字符 |

- **成功返回**:

```json
{
  "code": 200,
  "message": "register success"
}
```

- **失败返回**:

| 错误码 | 含义 |
|--------|------|
| 400 | 参数校验失败 |
| 409 | 用户名已存在 |
| 500 | 服务器内部错误 |

---

### 1.2 用户登录

- **接口路径**: `POST /api/login`
- **鉴权说明**: 无需鉴权
- **请求参数** (Body):

```json
{
  "username": "testuser",
  "password": "123456"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

- **成功返回**:

```json
{
  "code": 200,
  "message": "login success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "username": "testuser"
  }
}
```

- **失败返回**:

| 错误码 | 含义 |
|--------|------|
| 400 | 参数校验失败 |
| 401 | 用户名或密码错误 |

---

## 2. 单词学习模块

### 2.1 智能查询单词

- **接口路径**: `POST /api/word/query`
- **鉴权说明**: 需要 JWT Token
- **请求参数** (Body):

```json
{
  "word": "ephemeral",
  "ai_provider": "qwen"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| word | string | 是 | 要查询的英语单词 |
| ai_provider | string | 否 | AI 模型选择，`qwen`（通义千问，默认）或 `deepseek` |

- **逻辑流程**:
  1. 鉴权通过后，先在数据库中检查当前用户是否已保存该单词
  2. 如已保存，直接返回数据库中的数据（`saved: true`）
  3. 如未保存，调用对应 AI 接口获取释义和例句（`saved: false`）
  4. AI 结果直接返回前端，不做数据库保存

- **成功返回**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "word": "ephemeral",
    "definition": "adj. 短暂的，转瞬即逝的。指持续时间很短的事物。",
    "examples": [
      "The beauty of cherry blossoms is ephemeral. 樱花的美是短暂的。",
      "Fame can be ephemeral in the entertainment industry. 在娱乐圈，名声可能转瞬即逝。",
      "The ephemeral nature of life reminds us to cherish every moment. 生命的短暂提醒我们珍惜每一刻。"
    ],
    "ai_provider": "qwen",
    "saved": false
  }
}
```

- **失败返回**:

| 错误码 | 含义 |
|--------|------|
| 400 | 参数缺失 |
| 401 | 未认证 |
| 500 | AI 接口调用失败 |

---

### 2.2 手动保存单词

- **接口路径**: `POST /api/word/save`
- **鉴权说明**: 需要 JWT Token
- **请求参数** (Body):

```json
{
  "word": "ephemeral",
  "definition": "adj. 短暂的，转瞬即逝的。",
  "examples": ["例句1", "例句2", "例句3"],
  "ai_provider": "qwen"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| word | string | 是 | 单词 |
| definition | string | 是 | 释义 |
| examples | []string | 是 | 例句数组 |
| ai_provider | string | 否 | AI 来源 |

- **成功返回**:

```json
{
  "code": 200,
  "message": "word saved",
  "data": {
    "id": 1,
    "user_id": 1,
    "word": "ephemeral",
    "definition": "adj. 短暂的",
    "examples": "[\"例句1\",\"例句2\",\"例句3\"]",
    "ai_provider": "qwen",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

- **失败返回**:

| 错误码 | 含义 |
|--------|------|
| 400 | 参数缺失 |
| 401 | 未认证 |
| 500 | 保存失败 |

---

### 2.3 获取单词列表（分页）

- **接口路径**: `GET /api/words`
- **鉴权说明**: 需要 JWT Token
- **请求参数** (Query):

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | int | 否 | 1 | 页码 |
| page_size | int | 否 | 10 | 每页数量（最大 100） |

- **成功返回**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "user_id": 1,
        "word": "ephemeral",
        "definition": "adj. 短暂的",
        "examples": "[\"例句1\"]",
        "ai_provider": "qwen",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "page_size": 10
  }
}
```

---

### 2.4 删除单词

- **接口路径**: `DELETE /api/word/:id`
- **鉴权说明**: 需要 JWT Token
- **请求参数** (Path):

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 单词记录 ID |

- **成功返回**:

```json
{
  "code": 200,
  "message": "word deleted"
}
```

- **失败返回**:

| 错误码 | 含义 |
|--------|------|
| 400 | 无效的 ID |
| 401 | 未认证 |
| 404 | 单词不存在或不属于当前用户 |
