import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { ApolloProvider } from '@apollo/client/react'
import { Provider as ReduxProvider, useDispatch } from 'react-redux'
import { getItem, deleteItem } from './src/utils/storage'
import { store } from './src/store'
import { apolloClient } from './src/graphql/client'
import { setCredentials, clearCredentials } from './src/store/slices/authSlice'
import { STORAGE_KEY_TOKEN } from './src/constants'
import RootNavigator from './src/navigation'
import { GET_ME } from './src/graphql/queries'

function AppBootstrap() {
  const dispatch = useDispatch()

  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await getItem(STORAGE_KEY_TOKEN)
        if (!token) {
          dispatch(clearCredentials())
          return
        }
        // Validate the token and fetch current user
        const { data } = await apolloClient.query({
          query: GET_ME,
          fetchPolicy: 'network-only',
        })
        const d = data as any
        if (d?.me) {
          dispatch(setCredentials({ token, user: d.me }))
        } else {
          // Token invalid or expired
          await deleteItem(STORAGE_KEY_TOKEN)
          dispatch(clearCredentials())
        }
      } catch {
        // Token expired or network error — log out
        await deleteItem(STORAGE_KEY_TOKEN)
        dispatch(clearCredentials())
      }
    }
    restoreSession()
  }, [dispatch])

  return <RootNavigator />
}

export default function App() {
  return (
    <ReduxProvider store={store}>
      <ApolloProvider client={apolloClient}>
        <StatusBar style="auto" />
        <AppBootstrap />
      </ApolloProvider>
    </ReduxProvider>
  )
}
