use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// 更新信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub current_version: String,
    pub latest_version: String,
    pub has_update: bool,
    pub update_url: Option<String>,
    pub update: Option<UpdateUrls>, // 所有平台的更新URL
    pub release_notes: Option<String>,
    pub file_size: Option<u64>,
    pub required: bool, // 是否为强制更新
}

/// 更新状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum UpdateStatus {
    Idle,                    // 空闲状态
    Checking,               // 检查更新中
    Available,              // 有可用更新
    Downloading,            // 下载中
    Downloaded,             // 下载完成
    Installing,             // 安装中
    Installed,              // 安装完成，等待重启
    Failed(String),         // 更新失败
    Rollback,               // 回滚中
    RolledBack,             // 回滚完成
}

/// 下载进度
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
    pub percentage: f32,
    pub speed: Option<u64>, // bytes per second
    pub eta: Option<u32>,   // estimated time remaining in seconds
}

impl Default for UpdateStatus {
    fn default() -> Self {
        UpdateStatus::Idle
    }
}

/// 下载任务信息
#[derive(Debug, Clone)]
pub struct DownloadTask {
    pub url: String,
    pub file_path: PathBuf,
    pub total_size: Option<u64>,
    pub downloaded: u64,
    pub start_time: std::time::Instant,
}

/// 平台信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformInfo {
    pub os: String,
    pub arch: String,
    pub is_windows: bool,
    pub is_macos: bool,
    pub is_linux: bool,
}

/// 包格式信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageFormatInfo {
    pub platform: String,
    pub preferred_formats: Vec<String>,
    pub fallback_format: String,
}

/// 更新配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateConfig {
    pub auto_check: bool,
    pub check_interval_hours: u32,
    pub download_in_background: bool,
    pub auto_install: bool,
}

impl Default for UpdateConfig {
    fn default() -> Self {
        Self {
            auto_check: true,
            check_interval_hours: 24,
            download_in_background: true,
            auto_install: false,
        }
    }
}

/// 镜像站API响应
#[derive(Debug, Deserialize)]
pub struct UpdateApiResponse {
    pub version: String,
    pub update: UpdateUrls,
    pub release_notes: Option<String>,
    pub required: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateUrls {
    // Windows 平台
    pub windows: Option<String>,        // 通用 Windows 安装包
    pub windows_exe: Option<String>,    // Windows .exe 安装包
    pub windows_msi: Option<String>,    // Windows .si 安装包

    // macOS 平台
    pub macos: Option<String>,          // 通用 macOS 安装包
    pub macos_dmg: Option<String>,      // macOS .dmg 安装包

    // Linux 平台
    pub linux: Option<String>,          // 通用 Linux 安装包
    pub linux_deb: Option<String>,      // Debian/Ubuntu .deb 包
    pub linux_rpm: Option<String>,      // RedHat/CentOS .rpm 包
    pub linux_appimage: Option<String>, // Linux AppImage 包

    // 通用包（如果有的话）
    pub universal: Option<String>,      // 跨平台通用包
}