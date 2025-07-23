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
const CAL_DIAL_SIZE = width * 0.37
const MACRO_DIAL_SIZE = width * 0.25

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

  // Sum today’s calories and macros
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

  const ProgressCircle = ({ size, strokeWidth, progress }: { size: number; strokeWidth: number; progress: number }) => {
    const radius = (size - strokeWidth) / 2
    const circ = 2 * Math.PI * radius
    const offset = circ * (1 - Math.min(progress, 1))
    return (
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>  
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#eee" strokeWidth={strokeWidth} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#007AFF"
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

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greetingBold}>{greeting},</Text>
        <Text style={styles.greetingUser}>Soham</Text>
      </View>

      {/* Summary Dials */}
      <View style={styles.summary}>
        <View style={styles.calDialContainer}>
          <ProgressCircle size={CAL_DIAL_SIZE} strokeWidth={12} progress={todayCalories / dailyGoal} />
          <View style={styles.calOverlay}>
            <Text style={styles.dialInnerLabel}>Calories</Text>
            <Text style={styles.calText}>{Math.trunc(todayCalories)}</Text>
            <Text style={styles.calSubText}>/ {dailyGoal}</Text>
          </View>
        </View>

        <View style={styles.macroRow}>
          {(['protein', 'carbs', 'fat'] as const).map((key) => {
            const val = macrosTotals[key]
            const goal = macroGoals[key]
            return (
              <View key={key} style={styles.macroDialContainer}>
                <ProgressCircle size={MACRO_DIAL_SIZE} strokeWidth={8} progress={val / goal} />
                <View style={styles.macroOverlay}>
                  <Text style={styles.dialInnerLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                  <Text style={styles.macroValue}>{Math.trunc(val)}</Text>
                  <Text style={styles.macroSubText}>/ {goal}</Text>
                </View>
              </View>
            )
          })}
        </View>
      </View>

      {/* Add Meal */}
      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/upload')}>
        <Ionicons name="add-circle-outline" size={28} color="#000" />
        <Text style={styles.addText}>Add Meal</Text>
      </TouchableOpacity>

      {/* Today’s Meals */}
      <Text style={styles.sectionTitle}>Today’s Meals</Text>
      <FlatList
        data={todayMeals}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const mealCalories = item.items.reduce((s, it) => s + it.calories, 0)
          return (
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push(`/meal/${item.id}`)}>
              <Animatable.View animation="fadeInUp" delay={index * 80} style={styles.card}>
                <Text style={styles.mealName}>{item.name}</Text>
                <Text style={styles.mealInfo}>{Math.trunc(mealCalories)} kcal · {item.time}</Text>
              </Animatable.View>
            </TouchableOpacity>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { marginTop: 10 },
  greetingBold: { fontSize: 28, fontWeight: '700', color: '#000' },
  greetingUser: { fontSize: 20, fontWeight: '400', color: '#444', marginTop: 4 },

  summary: { marginTop: 24, alignItems: 'center' },

  calDialContainer: { position: 'relative', marginBottom: 24, alignItems: 'center' },
  calOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center' },
  dialInnerLabel: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 4 },
  calText: { fontSize: 32, fontWeight: '700', color: '#000' },
  calSubText: { fontSize: 12, color: '#666', marginTop: 2 },

  macroRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 16 },
  macroDialContainer: { position: 'relative', alignItems: 'center' },
  macroOverlay: { position: 'absolute', top: 4, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center' },
  macroValue: { fontSize: 18, fontWeight: '600', color: '#000', marginTop: -4 },
  macroSubText: { fontSize: 12, color: '#666', marginTop: 2 },

  addButton: { flexDirection: 'row', alignItems: 'center', marginTop: 32, alignSelf: 'center' },
  addText: { fontSize: 18, fontWeight: '600', color: '#000', marginLeft: 8 },

  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#000', marginTop: 32, marginBottom: 12 },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#ddd', shadowColor: '#000', shadowOpacity: 0.01, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4, elevation: 0 },
  mealName: { fontSize: 16, fontWeight: '500', color: '#000' },
  mealInfo: { fontSize: 14, color: '#666', marginTop: 4 },
})
