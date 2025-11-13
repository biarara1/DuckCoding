# ClaudeCode 透明代理使用指南

## 功能简介

透明代理是一个实验性功能，允许您在切换 ClaudeCode 账户时**无需重启终端**，配置将实时生效。

## 工作原理

1. **启用时**：修改 ClaudeCode 配置文件，将 API endpoint 指向本地代理（默认 `http://127.0.0.1:8787`）
2. **运行时**：本地代理拦截所有请求，使用真实的 API Key 和 Base URL 转发到上游服务器
3. **切换配置**：只更新代理的转发目标，ClaudeCode 配置文件保持指向本地代理
4. **停止时**：恢复 ClaudeCode 配置文件为真实的 API 配置

## 使用步骤

### 1. 配置 ClaudeCode

首先确保已经配置好 ClaudeCode 的 API：

- 在 "配置 API" 页面选择 ClaudeCode
- 填写 API Key 和 Base URL
- 保存配置

### 2. 启用透明代理

1. 打开 "全局设置"
2. 切换到 "实验性功能" 选项卡
3. 勾选 "ClaudeCode 透明代理"
4. 设置监听端口（默认 8787，建议不修改）
5. 设置保护密钥（至少 8 位，可点击"生成"按钮自动生成）
6. 点击"保存"

### 3. 启动代理

保存设置后，有两种启动方式：

**方式一：在设置页面启动**
- 在 "实验性功能" 选项卡中点击 "启动代理" 按钮

**方式二：在切换配置页面启动（推荐）**
- 切换到 "切换配置" 页面
- 页面顶部会显示透明代理状态卡片
- 点击 "启动代理" 按钮

### 4. 切换配置（无需重启）

启动代理后：

1. 在 "切换配置" 页面选择 ClaudeCode
2. 点击要切换的配置右侧的 "切换" 按钮
3. 配置会立即生效，**无需重启终端**
4. 可以在正在运行的 ClaudeCode 中直接使用新配置

### 5. 停止代理

如需停止透明代理：

1. 在 "切换配置" 页面或 "实验性功能" 选项卡
2. 点击 "停止代理" 按钮
3. ClaudeCode 配置会自动恢复为真实配置
4. 下次切换配置需要重启终端

## 注意事项

### ⚠️ 安全性

- **保护密钥**：用于验证请求来源，防止恶意访问本地代理
- **本地监听**：代理只监听 `127.0.0.1`，不会暴露到外网
- **妥善保管**：请妥善保管保护密钥，不要泄露

### 🔧 技术细节

- **支持 SSE**：完整支持流式响应（Server-Sent Events）
- **完全透明**：100% 转发所有 headers 和 body
- **只替换**：仅替换 `Authorization` header 和目标 URL
- **HTTPS 支持**：支持 HTTPS 上游服务器

### 🐛 故障排除

**问题：启动代理失败**
- 确保端口未被占用（默认 8787）
- 确保已配置 ClaudeCode API
- 检查保护密钥是否已设置

**问题：切换配置后仍使用旧配置**
- 确认透明代理正在运行
- 查看日志确认配置已更新
- 尝试停止并重新启动代理

**问题：请求失败**
- 检查上游 API 服务是否可用
- 确认真实的 API Key 和 Base URL 正确
- 查看控制台日志获取详细错误信息

## 技术架构

```
ClaudeCode CLI
    ↓ (请求)
http://127.0.0.1:8787
    ↓ (验证保护密钥)
透明代理服务
    ↓ (替换 API Key 和 URL)
真实 API 服务器
    ↓ (响应)
透明代理服务
    ↓ (原样返回)
ClaudeCode CLI
```

## 配置文件说明

### 全局配置 (~/.duckcoding/config.json)

```json
{
  "transparent_proxy_enabled": true,
  "transparent_proxy_port": 8787,
  "transparent_proxy_api_key": "your-protection-key",
  "transparent_proxy_real_api_key": "sk-xxx",
  "transparent_proxy_real_base_url": "https://jp.duckcoding.com"
}
```

### ClaudeCode 配置（启用代理时）

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your-protection-key",
    "ANTHROPIC_BASE_URL": "http://127.0.0.1:8787"
  }
}
```

## 开发和调试

查看代理日志：
- Windows: 查看终端输出
- 日志会显示每个请求的详细信息：
  - 请求方法和路径
  - 目标 URL
  - API Key 前缀（脱敏显示）

## 未来计划

- [ ] 支持更多 CLI 工具（CodeX、Gemini CLI）
- [ ] 支持自定义 header 转发规则
- [ ] 添加请求/响应日志记录
- [ ] 支持请求统计和监控

## 反馈

如遇到问题或有建议，请提交 Issue。

