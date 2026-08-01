import express from 'express'
import cors from 'cors'
import connectDB from './db.js'
import entryRoutes from './routes/entries.js'

const app = express()

// ── Middleware ──
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'https://meatbyalvibusinessdashboard.netlify.app')
  .split(',')
  .map((o) => o.trim())

app.use(cors({ origin: allowedOrigins }))
app.use(express.json())

// Ensure a MongoDB connection exists before handling any /api route.
// On Vercel this runs per invocation, but connectDB() caches the connection
// so a warm instance reuses it instead of reconnecting every time.
app.use(async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (err) {
    console.error('❌ Database connection error:', err.message)
    res.status(500).json({
      success: false,
      message: 'Database connection failed. Check MONGO_URI in your environment settings.'
    })
  }
})

// ── Routes ──
app.get('/', (req, res) => {
  res.json({ success: true, message: 'MeatbyAlvi Business Tracker API is running' })
})

app.use('/api/entries', entryRoutes)

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// ── Error handler (catches anything thrown/passed to next()) ──
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ success: false, message: 'Internal server error' })
})

export default app
