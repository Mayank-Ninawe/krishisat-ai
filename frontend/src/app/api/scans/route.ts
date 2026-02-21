import { NextRequest, NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebaseAdmin';
import { v4 as uuidv4 } from 'uuid';

// GET — History
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    const decoded = await auth.verifyIdToken(token!);

    const snapshot = await db.collection('scans')
      .where('farmerId', '==', decoded.uid)
      .orderBy('scannedAt', 'desc')
      .limit(20)
      .get();

    const scans = snapshot.docs.map(doc => doc.data());
    return NextResponse.json({ success: true, data: scans });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json({ success: false, error: message }, { status: 401 });
  }
}

// POST — New Scan
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    const decoded = await auth.verifyIdToken(token!);

    const formData = await req.formData();
    const image    = formData.get('image') as File;
    const cropType = formData.get('cropType') as string;

    // ML Service call
    const mlForm = new FormData();
    mlForm.append('file', image);
    const mlRes    = await fetch(`${process.env.ML_SERVICE_URL}/predict`, {
      method: 'POST', body: mlForm
    });
    const mlResult = await mlRes.json();

    // Firestore save
    const scanId     = uuidv4();
    const scanRecord = {
      scanId,
      farmerId      : decoded.uid,
      cropType      : cropType || 'unknown',
      disease       : mlResult.disease,
      confidence    : mlResult.confidence,
      riskLevel     : mlResult.risk_level,
      recommendation: mlResult.recommendation,
      scannedAt     : new Date().toISOString()
    };

    await db.collection('scans').doc(scanId).set(scanRecord);

    return NextResponse.json({ success: true, data: scanRecord }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
