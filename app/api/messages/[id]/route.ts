import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isAdminRequest } from '@/app/lib/supabaseAdmin';

export const runtime = 'nodejs';

// Admin-only: mark a message as read.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await getSupabaseAdmin()
    .from('messages')
    .update({ read: true })
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

// Admin-only: delete a message.
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await getSupabaseAdmin().from('messages').delete().eq('id', params.id);

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
