import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from '../screens/LoginScreen';
import SearchScreen from '../screens/SearchScreen';
import ProviderDetailsScreen from '../screens/ProviderDetailsScreen';
import ProviderFormScreen from '../screens/ProviderFormScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme';

const RootStack = createNativeStackNavigator();
const MainTabs = createBottomTabNavigator();
const SearchStackNav = createNativeStackNavigator();
const ProfileStackNav = createNativeStackNavigator();

function SearchStack() {
  return (
    <SearchStackNav.Navigator screenOptions={{ headerShown: false }}>
      <SearchStackNav.Screen name="SearchHome" component={SearchScreen} />
      <SearchStackNav.Screen name="ProviderDetails" component={ProviderDetailsScreen} />
    </SearchStackNav.Navigator>
  );
}

function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStackNav.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileStackNav.Screen name="ProviderForm" component={ProviderFormScreen} />
    </ProfileStackNav.Navigator>
  );
}

function MainTabsNavigator() {
  return (
    <MainTabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = {
            Busca: focused ? 'search' : 'search-outline',
            Perfil: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <MainTabs.Screen name="Busca" component={SearchStack} />
      <MainTabs.Screen name="Perfil" component={ProfileStack} />
    </MainTabs.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="Main" component={MainTabsNavigator} />
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
