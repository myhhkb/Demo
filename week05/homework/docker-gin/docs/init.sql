CREATE DATABASE IF NOT EXISTS ai_vocabulary DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ai_vocabulary;

CREATE TABLE IF NOT EXISTS users (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(64)     NOT NULL,
    password   VARCHAR(255)    NOT NULL COMMENT 'bcrypt hashed',
    created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS words (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    word        VARCHAR(128)    NOT NULL,
    definition  TEXT            NOT NULL COMMENT 'AI generated definition',
    examples    TEXT            NOT NULL COMMENT 'JSON array of example sentences',
    ai_provider VARCHAR(32)     NOT NULL DEFAULT '' COMMENT 'AI provider used',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at  DATETIME        DEFAULT NULL COMMENT 'soft delete',
    KEY idx_user_id (user_id),
    KEY idx_word (word),
    KEY idx_deleted_at (deleted_at),
    CONSTRAINT fk_words_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
