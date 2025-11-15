//! HTTP 客户端构建工具：统一在一个地方处理代理与超时等配置。

use reqwest::{self, Client};

/// 构建一个遵循当前进程代理环境的 reqwest::Client。
/// 优先读取由 ProxyService 写入的环境变量（HTTP_PROXY/HTTPS_PROXY/ALL_PROXY 等）。
/// - 若配置了 `socks5://` 但构建失败，会返回更友好的错误提示。
pub fn build_client() -> Result<Client, String> {
    let mut builder = reqwest::Client::builder()
        .user_agent("DuckCoding-Updater/1.2.3")
        .timeout(std::time::Duration::from_secs(300)) // 5分钟超时
        .redirect(reqwest::redirect::Policy::limited(10)); // 支持重定向

    if let Some(proxy_url) = crate::ProxyService::get_current_proxy() {
        match reqwest::Proxy::all(&proxy_url) {
            Ok(proxy) => {
                builder = builder.proxy(proxy);
                builder.build()
                    .map_err(|e| format!("Failed to build reqwest client: {}", e))
            },
            Err(e) => {
                // 为 SOCKS5 提供更友好的错误说明
                if proxy_url.starts_with("socks5") {
                    return Err(format!(
                        "SOCKS5 代理初始化失败：{}。请确认已启用 reqwest 的 socks 特性并使用有效的 URL；若需要远程 DNS 解析，建议使用 socks5h://",
                        e
                    ));
                }
                Err(format!("Invalid proxy URL: {}", e))
            }
        }
    } else {
        builder.build()
            .map_err(|e| format!("Failed to build reqwest client: {}", e))
    }
}
