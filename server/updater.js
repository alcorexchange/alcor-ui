import mongoose from 'mongoose'

import { startUpdaters } from './updaters'

const dev = process.env.NODE_ENV !== 'production'

async function start () {
  const uri = 'mongodb://127.0.0.1:27018/alcor_prod_new'
  await mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true })
  console.log('MongoDB connected!')

  startUpdaters()
}

start()
