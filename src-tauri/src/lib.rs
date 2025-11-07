// lib.rs - 暴露服务层给 CLI 和 GUI 使用

pub mod models;
pub mod services;
pub mod utils;

pub use models::*;
pub use services::*;
pub use utils::*;

// 重新导出常用类型
pub use anyhow::{Context, Result};
