import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const CRASH_LOG_DIR = path.resolve(process.cwd(), 'log/crashes');

function ensureCrashLogDir() {
  if (!fs.existsSync(CRASH_LOG_DIR)) {
    fs.mkdirSync(CRASH_LOG_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { level = 'ERROR', message, stack } = body;

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    ensureCrashLogDir();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `crash-${timestamp}.log`;
    const filepath = path.join(CRASH_LOG_DIR, filename);

    let content = `[${new Date().toISOString()}] [${level}] ${message}\n`;
    if (stack) {
      content += `stack: ${stack}\n`;
    }
    content += '---\n';

    fs.appendFileSync(filepath, content, 'utf-8');

    return NextResponse.json({ ok: true, path: filepath });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to write crash log', detail: String(err) },
      { status: 500 }
    );
  }
}
