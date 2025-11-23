// 代理设置弹窗组件
// 用于配置透明代理的端口、密钥等参数

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ToolProxyConfig } from '@/lib/tauri-commands';
import type { ToolId } from '../types/proxy-history';

interface ProxySettingsDialogProps {
  /** 弹窗开关状态 */
  open: boolean;
  /** 开关状态变更回调 */
  onOpenChange: (open: boolean) => void;
  /** 工具 ID */
  toolId: ToolId;
  /** 工具名称 */
  toolName: string;
  /** 当前配置 */
  config: ToolProxyConfig | null;
  /** 保存配置回调 */
  onSave: (updates: Partial<ToolProxyConfig>) => Promise<void>;
}

/**
 * 代理设置弹窗组件
 *
 * 功能：
 * - 配置代理端口、保护密钥
 * - 启用/禁用代理
 * - 会话级端点配置开关（工具级）
 */
export function ProxySettingsDialog({
  open,
  onOpenChange,
  toolId,
  toolName,
  config,
  onSave,
}: ProxySettingsDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // 表单状态
  const [enabled, setEnabled] = useState(config?.enabled ?? false);
  const [port, setPort] = useState(config?.port ?? 8787);
  const [localApiKey, setLocalApiKey] = useState(config?.local_api_key ?? '');
  const [allowPublic, setAllowPublic] = useState(config?.allow_public ?? false);
  const [sessionEndpointEnabled, setSessionEndpointEnabled] = useState(
    config?.session_endpoint_config_enabled ?? false,
  );
  const [autoStart, setAutoStart] = useState(config?.auto_start ?? false);

  // 打开弹窗时重置表单状态
  useEffect(() => {
    if (open && config) {
      setEnabled(config.enabled);
      setPort(config.port);
      setLocalApiKey(config.local_api_key ?? '');
      setAllowPublic(config.allow_public);
      setSessionEndpointEnabled(config.session_endpoint_config_enabled ?? false);
      setAutoStart(config.auto_start ?? false);
    }
  }, [open, config]);

  // 生成随机 API Key
  const handleGenerateApiKey = () => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = `dc-${toolId.replace('-', '')}-`;
    for (let i = 0; i < 24; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setLocalApiKey(result);
  };

  // 复制密钥
  const handleCopyApiKey = async () => {
    if (!localApiKey) return;
    try {
      await navigator.clipboard.writeText(localApiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // 保存配置
  const handleSave = async () => {
    // 验证
    if (enabled && !localApiKey) {
      toast({
        title: '配置不完整',
        description: '请先生成或填写保护密钥',
        variant: 'destructive',
      });
      return;
    }

    if (port < 1024 || port > 65535) {
      toast({
        title: '端口无效',
        description: '端口号需要在 1024-65535 之间',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await onSave({
        enabled,
        port,
        local_api_key: localApiKey || null,
        allow_public: allowPublic,
        session_endpoint_config_enabled: sessionEndpointEnabled,
        auto_start: autoStart,
      });
      toast({
        title: '配置已保存',
        description: '代理设置已更新',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: '保存失败',
        description: String(error),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{toolName} 代理设置</DialogTitle>
          <DialogDescription>配置透明代理的端口、密钥等参数</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 启用代理 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>启用代理</Label>
              <p className="text-xs text-muted-foreground">开启后可使用透明代理功能</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {enabled && (
            <>
              {/* 监听端口 */}
              <div className="space-y-2">
                <Label htmlFor="port">监听端口</Label>
                <Input
                  id="port"
                  type="number"
                  min={1024}
                  max={65535}
                  value={port}
                  onChange={(e) => setPort(parseInt(e.target.value) || 8787)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">代理服务监听的本地端口号</p>
              </div>

              {/* 保护密钥 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="api-key">保护密钥</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateApiKey}
                    className="h-6 text-xs px-2"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    生成
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="点击「生成」按钮自动生成"
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    className="flex-1 font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyApiKey}
                    disabled={!localApiKey}
                    title="复制密钥"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">用于验证请求的本地 API 密钥</p>
              </div>

              {/* 允许公网访问 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>允许公网访问</Label>
                  <p className="text-xs text-muted-foreground">不推荐，可能存在安全风险</p>
                </div>
                <Switch checked={allowPublic} onCheckedChange={setAllowPublic} />
              </div>

              {/* 会话级端点配置 */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="space-y-0.5">
                  <Label>会话级端点配置</Label>
                  <p className="text-xs text-muted-foreground">
                    允许为每个代理会话单独配置 API 端点
                  </p>
                </div>
                <Switch
                  checked={sessionEndpointEnabled}
                  onCheckedChange={setSessionEndpointEnabled}
                />
              </div>

              {/* 应用启动时自动运行 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>应用启动时自动运行</Label>
                  <p className="text-xs text-muted-foreground">启动 DuckCoding 时自动启动此代理</p>
                </div>
                <Switch checked={autoStart} onCheckedChange={setAutoStart} />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存配置'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
