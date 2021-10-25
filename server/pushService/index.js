import io from 'socket.io'
import mongoose from 'mongoose'
import { Match } from '../models'

io.on('connection', socket => {

})

io.listen(3000)



async function main() {
  const uri = 'mongodb://localhost:27017/alcor_dev'

  await mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true })
  console.log('lol')

  Match.watch().on('change', match => {
    console.log('new match: ', match)
  })
}

main()
