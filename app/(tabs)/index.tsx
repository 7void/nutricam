import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Animatable from 'react-native-animatable'
import { Ionicons } from '@expo/vector-icons'
import { Svg, Circle, G } from 'react-native-svg'

import { useMeals, Meal } from '../context/MealsContext'

const { width } = Dimensions.get('window')
const CAL_DIAL_SIZE = width * 0.32
const MACRO_DIAL_SIZE = width * 0.22

export default function HomeTab() {
  const router = useRouter()
  const [greeting, setGreeting] = useState('Hello')
  const { meals, goals } = useMeals()

  // Compute today's ISO date (YYYY-MM-DD)
  const todayIso = new Date().toISOString().split('T')[0]

  console.log('all meals:', meals)
  console.log('todayIso:', todayIso)

  // Filter to only today's meals
  const todayMeals = meals.filter((m: Meal) => m.date === todayIso)

  // Goals from context
  const dailyGoal = goals.calories
  const macroGoals = {
    protein: goals.protein,
    carbs:   goals.carbs,
    fat:     goals.fat,
  }

  // Sum today's calories and macros
  const todayCalories = todayMeals.reduce(
    (sum, m) => sum + m.items.reduce((s, it) => s + it.calories, 0),
    0
  )
  const macrosTotals = {
    protein: todayMeals.reduce(
      (sum, m) => sum + m.items.reduce((s, it) => s + it.protein, 0),
      0
    ),
    carbs: todayMeals.reduce(
      (sum, m) => sum + m.items.reduce((s, it) => s + it.carbs, 0),
      0
    ),
    fat: todayMeals.reduce(
      (sum, m) => sum + m.items.reduce((s, it) => s + it.fat, 0),
      0
    ),
  }

  useEffect(() => {
    const hr = new Date().getHours()
    if (hr < 12) setGreeting('Good morning')
    else if (hr < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  const ProgressCircle = ({ size, strokeWidth, progress, color = '#2A2A2A' }: { 
    size: number; 
    strokeWidth: number; 
    progress: number;
    color?: string;
  }) => {
    const radius = (size - strokeWidth) / 2
    const circ = 2 * Math.PI * radius
    const offset = circ * (1 - Math.min(progress, 1))
    return (
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>  
          <Circle 
            cx={size / 2} 
            cy={size / 2} 
            r={radius} 
            stroke="#F0F0F0" 
            strokeWidth={strokeWidth} 
            fill="none" 
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </Svg>
    )
  }

  const macroColors = {
    protein: '#4A4A4A',
    carbs: '#6A6A6A', 
    fat: '#8A8A8A'
  }

  const macroIcons = {
    protein: '●',
    carbs: '◐',
    fat: '◑'
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <FlatList
        data={todayMeals}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.headerSection}>
              <View style={styles.greetingContainer}>
                <Text style={styles.greetingText}>{greeting},</Text>
                <Text style={styles.nameText}>Soham</Text>
              </View>
            </View>

            {/* Stats Overview Card */}
            <View style={styles.statsCard}>
              <View style={styles.mainDialSection}>
                <View style={styles.calItem}>
                  <View style={styles.calHeader}>
                    <Text style={styles.calIcon}>○</Text>
                    <Text style={styles.calLabel}>Calories</Text>
                  </View>
                  <View style={styles.calDialContainer}>
                    <ProgressCircle 
                      size={CAL_DIAL_SIZE} 
                      strokeWidth={10} 
                      progress={todayCalories / dailyGoal}
                      color="#2A2A2A"
                    />
                    <View style={styles.calOverlay}>
                      <Text style={styles.calValue}>{Math.trunc(todayCalories)}</Text>
                      <Text style={styles.calGoal}>/{dailyGoal} kcal</Text>
                    </View>
                  </View>
                  <Text style={styles.calPercentage}>{Math.round((todayCalories / dailyGoal) * 100)}%</Text>
                </View>
              </View>

              <View style={styles.macroSection}>
                {(['protein', 'carbs', 'fat'] as const).map((key) => {
                  const val = macrosTotals[key]
                  const goal = macroGoals[key]
                  const percentage = Math.round((val / goal) * 100)
                  
                  return (
                    <View key={key} style={styles.macroItem}>
                      <View style={styles.macroHeader}>
                        <Text style={styles.macroIcon}>{macroIcons[key]}</Text>
                        <Text style={styles.macroLabel}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Text>
                      </View>
                      <View style={styles.macroDialContainer}>
                        <ProgressCircle 
                          size={MACRO_DIAL_SIZE} 
                          strokeWidth={6} 
                          progress={val / goal}
                          color={macroColors[key]}
                        />
                        <View style={styles.macroOverlay}>
                          <Text style={styles.macroValue}>{Math.trunc(val)}</Text>
                          <Text style={styles.macroGoal}>/{goal}g</Text>
                        </View>
                      </View>
                      <Text style={styles.macroPercentage}>{percentage}%</Text>
                    </View>
                  )
                })}
              </View>
            </View>

            {/* Add Meal Button */}
            <TouchableOpacity 
              style={styles.addMealButton} 
              onPress={() => router.push('/upload')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color="#2A2A2A" />
              <Text style={styles.addMealText}>Add New Meal</Text>
            </TouchableOpacity>

            {/* Today's Meals Header */}
            <View style={styles.mealsHeader}>
              <Text style={styles.sectionTitle}>Today's Meals</Text>
              <Text style={styles.mealCount}>{todayMeals.length} meal{todayMeals.length !== 1 ? 's' : ''}</Text>
            </View>
          </>
        }
        renderItem={({ item, index }) => {
          const mealCalories = item.items.reduce((s, it) => s + it.calories, 0)
          const itemCount = item.items.length
          
          return (
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => router.push(`/meal/${item.id}`)}
              style={styles.mealCardTouchable}
            >
              <Animatable.View animation="fadeInUp" delay={index * 100} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <View style={styles.mealTitleSection}>
                    <Text style={styles.mealName}>{item.name}</Text>
                    <Text style={styles.mealTime}>{item.time}</Text>
                  </View>
                  <View style={styles.mealStats}>
                    <Text style={styles.mealCalories}>{Math.trunc(mealCalories)}</Text>
                    <Text style={styles.mealCaloriesLabel}>kcal</Text>
                  </View>
                </View>
                <View style={styles.mealFooter}>
                  <Text style={styles.itemCount}>
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#8A8A8A" />
                </View>
              </Animatable.View>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No meals logged today</Text>
            <Text style={styles.emptySubText}>Tap "Add New Meal" to get started</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  headerSection: {
    marginBottom: 24,
    paddingTop: 10,
  },
  greetingContainer: {
    alignItems: 'flex-start',
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#6A6A6A',
    letterSpacing: -0.3,
  },
  nameText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
    marginTop: -2,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: '#E8E8E8',
  },
  mainDialSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  calItem: {
    alignItems: 'center',
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  calIcon: {
    fontSize: 16,
    color: '#6A6A6A',
    marginRight: 8,
  },
  calLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calDialContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 8,
  },
  calOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.7,
  },
  calGoal: {
    fontSize: 12,
    color: '#6A6A6A',
    fontWeight: '500',
    marginTop: 2,
  },
  calPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A6A6A',
  },
  macroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  macroIcon: {
    fontSize: 14,
    color: '#6A6A6A',
    marginRight: 6,
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A4A4A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  macroDialContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  macroGoal: {
    fontSize: 11,
    color: '#8A8A8A',
    fontWeight: '500',
    marginTop: -2,
  },
  macroPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A6A6A',
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  addMealText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    letterSpacing: 0.2,
    marginLeft: 8,
  },
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  mealCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8A8A8A',
  },
  mealCardTouchable: {
    borderRadius: 12,
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#E8E8E8',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mealTitleSection: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 14,
    color: '#6A6A6A',
    fontWeight: '500',
  },
  mealStats: {
    alignItems: 'flex-end',
  },
  mealCalories: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2A2A',
    letterSpacing: -0.3,
  },
  mealCaloriesLabel: {
    fontSize: 12,
    color: '#8A8A8A',
    fontWeight: '500',
    marginTop: 2,
  },
  mealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#F0F0F0',
  },
  itemCount: {
    fontSize: 13,
    color: '#8A8A8A',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#8A8A8A',
    textAlign: 'center',
  },
})