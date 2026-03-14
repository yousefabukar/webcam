const express = require('express')
const multer = require('multer')
const sharp = require('sharp')

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
    const { data, info } = await sharp(req.file.buffer)
      .removeAlpha()       // drop alpha → ensures 3 channels (RGB only)
      .raw()               // raw pixel output, no encoding
      .toBuffer({ resolveWithObject: true })

    // data is a Buffer of interleaved RGB bytes — one Uint8 per channel
    const pixels = Array.from(new Uint8Array(data))

    res.json({
      width: info.width,
      height: info.height,
      channels: info.channels,
      pixels                // flat [R,G,B, R,G,B, ...] — length = width * height * 3
    })
  } catch (err) {
    res.status(422).json({ error: `Failed to process image: ${err.message}` })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Pixel server running on http://localhost:${PORT}`)
  console.log(`POST an image to http://localhost:${PORT}/pixels`)
})
