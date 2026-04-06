import { KpiCard } from '@/components/dashboard/KpiCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FolderKanban,
  ClipboardList,
  TrendingUp,
  Gauge,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react'

const kpiData = [
  {
    title: 'โปรเจคทั้งหมด',
    value: 24,
    change: 12,
    changeLabel: 'เดือนที่แล้ว',
    icon: FolderKanban,
    iconBg: 'bg-amber-700',
  },
  {
    title: 'งานค้าง',
    value: 7,
    change: -14,
    changeLabel: 'เดือนที่แล้ว',
    icon: ClipboardList,
    iconBg: 'bg-orange-500',
  },
  {
    title: 'ยอดขายเดือนนี้',
    value: '฿2.4M',
    change: 8,
    changeLabel: 'เดือนที่แล้ว',
    icon: TrendingUp,
    iconBg: 'bg-green-600',
  },
  {
    title: 'ประสิทธิภาพโรงงาน',
    value: '87',
    change: 3,
    changeLabel: 'เดือนที่แล้ว',
    icon: Gauge,
    iconBg: 'bg-blue-600',
    suffix: '%',
  },
]

const recentProjects = [
  {
    id: 1,
    name: 'โครงการบ้านพักตากอากาศ - หัวหิน',
    customer: 'คุณสมชาย วิรัตน์',
    status: 'in_progress',
    due: '15 พ.ค. 2568',
  },
  {
    id: 2,
    name: 'รีโนเวทร้านอาหาร - เชียงใหม่',
    customer: 'บจก. ศิลาทอง',
    status: 'planning',
    due: '1 มิ.ย. 2568',
  },
  {
    id: 3,
    name: 'ตกแต่งภายใน - คอนโด The Base',
    customer: 'คุณนิตยา พงษ์ดี',
    status: 'completed',
    due: '30 เม.ย. 2568',
  },
  {
    id: 4,
    name: 'เฟอร์นิเจอร์สำนักงาน - กรุงเทพ',
    customer: 'บจก. ไทยอินดัสตรี',
    status: 'in_progress',
    due: '20 พ.ค. 2568',
  },
]

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; icon: React.ElementType }> = {
  in_progress: { label: 'กำลังดำเนินการ', variant: 'default', icon: Clock },
  planning: { label: 'วางแผน', variant: 'secondary', icon: AlertCircle },
  completed: { label: 'เสร็จสิ้น', variant: 'outline', icon: CheckCircle2 },
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">ภาพรวมการดำเนินงานโรงงานนราทองพลัส</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiData.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Recent Projects Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800">
            โปรเจคล่าสุด
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentProjects.map((project) => {
              const status = statusConfig[project.status]
              const StatusIcon = status.icon
              return (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-amber-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {project.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{project.customer}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-xs text-gray-400 hidden sm:block">
                      {project.due}
                    </span>
                    <Badge
                      variant={status.variant}
                      className="text-xs flex items-center gap-1 whitespace-nowrap"
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
