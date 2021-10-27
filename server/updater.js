require('dotenv').config()

import mongoose from 'mongoose'

import { startUpdaters } from './updaters'

async function start () {
  const uri = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/alcor_prod_new`
  await mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true })
  console.log('MongoDB connected!')

  startUpdaters()
}

start()
