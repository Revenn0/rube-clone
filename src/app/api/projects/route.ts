import { NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ projects: [] });

  try {
    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ projects });
  } catch (err) {
    console.error('Projects list error:', err);
    return NextResponse.json({ projects: [] });
  }
}

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, description, color } = body as { name: string; description?: string; color?: string };

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name required' }, { status: 400 });
  }

  try {
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#f26522',
      },
    });
    return NextResponse.json({ project });
  } catch (err) {
    console.error('Project create error:', err);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
