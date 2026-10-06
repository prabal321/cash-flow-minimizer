import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { getItem } from '../utils/storage'
import { GRAPHQL_URI, STORAGE_KEY_TOKEN } from '../constants'

const httpLink = createHttpLink({ uri: GRAPHQL_URI })

// Attach the stored auth token to every request
const authLink = setContext(async (_, { headers }) => {
  const token = await getItem(STORAGE_KEY_TOKEN)
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  }
})

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
})
