// filepath: e:\DuckCoding\src-tauri\src\models\config.rs

// 全局配置结构，移动到 models 以便在库和二进制之间共享
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct GlobalConfig {
    pub user_id: String,
    pub system_token: String,
    #[serde(default)]
    pub proxy_enabled: bool,
    #[serde(default)]
    pub proxy_type: Option<String>, // "http", "https", "socks5"
    #[serde(default)]
    pub proxy_host: Option<String>,
    #[serde(default)]
    pub proxy_port: Option<String>,
    #[serde(default)]
    pub proxy_username: Option<String>,
    #[serde(default)]
    pub proxy_password: Option<String>,
}
