use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// 工具定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tool {
    pub id: String,
    pub name: String,
    pub group_name: String,
    pub npm_package: String,
    pub check_command: String,
    pub config_dir: PathBuf,
    pub config_file: String,
    pub env_vars: EnvVars,
}

/// 环境变量配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvVars {
    pub api_key: String,
    pub base_url: String,
}

/// 安装方法
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum InstallMethod {
    Official, // 官方脚本
    Npm,      // npm install
    Brew,     // Homebrew (macOS)
}

impl Tool {
    /// 获取所有工具
    pub fn all() -> Vec<Tool> {
        vec![Tool::claude_code(), Tool::codex(), Tool::gemini_cli()]
    }

    /// 根据 ID 获取工具
    pub fn by_id(id: &str) -> Option<Tool> {
        Self::all().into_iter().find(|t| t.id == id)
    }

    /// Claude Code 定义
    pub fn claude_code() -> Tool {
        let home_dir = dirs::home_dir().expect("无法获取用户主目录");

        Tool {
            id: "claude-code".to_string(),
            name: "Claude Code".to_string(),
            group_name: "Claude Code 专用分组".to_string(),
            npm_package: "@anthropic-ai/claude-code".to_string(),
            check_command: "claude --version".to_string(),
            config_dir: home_dir.join(".claude"),
            config_file: "settings.json".to_string(),
            env_vars: EnvVars {
                api_key: "ANTHROPIC_AUTH_TOKEN".to_string(),
                base_url: "ANTHROPIC_BASE_URL".to_string(),
            },
        }
    }

    /// CodeX 定义
    pub fn codex() -> Tool {
        let home_dir = dirs::home_dir().expect("无法获取用户主目录");

        Tool {
            id: "codex".to_string(),
            name: "CodeX".to_string(),
            group_name: "CodeX 专用分组".to_string(),
            npm_package: "@openai/codex".to_string(),
            check_command: "codex --version".to_string(),
            config_dir: home_dir.join(".codex"),
            config_file: "config.toml".to_string(),
            env_vars: EnvVars {
                api_key: "OPENAI_API_KEY".to_string(),
                base_url: "base_url".to_string(), // TOML key
            },
        }
    }

    /// Gemini CLI 定义
    pub fn gemini_cli() -> Tool {
        let home_dir = dirs::home_dir().expect("无法获取用户主目录");

        Tool {
            id: "gemini-cli".to_string(),
            name: "Gemini CLI".to_string(),
            group_name: "Gemini CLI 专用分组".to_string(),
            npm_package: "@google/gemini-cli".to_string(),
            check_command: "gemini --version".to_string(),
            config_dir: home_dir.join(".gemini"),
            config_file: "settings.json".to_string(),
            env_vars: EnvVars {
                api_key: "GEMINI_API_KEY".to_string(),
                base_url: "GOOGLE_GEMINI_BASE_URL".to_string(),
            },
        }
    }

    /// 获取可用的安装方法
    pub fn available_install_methods(&self) -> Vec<InstallMethod> {
        let mut methods = vec![];

        match self.id.as_str() {
            "claude-code" => {
                methods.push(InstallMethod::Official);
                methods.push(InstallMethod::Npm);
            }
            "codex" => {
                methods.push(InstallMethod::Official);
                if cfg!(target_os = "macos") {
                    methods.push(InstallMethod::Brew);
                }
                methods.push(InstallMethod::Npm);
            }
            "gemini-cli" => {
                methods.push(InstallMethod::Npm);
            }
            _ => {}
        }

        methods
    }

    /// 获取推荐的安装方法
    pub fn recommended_install_method(&self) -> InstallMethod {
        match self.id.as_str() {
            "claude-code" => InstallMethod::Official,
            "codex" => {
                // CodeX 官方安装方法尚未实现，推荐使用 npm
                // 在 macOS 上如果有 Homebrew 也可以使用
                #[cfg(target_os = "macos")]
                {
                    // macOS 优先推荐 Homebrew，但由于需要异步检测，默认使用 npm
                    InstallMethod::Npm
                }
                #[cfg(not(target_os = "macos"))]
                {
                    InstallMethod::Npm
                }
            }
            "gemini-cli" => InstallMethod::Npm,
            _ => InstallMethod::Official,
        }
    }

    /// 获取备份配置路径
    pub fn backup_path(&self, profile_name: &str) -> PathBuf {
        let ext = std::path::Path::new(&self.config_file)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("");

        let basename = std::path::Path::new(&self.config_file)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("config");

        if ext.is_empty() {
            self.config_dir
                .join(format!("{}.{}", basename, profile_name))
        } else {
            self.config_dir
                .join(format!("{}.{}.{}", basename, profile_name, ext))
        }
    }
}

/// Provider 配置
pub const DUCKCODING_BASE_URL: &str = "https://jp.duckcoding.com";
