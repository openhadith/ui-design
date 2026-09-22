import { query } from '@/lib/db';
import LoginView from '@/components/LoginView';

export const dynamic = 'force-dynamic';

export default async function StudioLoginPage() {
  let accounts: Array<{
    id: number; name: string; email: string; role: string; avatar_tone: string; status: string;
  }> = [];
  let error: string | undefined;

  try {
    accounts = await query(
      `SELECT id, name, email, role, avatar_tone, status FROM studio_users ORDER BY
         CASE role WHEN 'supervisor' THEN 0 WHEN 'muhaqqiq' THEN 1 WHEN 'editor' THEN 2
                   WHEN 'reviewer' THEN 3 ELSE 4 END, id`,
    );
  } catch (err) {
    error = (err as Error).message;
  }

  return <LoginView accounts={accounts} error={error} />;
}
