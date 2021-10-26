import mongoose from 'mongoose'

import { startUpdaters } from './updaters'

const dev = process.env.NODE_ENV !== 'production'

async function start () {
  const uri = dev ? 'mongodb://localhost:27017/alcor_dev' : 'mongodb://host.docker.internal:27017/alcor_prod_new'
  await mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true })
  console.log('MongoDB connected!')

  startUpdaters()
}

start()
