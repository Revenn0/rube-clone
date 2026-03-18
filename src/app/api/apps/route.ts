import { NextResponse } from 'next/server';
import { APPS } from '@/lib/apps';

export async function GET() {
  return NextResponse.json({ apps: APPS });
}
