import { syncModels, Match, sequelize } from './models'
import { Op } from 'sequelize'

async function main() {
  await syncModels()

  const where = {
    chain: 'wax',
    market: 26
  }

  const r = await sequelize.query(`
    SELECT
      datetime( (strftime('%s', time) / 86400) * 86400, 'unixepoch') interval,
      min( unit_price ) min, max ( unit_price) max, count (*) conunt
    FROM
      matches
    WHERE
      market = 26
    GROUP BY
      interval
    ORDER BY
      interval;
  `)
  //const matches = await Match.findAll({
  //  where,
  //  raw: true,
  //  group: 'time'
  //})

  console.log(r)
}

main()
