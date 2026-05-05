import { syncMetaLeads } from '@/lib/sync'
import { NextResponse } from 'next/server'

// Called by Vercel Cron every 15 minutes.
// Vercel automatically adds Authorization: Bearer <CRON_SECRET> header.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const result = await syncMetaLeads()
  return NextResponse.json({ ...result, timestamp: new Date().toISOString() })
}
