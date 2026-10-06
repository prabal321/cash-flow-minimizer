import 'dotenv/config'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import express from 'express'
import cors from 'cors'
import { typeDefs } from './graphql/schema/typeDefs'
import { resolvers } from './graphql/resolvers'
import { createContext } from './graphql/context/context'
import { serviceClient } from './config/supabase'
import type { Context } from './types'

const PORT = process.env.PORT ?? 4000

async function startServer() {
  const app = express()

  const server = new ApolloServer<Context>({ typeDefs, resolvers })
  await server.start()

  app.use(express.json())

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    expressMiddleware(server, { context: createContext }),
  )

  // Health endpoint — verifies server is up and Supabase is reachable
  app.get('/health', async (_req, res) => {
    try {
      const { error } = await serviceClient.from('profiles').select('id').limit(1)
      res.json({
        status: 'ok',
        db: error ? 'error' : 'connected',
        ...(error && { db_error: error.message }),
      })
    } catch (err) {
      res.status(500).json({ status: 'error', message: String(err) })
    }
  })

  app.listen(PORT, () => {
    console.log(` Server ready at http://localhost:${PORT}/graphql`)
    // console.log(`  Health check at http://localhost:${PORT}/health`)
  })
}

startServer().catch(console.error)
