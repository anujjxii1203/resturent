import { cookies } from 'next/headers';

export async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated_restaurant_admin';
}
