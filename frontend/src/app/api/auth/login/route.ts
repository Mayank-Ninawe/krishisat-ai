import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    const decoded = await getAuth().verifyIdToken(idToken);
    return NextResponse.json({ success: true, uid: decoded.uid });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ success: false, error: message }, { status: 401 });
  }
}
