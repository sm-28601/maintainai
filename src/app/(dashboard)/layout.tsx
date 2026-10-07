import { getSession } from '@/lib/auth';
import MainLayout from '@/components/layout/MainLayout';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  
  return <MainLayout user={session}>{children}</MainLayout>;
}
