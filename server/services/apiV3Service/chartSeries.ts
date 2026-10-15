// Time series for the analytics charts: fixed buckets with no holes.
//
// Chart points are only stored when something happens (a pool gets a point in the minute
// it trades), so a raw $group leaves out every quiet bucket: the line jumps across days and
// a chart axis built from the points squeezes time. Here every bucket of the range is
// present; levels such as TVL carry over from the last point, flows such as volume are 0.

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const WEEK_MS = 7 * DAY_MS

// The epoch was a Thursday. Weekly buckets start on Mondays, the first one 1970-01-05.
const WEEK_ORIGIN_MS = 4 * DAY_MS

// A bucket count no chart needs; past it the caller asked for the wrong resolution.
export const MAX_CHART_POINTS = 5000

function originOf(step: number): number {
  return step === WEEK_MS ? WEEK_ORIGIN_MS : 0
}

export function bucketStartMs(ms: number, step: number): number {
  const origin = originOf(step)
  return ms - ((((ms - origin) % step) + step) % step)
}

// The same bucket start as bucketStartMs, as a Mongo expression over `$time`.
export function mongoBucketStart(step: number) {
  const time = { $toLong: '$time' }
  return {
    $toDate: {
      $subtract: [time, { $mod: [{ $subtract: [time, originOf(step)] }, step] }],
    },
  }
}

// The buckets a chart covers: from the bucket holding `from` to the one holding `to`.
// A window start is moved back to its bucket boundary, so the first bucket is a whole one.
export function chartRange(from: Date, to: Date, step: number) {
  const start = bucketStartMs(from.getTime(), step)
  const end = bucketStartMs(to.getTime(), step)
  return { start, end, points: Math.floor((end - start) / step) + 1 }
}

type Row = { _id: Date } & Record<string, any>

// Every bucket from `start` to `end`. `levels` keep their last value (seeded from the
// last point before the range); `flows` are summed per bucket and 0 where nothing happened.
export function fillSeries<L extends string, F extends string>(opts: {
  rows: Row[]
  start: number
  end: number
  step: number
  levels: L[]
  flows: F[]
  seed?: Partial<Record<L, number>> | null
}): Array<{ t: Date } & Record<L | F, number>> {
  const { rows, start, end, step, levels, flows } = opts
  const byBucket = new Map(rows.map((r) => [new Date(r._id).getTime(), r]))

  const last: Record<string, number> = {}
  for (const level of levels) last[level] = Number(opts.seed?.[level] ?? 0) || 0

  const series = []
  for (let t = start; t <= end; t += step) {
    const row = byBucket.get(t)
    const point: Record<string, any> = { t: new Date(t) }

    for (const level of levels) {
      const value = row ? Number(row[level]) : NaN
      if (Number.isFinite(value)) last[level] = value
      point[level] = last[level]
    }
    for (const flow of flows) {
      const value = row ? Number(row[flow]) : 0
      point[flow] = Number.isFinite(value) ? value : 0
    }

    series.push(point)
  }

  return series as Array<{ t: Date } & Record<L | F, number>>
}
