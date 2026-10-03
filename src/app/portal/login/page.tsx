import { redirect } from 'next/navigation';

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const tab = params?.tab;
  if (tab === 'signup') {
    redirect('/login?tab=signup');
  }
  redirect('/login');
}
