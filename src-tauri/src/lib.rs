// lib.rs - 暴露服务层给 CLI 和 GUI 使用

pub mod models;
pub mod services;
pub mod utils;

pub use models::*;
// Explicitly re-export only selected service types to avoid ambiguous glob re-exports
pub use services::config::ConfigService;
pub use services::installer::InstallerService;
pub use models::InstallMethod; // InstallMethod is defined in models (tool.rs) — re-export from models
pub use services::version::VersionService;
pub use services::proxy::ProxyService;
pub use services::transparent_proxy::{TransparentProxyService, ProxyConfig};
pub use services::transparent_proxy_config::TransparentProxyConfigService;

pub use utils::*;

// ���新导出常用类型
pub use anyhow::{Context, Result};
