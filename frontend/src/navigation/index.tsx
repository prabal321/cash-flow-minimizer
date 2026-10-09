import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'
import { useAppSelector } from '../hooks/useAppDispatch'
import type { RootStackParamList, AppStackParamList } from '../types'

import LoginScreen from '../screens/LoginScreen'
import SignUpScreen from '../screens/SignUpScreen'
import GroupsScreen from '../screens/GroupsScreen'
import GroupDetailScreen from '../screens/GroupDetailScreen'
import CreateGroupScreen from '../screens/CreateGroupScreen'
import AddExpenseScreen from '../screens/AddExpenseScreen'
import ExpenseDetailScreen from '../screens/ExpenseDetailScreen'
import SettlementsScreen from '../screens/SettlementsScreen'
import InviteMemberScreen from '../screens/InviteMemberScreen'
import AcceptInvitationScreen from '../screens/AcceptInvitationScreen'
import ProfileScreen from '../screens/ProfileScreen'
import { COLORS } from '../constants'

const RootStack = createNativeStackNavigator<RootStackParamList>()
const AppStack = createNativeStackNavigator<AppStackParamList>()
const Tab = createBottomTabNavigator()

const headerStyle = {
  headerStyle: { backgroundColor: COLORS.primary },
  headerTintColor: '#fff' as const,
  headerTitleStyle: { fontWeight: '700' as const },
}

function GroupsStack() {
  return (
    <AppStack.Navigator screenOptions={headerStyle}>
      <AppStack.Screen name="Groups" component={GroupsScreen} options={{ title: 'My Groups' }} />
      <AppStack.Screen name="GroupDetail" component={GroupDetailScreen}
        options={({ route }) => ({ title: (route.params as any).groupName })} />
      <AppStack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'New Group' }} />
      <AppStack.Screen name="AddExpense" component={AddExpenseScreen}
        options={({ route }) => ({ title: (route.params as any).expenseId ? 'Edit Expense' : 'Add Expense' })} />
      <AppStack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} options={{ title: 'Expense Details' }} />
      <AppStack.Screen name="Settlements" component={SettlementsScreen} options={{ title: 'Settlements' }} />
      <AppStack.Screen name="InviteMember" component={InviteMemberScreen} options={{ title: 'Invite Member' }} />
      <AppStack.Screen name="AcceptInvitation" component={AcceptInvitationScreen} options={{ title: 'Join Group' }} />
    </AppStack.Navigator>
  )
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: { borderTopColor: COLORS.border },
      }}
    >
      <Tab.Screen
        name="GroupsTab"
        component={GroupsStack}
        options={{ title: 'Groups', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
          header: () => null,
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  )
}

function AuthNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Login" component={LoginScreen} />
      <RootStack.Screen name="SignUp" component={SignUpScreen} />
    </RootStack.Navigator>
  )
}

export default function RootNavigator() {
  const token = useAppSelector((s) => s.auth.token)
  const isLoading = useAppSelector((s) => s.auth.isLoading)

  if (isLoading) return null

  return (
    <NavigationContainer>
      {token ? <AppTabs /> : <AuthNavigator />}
    </NavigationContainer>
  )
}
