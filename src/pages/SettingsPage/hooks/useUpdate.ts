import { useState, useEffect, useCallback } from 'react';
import {
  UpdateInfo,
  DownloadProgress,
  PlatformInfo,
  PackageFormatInfo,
  checkForAppUpdates,
  getAppUpdateStatus,
  downloadAppUpdate,
  installAppUpdate,
  restartAppForUpdate,
  getCurrentAppVersion,
  getPlatformInfo,
  getRecommendedPackageFormat,
  onUpdateDownloadProgress
} from '@/services/update';

interface UseUpdateProps {
  externalUpdateInfo?: UpdateInfo | null;
  onExternalUpdateCheck?: () => void;
}

export function useUpdate({ externalUpdateInfo, onExternalUpdateCheck }: UseUpdateProps = {}) {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string>('Idle');
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);
  const [packageFormatInfo, setPackageFormatInfo] = useState<PackageFormatInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化：获取当前版本、更新状态和更新信息
  useEffect(() => {
    const initializeUpdate = async () => {
      try {
        const [version, status, platform, packageFormat] = await Promise.all([
          getCurrentAppVersion(),
          getAppUpdateStatus(),
          getPlatformInfo(),
          getRecommendedPackageFormat(),
        ]);
        setCurrentVersion(version);
        setUpdateStatus(status);
        setPlatformInfo(platform);
        setPackageFormatInfo(packageFormat);

        // 如果当前状态是有更新，重新获取更新信息以保持状态同步
        if (status === 'Available' || status === 'Downloaded' || status === 'Installed') {
          try {
            const info = await checkForAppUpdates();
            setUpdateInfo(info);
          } catch (err) {
            console.warn('Failed to refresh update info during initialization:', err);
            // 不设置错误，因为这不是关键操作
          }
        }
      } catch (err) {
        console.error('Failed to initialize update:', err);
        setError('初始化更新服务失败');
      }
    };

    initializeUpdate();
  }, []);

  // 监听下载进度
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    try {
      unlisten = onUpdateDownloadProgress((progress) => {
        setDownloadProgress(progress);
      });
    } catch (error) {
      console.error('Failed to setup download progress listener:', error);
    }

    return () => {
      if (unlisten && typeof unlisten === 'function') {
        try {
          unlisten();
        } catch (error) {
          console.error('Failed to cleanup download progress listener:', error);
        }
      }
    };
  }, []);

  // 检查更新
  const checkForUpdates = useCallback(async () => {
    if (isChecking || isDownloading) return;

    setIsChecking(true);
    setError(null);

    try {
      // 如果有外部检查函数，优先使用
      if (onExternalUpdateCheck) {
        await onExternalUpdateCheck();
      } else {
        const info = await checkForAppUpdates();
        setUpdateInfo(info);

        if (info.has_update) {
          setUpdateStatus('Available');
        } else {
          setUpdateStatus('Idle');
        }
      }
    } catch (err) {
      console.error('Failed to check for updates:', err);
      setError('检查更新失败');
      setUpdateStatus('Failed');
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, isDownloading, onExternalUpdateCheck]);

  // 下载更新
  const downloadUpdate = useCallback(async () => {
    if (!updateInfo?.update_url || isDownloading) return null;

    setIsDownloading(true);
    setError(null);
    setUpdateStatus('Downloading');
    setDownloadProgress(null);

    try {
      const updatePath = await downloadAppUpdate(updateInfo.update_url);
      setUpdateStatus('Downloaded');
      return updatePath;
    } catch (err) {
      console.error('Failed to download update:', err);
      setError('下载更新失败: ' + (err as Error).message);
      setUpdateStatus('Failed');
      return null;
    } finally {
      setIsDownloading(false);
    }
  }, [updateInfo, isDownloading]);

  // 安装更新
  const installUpdate = useCallback(async (updatePath: string) => {
    if (!updatePath) return;

    setError(null);
    setUpdateStatus('Installing');

    try {
      await installAppUpdate(updatePath);
      setUpdateStatus('Installed');
    } catch (err) {
      console.error('Failed to install update:', err);
      setError('安装更新失败: ' + (err as Error).message);
      setUpdateStatus('Failed');
    }
  }, []);

  // 下载并安装更新
  const downloadAndInstallUpdate = useCallback(async () => {
    try {
      const updatePath = await downloadUpdate();
      if (updatePath) {
        await installUpdate(updatePath);
      }
    } catch (err) {
      console.error('Failed to download and install update:', err);
    }
  }, [downloadUpdate, installUpdate]);

  // 下载特定URL的更新包
  const downloadSpecificPackage = useCallback(async (url: string) => {
    if (!url || isDownloading) return null;

    setIsDownloading(true);
    setError(null);
    setUpdateStatus('Downloading');
    setDownloadProgress(null);

    try {
      const updatePath = await downloadAppUpdate(url);
      setUpdateStatus('Downloaded');
      return updatePath;
    } catch (err) {
      console.error('Failed to download update package:', err);
      setError('下载更新包失败: ' + (err as Error).message);
      setUpdateStatus('Failed');
      return null;
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading]);

  // 下载并安装特定包
  const downloadAndInstallSpecificPackage = useCallback(async (url: string) => {
    try {
      const updatePath = await downloadSpecificPackage(url);
      if (updatePath) {
        await installUpdate(updatePath);
      }
    } catch (err) {
      console.error('Failed to download and install specific package:', err);
    }
  }, [downloadSpecificPackage, installUpdate]);

  // 重启应用进行更新
  const restartToUpdate = useCallback(async () => {
    try {
      await restartAppForUpdate();
    } catch (err) {
      console.error('Failed to restart app:', err);
      setError('重启应用失败');
    }
  }, []);

  // 格式化文件大小
  const formatFileSize = useCallback((bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }, []);

  // 格式化下载速度
  const formatSpeed = useCallback((bytesPerSecond: number): string => {
    return formatFileSize(bytesPerSecond) + '/s';
  }, [formatFileSize]);

  // 格式化ETA
  const formatEta = useCallback((seconds: number): string => {
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
    return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分钟`;
  }, []);

  // 监听外部更新信息的变化
  useEffect(() => {
    if (externalUpdateInfo) {
      setUpdateInfo(externalUpdateInfo);

      // 同步更新状态
      if (externalUpdateInfo.has_update) {
        setUpdateStatus('Available');
      } else {
        setUpdateStatus('Idle');
      }
    }
  }, [externalUpdateInfo]);

  return {
    // 状态
    updateInfo,
    updateStatus,
    downloadProgress,
    currentVersion,
    platformInfo,
    packageFormatInfo,
    isChecking,
    isDownloading,
    error,

    // 方法
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    downloadAndInstallUpdate,
    downloadSpecificPackage,
    downloadAndInstallSpecificPackage,
    restartToUpdate,

    // 工具方法
    formatFileSize,
    formatSpeed,
    formatEta,

    // 计算属性
    hasUpdate: updateInfo?.has_update || false,
    isUpdateAvailable: updateStatus === 'Available' || (updateInfo?.has_update === true && updateStatus !== 'Checking'),
    isUpdateDownloaded: updateStatus === 'Downloaded',
    isUpdateInstalled: updateStatus === 'Installed',
    isUpdateFailed: updateStatus === 'Failed',
    downloadPercentage: downloadProgress?.percentage || 0,
  };
}