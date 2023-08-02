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
        pinata_api_key: process.env.IPFS_API_KEY,
        pinata_secret_api_key: process.env.IPFS_SECRET_API_KEY
      }
    }
  )
  res.json({ IpfsHash })
})


export default upload
