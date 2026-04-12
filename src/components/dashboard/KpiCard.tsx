import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  suffix?: string
}

export function KpiCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'text-white',
  iconBg = 'bg-[#2BA8D4]',
  suffix,
}: KpiCardProps) {
  const isPositive = change !== undefined && change >= 0

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-0 bg-white">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900">{value}</span>
              {suffix && (
                <span className="text-sm text-gray-500 ml-1">{suffix}</span>
              )}
            </div>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {isPositive ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs px-1.5 py-0',
                    isPositive
                      ? 'text-green-700 bg-green-50'
                      : 'text-red-700 bg-red-50'
                  )}
                >
                  {isPositive ? '+' : ''}
                  {change}%
                </Badge>
                {changeLabel && (
                  <span className="text-xs text-gray-400">{changeLabel}</span>
                )}
              </div>
            )}
          </div>
          <div
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-xl',
              iconBg
            )}
          >
            <Icon className={cn('w-6 h-6', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
