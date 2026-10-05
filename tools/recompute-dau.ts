require('dotenv').config()

// GlobalStats.dailyActiveUsers used to be counted over the one-hour bucket of
// each row, so the "DAU (30d avg.)" on the analytics page was really an average
// of hourly unique users. The updater now counts the rolling day ending at the
// row's time; this recounts the rows already stored the same way.
//
//   npx ts-node tools/recompute-dau.ts wax             # dry run, prints the plan
//   npx ts-node tools/recompute-dau.ts wax --apply     # actually updates
//   npx ts-node tools/recompute-dau.ts wax --days=45   # only rows from the last 45 days

import mongoose from 'mongoose'

import { GlobalStats } from '../server/models'
import { mongoConnect } from '../server/utils'
import { countActiveUsers } from '../server/services/updaterService/analytics'

const DAY_MS = 24 * 60 * 60 * 1000

function parseDays(flags: string[]): number | null {
  const flag = flags.find(f => f.startsWith('--days='))
  if (!flag) return null

  const days = Number(flag.split('=')[1])
  if (!Number.isInteger(days) || days <= 0) {
    console.log(`Invalid ${flag}`)
    process.exit(1)
  }
  return days
}

function average(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
}

async function main() {
  const [chain, ...flags] = process.argv.slice(2)
  const apply = flags.includes('--apply')
  const days = parseDays(flags)

  if (!chain) {
    console.log('Usage: npx ts-node tools/recompute-dau.ts <chain> [--days=N] [--apply]')
    process.exit(1)
  }

  await mongoConnect()

  const filter: any = { chain }
  if (days) filter.time = { $gte: new Date(Date.now() - days * DAY_MS) }

  const rows = await GlobalStats.find(filter, { time: 1, dailyActiveUsers: 1 }).sort({ time: 1 }).lean()
  console.log(`${chain}: ${rows.length} GlobalStats rows to recount`)

  const updates: { _id: any, time: Date, before: number, after: number }[] = []

  for (const [i, row] of rows.entries()) {
    const time = new Date(row.time)
    const after = await countActiveUsers(chain, new Date(time.getTime() - DAY_MS), time)
    updates.push({ _id: row._id, time, before: row.dailyActiveUsers ?? 0, after })
    process.stdout.write(`${i + 1}/${rows.length}\r`)
  }

  const monthAgo = Date.now() - 30 * DAY_MS
  const lastMonth = updates.filter(u => u.time.getTime() >= monthAgo)

  console.log('\nLatest rows:')
  for (const u of updates.slice(-5)) {
    console.log(`  ${u.time.toISOString()}  ${u.before} -> ${u.after}`)
  }
  console.log(`DAU (30d avg.): ${Math.round(average(lastMonth.map(u => u.before)))} -> ${Math.round(average(lastMonth.map(u => u.after)))}`)

  const changed = updates.filter(u => u.before != u.after)
  console.log(`${changed.length} rows change`)

  if (!apply || changed.length == 0) {
    if (!apply) console.log('Dry run. Re-run with --apply to write them.')
    await mongoose.disconnect()
    return
  }

  const { modifiedCount } = await GlobalStats.bulkWrite(changed.map(u => ({
    updateOne: { filter: { _id: u._id }, update: { $set: { dailyActiveUsers: u.after } } }
  })))
  console.log(`Updated ${modifiedCount} rows.`)

  await mongoose.disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
