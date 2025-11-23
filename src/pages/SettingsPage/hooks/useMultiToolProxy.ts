import { useState, useCallback, useEffect } from 'react';
import {
  startToolProxy,
  stopToolProxy,
  getAllProxyStatus,
  getGlobalConfig,
  saveGlobalConfig,
  type AllProxyStatus,
  type TransparentProxyStatus,
  type GlobalConfig,
  type ToolProxyConfig,
} from '@/lib/tauri-commands';

// 工具元数据
export interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  defaultPort: number;
}

export const SUPPORTED_TOOLS: ToolMetadata[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    description: 'Anthropic Claude 编程助手',
    defaultPort: 8787,
  },
  {
    id: 'codex',
    name: 'Codex',
    description: 'OpenAI Codex 编程助手',
    defaultPort: 8788,
  },
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    description: 'Google Gemini 命令行工具',
    defaultPort: 8789,
  },
];

// 默认工具配置
function getDefaultToolConfig(toolId: string): ToolProxyConfig {
  const tool = SUPPORTED_TOOLS.find((t) => t.id === toolId);
  return {
    enabled: false,
    port: tool?.defaultPort || 8790,
    local_api_key: null,
    real_api_key: null,
    real_base_url: null,
    real_model_provider: null,
    real_profile_name: null,
    allow_public: false,
    session_endpoint_config_enabled: false,
    auto_start: false,
  };
}

export function useMultiToolProxy() {
  const [allProxyStatus, setAllProxyStatus] = useState<AllProxyStatus>({});
  const [loadingTools, setLoadingTools] = useState<Set<string>>(new Set());
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig | null>(null);
  const [toolConfigs, setToolConfigs] = useState<Record<string, ToolProxyConfig>>({});
  const [savingConfig, setSavingConfig] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 加载全局配置
  const loadGlobalConfig = useCallback(async () => {
    try {
      const config = await getGlobalConfig();
      setGlobalConfig(config);

      // 初始化每个工具的配置
      const configs: Record<string, ToolProxyConfig> = {};
      for (const tool of SUPPORTED_TOOLS) {
        configs[tool.id] = config?.proxy_configs?.[tool.id] || getDefaultToolConfig(tool.id);
      }
      setToolConfigs(configs);
    } catch (error) {
      console.error('Failed to load global config:', error);
      throw error;
    }
  }, []);

  // 加载所有工具的代理状态
  const loadAllProxyStatus = useCallback(async () => {
    try {
      const status = await getAllProxyStatus();
      setAllProxyStatus(status);
    } catch (error) {
      console.error('Failed to load all proxy status:', error);
      throw error;
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    loadGlobalConfig().catch(console.error);
    loadAllProxyStatus().catch(console.error);
  }, [loadGlobalConfig, loadAllProxyStatus]);

  // 更新单个工具的配置（本地状态）
  const updateToolConfig = useCallback((toolId: string, updates: Partial<ToolProxyConfig>) => {
    setToolConfigs((prev) => ({
      ...prev,
      [toolId]: {
        ...prev[toolId],
        ...updates,
      },
    }));
    setHasUnsavedChanges(true);
  }, []);

  // 获取会话级端点配置开关状态
  const sessionEndpointConfigEnabled = globalConfig?.session_endpoint_config_enabled ?? false;

  // 更新会话级端点配置开关
  const setSessionEndpointConfigEnabled = useCallback(
    async (enabled: boolean) => {
      if (!globalConfig) return;
      const configToSave: GlobalConfig = {
        ...globalConfig,
        session_endpoint_config_enabled: enabled,
      };
      await saveGlobalConfig(configToSave);
      setGlobalConfig(configToSave);
    },
    [globalConfig],
  );

  // 保存配置到后端
  const saveToolConfigs = useCallback(async (): Promise<void> => {
    if (!globalConfig) {
      throw new Error('全局配置未加载');
    }

    console.log('开始保存配置，toolConfigs:', toolConfigs);
    setSavingConfig(true);
    try {
      const configToSave: GlobalConfig = {
        ...globalConfig,
        proxy_configs: toolConfigs,
      };

      console.log('准备保存的配置:', configToSave);
      await saveGlobalConfig(configToSave);
      setGlobalConfig(configToSave);
      setHasUnsavedChanges(false);
      console.log('配置保存成功');
    } catch (error) {
      console.error('配置保存失败:', error);
      throw error;
    } finally {
      setSavingConfig(false);
    }
  }, [globalConfig, toolConfigs]);

  // 生成代理 API Key
  const generateApiKey = useCallback(
    (toolId: string) => {
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = `dc-${toolId.replace('-', '')}-`;
      for (let i = 0; i < 24; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      updateToolConfig(toolId, { local_api_key: result });
    },
    [updateToolConfig],
  );

  // 启动指定工具的代理
  const handleStartToolProxy = useCallback(
    async (toolId: string): Promise<string> => {
      // 先保存配置
      await saveToolConfigs();

      setLoadingTools((prev) => new Set(prev).add(toolId));
      try {
        const result = await startToolProxy(toolId);
        await loadAllProxyStatus();
        return result;
      } finally {
        setLoadingTools((prev) => {
          const next = new Set(prev);
          next.delete(toolId);
          return next;
        });
      }
    },
    [loadAllProxyStatus, saveToolConfigs],
  );

  // 停止指定工具的代理
  const handleStopToolProxy = useCallback(
    async (toolId: string): Promise<string> => {
      setLoadingTools((prev) => new Set(prev).add(toolId));
      try {
        const result = await stopToolProxy(toolId);
        await loadAllProxyStatus();
        return result;
      } finally {
        setLoadingTools((prev) => {
          const next = new Set(prev);
          next.delete(toolId);
          return next;
        });
      }
    },
    [loadAllProxyStatus],
  );

  // 获取指定工具的状态
  const getToolStatus = useCallback(
    (toolId: string): TransparentProxyStatus | null => {
      return allProxyStatus[toolId] || null;
    },
    [allProxyStatus],
  );

  // 获取指定工具的配置
  const getToolConfig = useCallback(
    (toolId: string): ToolProxyConfig => {
      return toolConfigs[toolId] || getDefaultToolConfig(toolId);
    },
    [toolConfigs],
  );

  // 检查工具是否正在加载
  const isToolLoading = useCallback(
    (toolId: string): boolean => {
      return loadingTools.has(toolId);
    },
    [loadingTools],
  );

  return {
    allProxyStatus,
    toolConfigs,
    savingConfig,
    hasUnsavedChanges,
    sessionEndpointConfigEnabled,
    setSessionEndpointConfigEnabled,
    loadGlobalConfig,
    loadAllProxyStatus,
    updateToolConfig,
    saveToolConfigs,
    generateApiKey,
    handleStartToolProxy,
    handleStopToolProxy,
    getToolStatus,
    getToolConfig,
    isToolLoading,
  };
}
