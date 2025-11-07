import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useMemo } from 'react';
import type { UsageStatsResult } from '@/lib/tauri-commands';

interface UsageChartProps {
  stats: UsageStatsResult | null;
  loading: boolean;
}

export function UsageChart({ stats, loading }: UsageChartProps) {
  // 按日期聚合数据 - 使用 useMemo 缓存
  const chartData = useMemo(() => {
    if (!stats?.data || stats.data.length === 0) {
      return [];
    }

    console.log('Aggregating usage data, total records:', stats.data.length);

    const dateMap = new Map<
      string,
      {
        date: string;
        dateObj: Date;
        tokens: number;
        requests: number;
        quota: number;
        quotaRMB: number;
      }
    >();

    stats.data.forEach((item) => {
      const dateObj = new Date(item.created_at * 1000);
      const date = format(dateObj, 'MM-dd', { locale: zhCN });

      if (dateMap.has(date)) {
        const existing = dateMap.get(date)!;
        existing.tokens += item.token_used;
        existing.requests += item.count;
        existing.quota += item.quota;
        existing.quotaRMB += item.quota / 500000;
      } else {
        dateMap.set(date, {
          date,
          dateObj,
          tokens: item.token_used,
          requests: item.count,
          quota: item.quota,
          quotaRMB: item.quota / 500000,
        });
      }
    });

    // 按实际日期对象排序，而不是字符串
    const result = Array.from(dateMap.values()).sort(
      (a, b) => a.dateObj.getTime() - b.dateObj.getTime(),
    );

    return result;
  }, [stats]);

  // 计算总计 - 使用 useMemo 缓存
  const { totalQuota, totalRequests } = useMemo(() => {
    if (!stats?.data || stats.data.length === 0) {
      return { totalQuota: 0, totalRequests: 0 };
    }

    return {
      totalQuota: stats.data.reduce((sum, item) => sum + item.quota, 0) / 500000,
      totalRequests: stats.data.reduce((sum, item) => sum + item.count, 0),
    };
  }, [stats]);

  if (loading) {
    return (
      <Card className="shadow-sm border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            DuckCoding 用量趋势（近30天）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 animate-pulse bg-slate-100 dark:bg-slate-800 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const hasData = stats?.success && stats.data && stats.data.length > 0;

  if (!hasData) {
    return (
      <Card className="shadow-sm border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            DuckCoding 用量趋势（近30天）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16 text-sm text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>暂无用量数据</p>
            <p className="mt-2">请在全局设置中配置您的用户凭证</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatQuota = (value: number): string => {
    // 如果值很小，显示更多位数
    if (value < 0.01) {
      return `¥${value.toFixed(6)}`;
    } else if (value < 1) {
      return `¥${value.toFixed(4)}`;
    } else {
      return `¥${value.toFixed(2)}`;
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded border shadow-lg">
          <p className="font-semibold text-sm mb-2">{data.date}</p>
          <div className="space-y-1 text-xs">
            <p className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">请求次数:</span>
              <span className="font-semibold text-blue-600">{data.requests.toLocaleString()}</span>
            </p>
            <p className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">消费额度:</span>
              <span className="font-semibold text-green-600">{formatQuota(data.quotaRMB)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="shadow-sm border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            DuckCoding 用量趋势（近30天）
          </CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span>总消费:</span>
              <span className="font-semibold text-foreground">{formatQuota(totalQuota)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>总请求:</span>
              <span className="font-semibold text-foreground">
                {totalRequests.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'currentColor', fontSize: 11 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: 'currentColor', fontSize: 11 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
              label={{ value: '次数', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: 'currentColor', fontSize: 11 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `¥${value.toFixed(2)}`}
              label={{ value: '额度', angle: 90, position: 'insideRight', style: { fontSize: 11 } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} iconType="circle" />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="requests"
              name="请求次数"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              animationDuration={800}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="quotaRMB"
              name="消费额度 (¥)"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
