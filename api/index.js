import 'dotenv/config'
import app from '../app.js'

// Vercel's Node.js runtime accepts an Express app exported as the default —
// it calls it as (req, res), which is exactly Express's own request handler
// signature, so no extra wrapping is needed here.
export default app
