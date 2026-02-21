import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    const decoded = await auth.verifyIdToken(idToken);
    return NextResponse.json({ success: true, uid: decoded.uid });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 401 });
  }
}
