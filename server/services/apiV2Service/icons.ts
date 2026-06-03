import { readFileSync } from 'fs'
import { Router } from 'express'
import axios from 'axios'
import FormData from 'form-data'
import formidable from 'express-formidable'

// Token icon uploader -> pins to Pinata and returns an ipfs:// CID
// for token_registry.image_url. Ported from contracts/token_registry/services/icon-uploader.
export const icons = Router()

const MAX_FILE_SIZE = 128 * 1024
const PINATA_ENDPOINT = 'https://api.pinata.cloud/pinning/pinFileToIPFS'
const PINATA_JWT = process.env.PINATA_JWT

const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp'])

icons.post('/upload', formidable(), async (req, res) => {
  try {
    if (!PINATA_JWT) {
      return res.status(500).json({ error: 'PINATA_JWT is not configured' })
    }

    const file = (req as any).files?.file
    if (!file) {
      return res.status(400).json({ error: 'file field is required' })
    }

    if (file.size > MAX_FILE_SIZE) {
      return res.status(413).json({ error: 'file is too large', max_file_size: MAX_FILE_SIZE })
    }

    const buffer = readFileSync(file.path)
    if (!allowedMimeTypes.has(file.type) || !matchesImageSignature(buffer, file.type)) {
      return res.status(415).json({ error: 'only png, jpeg, and webp images are allowed' })
    }

    const cid = await pinToPinata(buffer, file)
    res.json({
      cid,
      image_url: `ipfs://${cid}`,
      size: file.size,
      mime: file.type
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'upload failed' })
  }
})

async function pinToPinata(buffer: Buffer, file: any): Promise<string> {
  const filename = sanitizeFilename(file.name || `token-icon.${extensionForMime(file.type)}`)

  const form = new FormData()
  form.append('file', buffer, { filename, contentType: file.type })
  form.append('pinataMetadata', JSON.stringify({
    name: `alcor-token-icon:${filename}`,
    keyvalues: { app: 'alcor', kind: 'token-icon' }
  }))
  form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }))

  const { data } = await axios.post(PINATA_ENDPOINT, form, {
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${PINATA_JWT}`
    }
  })

  if (!data?.IpfsHash) {
    throw new Error(`Pinata response did not include IpfsHash: ${JSON.stringify(data)}`)
  }

  return data.IpfsHash
}

function matchesImageSignature(buffer: Buffer, mimetype: string): boolean {
  if (mimetype === 'image/png') {
    return buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  }

  if (mimetype === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  }

  if (mimetype === 'image/webp') {
    return buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  }

  return false
}

function sanitizeFilename(filename: string): string {
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
  return sanitized || 'token-icon'
}

function extensionForMime(mimetype: string): string {
  if (mimetype === 'image/png') return 'png'
  if (mimetype === 'image/jpeg') return 'jpg'
  if (mimetype === 'image/webp') return 'webp'
  return 'bin'
}
