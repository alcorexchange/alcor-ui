import fs from 'fs'

import { Router } from 'express'
import axios from 'axios'
import FormData from 'form-data'
import formidable from 'express-formidable'

const upload = Router()

upload.post('/ipfs', formidable(), async (req, res) => {
  const data = new FormData()
  data.append('file', fs.createReadStream(req.files.file.path))

  const { data: { IpfsHash } } = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS',
    data,
    {
      maxContentLength: 'Infinity', //this is needed to prevent axios from erroring out with large directories
      headers: {
        'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
        pinata_api_key: '17dc357e28a2501a3001',
        pinata_secret_api_key: 'd6bce3a02195e4e4ec54958d7e88dec7ad6098764ca5eac16d8bac4bce639f1c'
      }
    }
  )
  res.json({ IpfsHash })
})


export default upload
