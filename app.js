import express from 'express'
import cors from 'cors'
import connectDB from './db.js'
import entryRoutes from './routes/entries.js'

const app = express()

// ── Middleware ──
const defaultOrigins = [
  'https://meatbyalvibusinessdashboard.netlify.app',
  'http://localhost:5173'
]
const allowedOrigins = (process.env.CLIENT_ORIGIN || defaultOrigins.join(','))
  .split(',')
  .map((o) => o.trim())

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-side requests without origin and allow configured origins.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS origin denied: ${origin}`))
    }
  },
  optionsSuccessStatus: 200
}))
app.options('*', cors())
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
