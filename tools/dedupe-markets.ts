require('dotenv').config()

// The Market collection holds duplicates: several documents sharing one
// (chain, id). They reach CoinMarketCap / CoinGecko as repeated ticker_id rows,
// and the extra copies are zombies - no price, no bid, no ask - because the
// updater only ever writes to one of them.
//
// The unique indexes declared in server/models.ts never built because of them,
// so drop the duplicates first, then let the indexes build.
//
//   npx ts-node tools/dedupe-markets.ts wax           # dry run, prints the plan
//   npx ts-node tools/dedupe-markets.ts wax --apply   # actually deletes

import mongoose from 'mongoose'

import { Market } from '../server/models'
import { mongoConnect } from '../server/utils'

// How alive a document looks. The updater writes prices to exactly one copy of
// each market, so the copy carrying them is the one the rest of the stack uses.
function liveliness(market: any): number {
  return [market.last_price, market.bid, market.ask, market.base_volume, market.volume90d]
    .filter(value => value)
    .length
}

async function main() {
  const [chain, ...flags] = process.argv.slice(2)
  const apply = flags.includes('--apply')

  if (!chain) {
    console.log('Usage: npx ts-node tools/dedupe-markets.ts <chain> [--apply]')
    process.exit(1)
  }

  await mongoConnect()

  const groups = await Market.aggregate([
    { $match: { chain } },
    { $group: { _id: { chain: '$chain', id: '$id' }, docs: { $push: '$$ROOT' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $sort: { '_id.id': 1 } },
  ])

  if (groups.length == 0) {
    console.log(`${chain}: no duplicates`)
    await mongoose.disconnect()
    return
  }

  const doomed: any[] = []

  for (const group of groups) {
    const ranked = [...group.docs].sort((a, b) => liveliness(b) - liveliness(a))
    const [keep, ...drop] = ranked

    console.log(`\n${keep.ticker_id} (market ${keep.id}): ${group.count} copies`)
    console.log(`  keep  ${keep._id}  last_price=${keep.last_price} bid=${keep.bid} ask=${keep.ask}`)
    for (const d of drop) {
      console.log(`  drop  ${d._id}  last_price=${d.last_price} bid=${d.bid} ask=${d.ask}`)
      doomed.push(d._id)
    }
  }

  console.log(`\n${chain}: ${groups.length} duplicated markets, ${doomed.length} documents to delete`)

  if (!apply) {
    console.log('Dry run. Re-run with --apply to delete them.')
    await mongoose.disconnect()
    return
  }

  const { deletedCount } = await Market.deleteMany({ _id: { $in: doomed } })
  console.log(`Deleted ${deletedCount} documents.`)
  console.log('Now restart the API so mongoose rebuilds the unique indexes on (chain, id) and (chain, ticker_id).')

  await mongoose.disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
