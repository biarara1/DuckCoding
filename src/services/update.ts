import { invoke } from '@tauri-apps/api/core';

export interface UpdateUrls {
  // Windows 平台
  windows?: string;        // 通用 Windows 安装包
  windows_exe?: string;    // Windows .exe 安装包
  windows_msi?: string;    // Windows .msi 安装包

  // macOS 平台
  macos?: string;          // 通用 macOS 安装包
  macos_dmg?: string;      // macOS .dmg 安装包

  // Linux 平台
  linux?: string;          // 通用 Linux 安装包
  linux_deb?: string;      // Debian/Ubuntu .deb 包
  linux_rpm?: string;      // RedHat/CentOS .rpm 包
  linux_appimage?: string; // Linux AppImage 包

  // 通用版本
  universal?: string;      // 跨平台通用版本
}

export interface UpdateInfo {
  current_version: string;
  latest_version: string;
  has_update: boolean;
  update_url?: string;
  update?: UpdateUrls;
  release_notes?: string;
  file_size?: number;
  required: boolean;
}

export interface DownloadProgress {
  downloaded_bytes: number;
  total_bytes: number;
  percentage: number;
  speed?: number;
  eta?: number;
}

export interface PlatformInfo {
  os: string;
  arch: string;
  is_windows: boolean;
  is_macos: boolean;
  is_linux: boolean;
}

export interface PackageFormatInfo {
  platform: string;
  preferred_formats: string[];
  fallback_format: string;
}

export enum UpdateStatus {
  Idle = 'Idle',
  Checking = 'Checking',
  Available = 'Available',
  Downloading = 'Downloading',
  Downloaded = 'Downloaded',
  Installing = 'Installing',
  Installed = 'Installed',
  Failed = 'Failed',
  Rollback = 'Rollback',
  RolledBack = 'RolledBack',
}

// 检查应用更新
export async function checkForAppUpdates(): Promise<UpdateInfo> {
  return await invoke<UpdateInfo>('check_for_app_updates');
}

// 下载应用更新
export async function downloadAppUpdate(url: string): Promise<string> {
  return await invoke<string>('download_app_update', { url });
}

// 安装应用更新
export async function installAppUpdate(updatePath: string): Promise<void> {
  return await invoke<void>('install_app_update', { updatePath });
}

// 获取更新状态
export async function getAppUpdateStatus(): Promise<UpdateStatus> {
  return await invoke<UpdateStatus>('get_app_update_status');
}

// 回滚更新
export async function rollbackAppUpdate(): Promise<void> {
  return await invoke<void>('rollback_app_update');
}

// 获取当前版本
export async function getCurrentAppVersion(): Promise<string> {
  return await invoke<string>('get_current_app_version');
}

// 重启应用进行更新
export async function restartAppForUpdate(): Promise<void> {
  return await invoke<void>('restart_app_for_update');
}

// 获取平台信息
export async function getPlatformInfo(): Promise<PlatformInfo> {
  return await invoke<PlatformInfo>('get_platform_info');
}

// 获取推荐的包格式信息
export async function getRecommendedPackageFormat(): Promise<PackageFormatInfo> {
  return await invoke<PackageFormatInfo>('get_recommended_package_format');
}

// 监听下载进度事件
export function onUpdateDownloadProgress(callback: (progress: DownloadProgress) => void) {
  // 检查是否在Tauri环境中
  if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    return (window as any).__TAURI__.event.listen(
      'update-download-progress',
      (event: any) => {
        if (event && event.payload) {
          callback(event.payload as DownloadProgress);
        }
      }
    );
  }

  // 如果不在Tauri环境中，返回一个空函数
  return Promise.resolve(() => {});
}