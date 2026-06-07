import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isAdminRequest } from '@/app/lib/supabaseAdmin';

export const runtime = 'nodejs';

// Admin-only: list all contact messages.
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('list messages error:', error.message);
    return NextResponse.json({ messages: [] });
  }

  const messages = (data ?? []).map((r: {
    id: string;
    name: string;
    email: string;
    content: string;
    read: boolean;
    created_at: string;
  }) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    content: r.content,
    read: r.read,
    createdAt: new Date(r.created_at).getTime(),
  }));

  return NextResponse.json({ messages });
}
