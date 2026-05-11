# 数据库设计文档

## 数据库基本信息

- **数据库名**: `ai_vocabulary`
- **字符集**: `utf8mb4`
- **排序规则**: `utf8mb4_unicode_ci`
- **存储引擎**: InnoDB

## 表结构设计

### 1. users 表（用户表）

存储用户的账号信息。

| 字段名 | 数据类型 | 是否主键 | 是否可空 | 索引 | 默认值 | 说明 |
|--------|----------|----------|----------|------|--------|------|
| id | BIGINT UNSIGNED | 是 (PK) | 否 | AUTO_INCREMENT | - | 用户唯一标识 |
| username | VARCHAR(64) | 否 | 否 | UNIQUE (uk_username) | - | 用户名，唯一 |
| password | VARCHAR(255) | 否 | 否 | - | - | 密码（bcrypt 哈希） |
| created_at | DATETIME | 否 | 否 | - | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | 否 | 否 | - | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引说明**:
- `PRIMARY KEY (id)`: 主键索引
- `UNIQUE KEY uk_username (username)`: 用户名唯一索引，保证用户名不重复

---

### 2. words 表（单词表）

存储用户保存的单词记录，支持软删除。

| 字段名 | 数据类型 | 是否主键 | 是否可空 | 索引 | 默认值 | 说明 |
|--------|----------|----------|----------|------|--------|------|
| id | BIGINT UNSIGNED | 是 (PK) | 否 | AUTO_INCREMENT | - | 单词记录唯一标识 |
| user_id | BIGINT UNSIGNED | 否 | 否 | KEY (idx_user_id), FK | - | 关联用户 ID |
| word | VARCHAR(128) | 否 | 否 | KEY (idx_word) | - | 英语单词 |
| definition | TEXT | 否 | 否 | - | - | AI 生成的中文释义 |
| examples | TEXT | 否 | 否 | - | - | 例句，JSON 数组格式存储 |
| ai_provider | VARCHAR(32) | 否 | 否 | - | '' | AI 模型来源（qwen/deepseek） |
| created_at | DATETIME | 否 | 否 | - | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | 否 | 否 | - | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |
| deleted_at | DATETIME | 否 | 是 | KEY (idx_deleted_at) | NULL | 软删除时间标记 |

**索引说明**:
- `PRIMARY KEY (id)`: 主键索引
- `KEY idx_user_id (user_id)`: 用户 ID 索引，加速按用户查询
- `KEY idx_word (word)`: 单词索引，加速单词查找
- `KEY idx_deleted_at (deleted_at)`: 软删除索引，GORM 软删除查询优化
- `FOREIGN KEY fk_words_user (user_id) REFERENCES users(id) ON DELETE CASCADE`: 外键约束

---

## 表关联关系

```
┌─────────┐       1:N       ┌─────────┐
│  users  │────────────────▶│  words  │
│         │                 │         │
│  id (PK)│◀─── user_id(FK)│         │
└─────────┘                 └─────────┘
```

- **users 与 words**: 一对多关系。一个用户可以保存多个单词记录。
- 外键 `user_id` 引用 `users.id`，级联删除（用户被删除时，其所有单词记录一并删除）。
- words 表使用 GORM 软删除机制（`deleted_at` 字段），删除操作不会物理删除数据，而是标记删除时间。

## 设计说明

1. **密码安全**: `users.password` 存储 bcrypt 哈希值，而非明文密码。
2. **软删除**: `words.deleted_at` 为 NULL 表示未删除，非 NULL 表示已被软删除。GORM 会自动在查询中添加 `WHERE deleted_at IS NULL` 条件。
3. **例句存储**: `words.examples` 使用 JSON 数组字符串存储，例如 `["例句1","例句2","例句3"]`，便于前端直接解析使用。
4. **字符集选择**: 使用 `utf8mb4` 编码以支持完整的 Unicode 字符（包括中文和 emoji）。
