import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 在 ES Module 环境中手动获取当前文件目录。
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 拼接出 SQLite 数据库文件路径。
const dbPath = join(__dirname, '../../data/homework.db');

// 创建数据库连接。
const db = new Database(dbPath);

// 开启 WAL 模式，提高并发读写体验。
db.pragma('journal_mode = WAL');

// 开启外键约束，确保关联数据更安全。
db.pragma('foreign_keys = ON');

export default db;
