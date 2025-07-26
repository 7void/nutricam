// meals.ts
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore'

// Reuse initialized app in firebase.js
import { auth, db } from './app/utils/firebase'

export interface Meal {
  id: string
  name: string
  date: string   // ISO YYYY-MM-DD
  time: string
  items: any[]
  timestamp?: Timestamp
}

/**
 * Fetch all meals (ordered newest → oldest)
 */
export const getAllMeals = async (): Promise<Meal[]> => {
  const user = auth.currentUser
  if (!user) throw new Error('User not authenticated')

  const mealsCol = collection(db, 'users', user.uid, 'meals')
  const q = query(mealsCol, orderBy('timestamp', 'desc'))

  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data() as any
    return {
      id:        d.id,
      name:      data.name,
      date:      data.date,
      time:      data.time,
      items:     data.items,
      timestamp: data.timestamp,
    }
  })
}

/**
 * Save a new meal document under users/{uid}/meals
 */
export const saveMeal = async (meal: Omit<Meal, 'timestamp'>): Promise<void> => {
  const user = auth.currentUser
  if (!user) throw new Error('User not authenticated')

  const mealsRef = collection(db, 'users', user.uid, 'meals')
  await addDoc(mealsRef, {
    ...meal,
    timestamp: Timestamp.fromDate(new Date()),
  })
}

/**
 * Overwrite fields of an existing meal
 */
export const updateMealRemote = async (
  id: string,
  updates: Partial<Omit<Meal, 'id' | 'timestamp'>>
): Promise<void> => {
  const user = auth.currentUser
  if (!user) throw new Error('User not authenticated')

  const mealDoc = doc(db, 'users', user.uid, 'meals', id)
  // merge: only overwrite provided fields
  await setDoc(mealDoc, { ...updates }, { merge: true })
}

/**
 * Delete a meal by its document ID
 */
export const deleteMealRemote = async (id: string): Promise<void> => {
  const user = auth.currentUser
  if (!user) throw new Error('User not authenticated')

  const mealDoc = doc(db, 'users', user.uid, 'meals', id)
  await deleteDoc(mealDoc)
}
