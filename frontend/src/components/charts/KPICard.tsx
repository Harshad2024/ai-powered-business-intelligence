import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: LucideIcon;
  gradient: string;
}

export function KPICard({ title, value, trend, trendUp, icon: Icon, gradient }: KPICardProps) {
  return (
    <div className="rounded-xl bg-card p-4 sm:p-5 shadow-card hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5 sm:space-y-2 min-w-0">
          <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-card-foreground truncate">{value}</p>
          <div className="flex items-center gap-1">
            {trendUp ? (
              <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-success shrink-0" />
            ) : (
              <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-destructive shrink-0" />
            )}
            <span className={`text-[10px] sm:text-xs font-semibold ${trendUp ? 'text-success' : 'text-destructive'}`}>
              {trend}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">vs last month</span>
          </div>
        </div>
        <div className={`flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg shrink-0 ${gradient}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
        </div>
      </div>
    </div>
  );
}
