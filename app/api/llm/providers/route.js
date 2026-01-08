import { NextResponse } from 'next/server';
import { getLlmProviders } from '@/lib/db/llm-providers';

// Get LLM provider data
export async function GET() {
  try {
    const result = await getLlmProviders();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Database query error:', String(error));
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }
}
