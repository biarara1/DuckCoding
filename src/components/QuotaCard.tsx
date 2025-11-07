import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Wallet, Activity } from 'lucide-react';
import type { UserQuotaResult } from '@/lib/tauri-commands';

interface QuotaCardProps {
  quota: UserQuotaResult | null;
  loading: boolean;
}

export function QuotaCard({ quota, loading }: QuotaCardProps) {
  if (loading) {
    return (
      <Card className="shadow-sm border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            账户额度信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
            <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
            <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quota || !quota.success) {
    return (
      <Card className="shadow-sm border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            账户额度信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p>暂无额度数据</p>
            <p className="mt-2">请在全局设置中配置您的用户凭证</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = quota.total_quota > 0 ? (quota.used_quota / quota.total_quota) * 100 : 0;

  const formatQuota = (value: number): string => {
    return `¥${value.toFixed(4)}`;
  };

  return (
    <Card className="shadow-sm border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          额度信息
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* 总额度 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">总额度</span>
            <span className="text-lg font-semibold">{formatQuota(quota.total_quota)}</span>
          </div>
        </div>

        {/* 已使用 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">已使用</span>
            <span className="text-lg font-semibold">{formatQuota(quota.used_quota)}</span>
          </div>
          <Progress value={usagePercentage} className="h-1.5" />
          <p className="text-xs text-muted-foreground text-right">{usagePercentage.toFixed(1)}%</p>
        </div>

        {/* 剩余额度 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">剩余额度</span>
            <span className="text-lg font-semibold">{formatQuota(quota.remaining_quota)}</span>
          </div>
        </div>

        {/* 请求次数 */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              总请求次数
            </span>
            <span className="text-base font-semibold">{quota.request_count.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
