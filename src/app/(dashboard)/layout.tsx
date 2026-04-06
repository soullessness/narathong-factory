import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/layout/AppLayout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <AppLayout
      userEmail={user.email}
      userRole={user.user_metadata?.role ?? 'viewer'}
      pageTitle="Dashboard"
    >
      {children}
    </AppLayout>
  )
}
