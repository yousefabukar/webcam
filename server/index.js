const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const os = require('os')
const ffmpeg = require('fluent-ffmpeg')
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg')
ffmpeg.setFfmpegPath(ffmpegInstaller.path)

const veritas = require('../../veritas-core/bindings')
const DUMMY_KEY_PATH = '/tmp/dummy.key'
const DOWNLOADS_DIR = path.join(os.homedir(), 'Downloads')

const app = express()
const upload = multer({ storage: multer.memoryStorage() })

// POST /pixels
// Accepts a PNG/JPEG image as multipart form-data field "image".
// Returns a JSON object with a "pixels" array — a flat Uint8Array of
// interleaved RGB values: [R, G, B, R, G, B, ...] for every pixel,
// plus the image width and height.
app.post('/pixels', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided. Send a PNG or JPEG as form-data field "image".' })
  }

  try {
    const ts = Date.now()
    const tmpPath = path.join(os.tmpdir(), `veritas_${ts}.jpg`)
    fs.writeFileSync(tmpPath, req.file.buffer)
    console.log(`Image saved to: ${tmpPath}`)

    const pkInfo = veritas.keyread(DUMMY_KEY_PATH)
    console.log(`Key read: key_id=${pkInfo.key_id}`)

    const signedPath = path.join(DOWNLOADS_DIR, `veritas_signed_${ts}.jpg`)
    veritas.sign(tmpPath, pkInfo.key_id, signedPath)
    console.log(`Signed image saved to: ${signedPath}`)

    const { data, info } = await sharp(req.file.buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true })

    const pixels = Array.from(new Uint8Array(data))

    res.json({
      width: info.width,
      height: info.height,
      channels: info.channels,
      pixels,
      signedPath
    })
  } catch (err) {
    res.status(422).json({ error: `Failed to process image: ${err.message}` })
  }
})

// POST /video
// Accepts a WebM video as multipart form-data field "video".
// Converts to MP4, saves to temp dir, and returns the file path.
app.post('/video', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided. Send a WebM as form-data field "video".' })
  }

  const ts = Date.now()
  const webmPath = path.join(os.tmpdir(), `veritas_${ts}.webm`)
  const mp4Path  = path.join(os.tmpdir(), `veritas_${ts}.mp4`)

  try {
    fs.writeFileSync(webmPath, req.file.buffer)

    await new Promise((resolve, reject) => {
      ffmpeg(webmPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .output(mp4Path)
        .on('end', resolve)
        .on('error', reject)
        .run()
    })

    fs.unlinkSync(webmPath)
    console.log(`Video saved to: ${mp4Path}`)
    res.json({ path: mp4Path })
  } catch (err) {
    try { fs.unlinkSync(webmPath) } catch (_) {}
    res.status(422).json({ error: `Failed to process video: ${err.message}` })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Pixel server running on http://localhost:${PORT}`)
  console.log(`POST an image to http://localhost:${PORT}/pixels`)
})
