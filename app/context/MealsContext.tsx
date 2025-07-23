// app/context/MealsContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  getAllMeals,
  saveMeal,
  updateMealRemote,
  deleteMealRemote,
} from '../../meals'

export interface FoodItem {
  name: string
  grams: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface Meal {
  id: string
  name: string
  date: string   // ISO YYYY-MM-DD
  time: string
  items: FoodItem[]
}

export interface Goals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface MealsContextProps {
  meals: Meal[]
  addMeal: (meal: Meal) => Promise<void>
  updateMeal: (meal: Meal) => Promise<void>
  removeMeal: (id: string) => Promise<void>
  goals: Goals
  updateGoals: (goals: Goals) => Promise<void>
}

const defaultGoals: Goals = {
  calories: 2000,
  protein: 100,
  carbs: 250,
  fat: 70,
}

const MealsContext = createContext<MealsContextProps>({
  meals: [],
  addMeal: async () => {},
  updateMeal: async () => {},
  removeMeal: async () => {},
  goals: defaultGoals,
  updateGoals: async () => {},
})

export const MealsProvider = ({ children }: { children: ReactNode }) => {
  const [meals, setMeals] = useState<Meal[]>([])
  const [goals, setGoals] = useState<Goals>(defaultGoals)

  // On mount: load from Firestore, fallback to AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const remoteMeals = await getAllMeals()
        setMeals(remoteMeals)
        await AsyncStorage.setItem('meals', JSON.stringify(remoteMeals))
      } catch (e) {
        console.warn('Failed to load from Firestore, falling back to local', e)
        const stored = await AsyncStorage.getItem('meals')
        if (stored) setMeals(JSON.parse(stored))
      }
      const storedGoals = await AsyncStorage.getItem('goals')
      if (storedGoals) setGoals(JSON.parse(storedGoals))
    })()
  }, [])

  // Helper to persist locally
  const persistLocal = async (newMeals: Meal[]) => {
    setMeals(newMeals)
    try {
      await AsyncStorage.setItem('meals', JSON.stringify(newMeals))
    } catch (e) {
      console.error('Failed to save meals locally', e)
    }
  }

  // Add a meal both remotely and locally
  const addMeal = async (meal: Meal) => {
    try {
      await saveMeal(meal)
    } catch (e) {
      console.error('Failed to save meal remotely', e)
    }
    await persistLocal([meal, ...meals])
  }

  // Update a meal both remotely and locally
  const updateMeal = async (meal: Meal) => {
    try {
      await updateMealRemote(meal.id, meal)
    } catch (e) {
      console.error('Failed to update meal remotely', e)
    }
    const updated = meals.map(m => (m.id === meal.id ? meal : m))
    await persistLocal(updated)
  }

  // Remove a meal both remotely and locally
  const removeMeal = async (id: string) => {
    try {
      await deleteMealRemote(id)
    } catch (e) {
      console.error('Failed to delete meal remotely', e)
    }
    const filtered = meals.filter(m => m.id !== id)
    await persistLocal(filtered)
  }

  // Update goals (local only)
  const updateGoals = async (newGoals: Goals) => {
    setGoals(newGoals)
    try {
      await AsyncStorage.setItem('goals', JSON.stringify(newGoals))
    } catch (e) {
      console.error('Failed to save goals locally', e)
    }
  }

  return (
    <MealsContext.Provider
      value={{ meals, addMeal, updateMeal, removeMeal, goals, updateGoals }}
    >
      {children}
    </MealsContext.Provider>
  )
}

export const useMeals = () => useContext(MealsContext)
