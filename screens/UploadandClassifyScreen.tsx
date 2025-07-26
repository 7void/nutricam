// screens/UploadAndClassifyScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Alert, SafeAreaView,
  StatusBar, Modal, Dimensions, ScrollView,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import Slider from '@react-native-community/slider'
import { Ionicons } from '@expo/vector-icons'
import {
  useRouter, useLocalSearchParams, useFocusEffect,
} from 'expo-router'

import { classifyWithClarifai, ClarifaiConcept } from '../app/utils/ClassifyFood'
import { fetchNutrition, Nutrition } from '../app/utils/nutritionixService'
import { useMeals, FoodItem, Meal } from '../app/context/MealsContext'

const { width } = Dimensions.get('window')

export default function UploadAndClassifyScreen() {
  const router = useRouter()
  const { mealId, auto } = useLocalSearchParams<{ mealId?: string; auto?: string }>()
  const { addMeal, updateMeal, meals } = useMeals()

  const autoOpened = useRef(false)

  //Form state
  const [mealName, setMealName] = useState('')
  const [mealTime, setMealTime] = useState('')
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])

  //Classification state
  const [modalVisible, setModalVisible] = useState(false)
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [classifying, setClassifying] = useState(false)
  const [result, setResult] = useState<ClarifaiConcept | null>(null)
  const [macros, setMacros] = useState<Nutrition | null>(null)
  const [grams, setGrams] = useState(0)
  const [baseWeight, setBaseWeight] = useState(0)

  useFocusEffect(
    useCallback(() => {
      //reset 
      setMealName('')
      setFoodItems([])
      resetClassification()
      setModalVisible(false)
      setMealTime(new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }))

      if (auto === 'true' && !autoOpened.current) {
        autoOpened.current = true
        setModalVisible(true)
      }
    }, [auto])
  )

  useEffect(() => {
    ;(async () => {
      await ImagePicker.requestCameraPermissionsAsync()
      await ImagePicker.requestMediaLibraryPermissionsAsync()
    })()
  }, [])

  //auto classify
  useEffect(() => {
    if (photoUri) {
      classify()
    }
  }, [photoUri])

  function resetClassification() {
    setResult(null)
    setMacros(null)
    setGrams(0)
    setBaseWeight(0)
    setPhotoUri(null)
  }

  async function pickImage() {
    resetClassification()
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 })
    if (!res.canceled && res.assets.length) setPhotoUri(res.assets[0].uri)
  }
  async function snapPhoto() {
    resetClassification()
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 })
    if (!res.canceled && res.assets.length) setPhotoUri(res.assets[0].uri)
  }

  async function classify() {
    if (!photoUri) return
    setClassifying(true)
    try {
      const preds = await classifyWithClarifai(photoUri)
      const top = preds.sort((a, b) => b.value - a.value)[0]
      setResult(top)
      const nutri = await fetchNutrition(`1 serving ${top.name}`)
      setMacros(nutri)
      setBaseWeight(nutri.servingWeight)
      setGrams(nutri.servingWeight)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setClassifying(false)
    }
  }

  function addToMeal() {
    if (!result || !macros) return

    const item: FoodItem = {
      name:     result.name,
      grams,
      calories: macros.calories ?? 0,
      protein:  macros.protein  ?? 0,
      carbs:    macros.carbs    ?? 0,
      fat:      macros.fat      ?? 0,
    }

    if (mealId) {
      const existing = meals.find((m) => m.id === mealId)
      if (existing) updateMeal({ ...existing, items: [...existing.items, item] })
      setModalVisible(false)
      router.back()
      return
    }

    //add locally and reset
    setFoodItems((f) => [...f, item])
    resetClassification()
  }

  const todayIso = new Date().toISOString().split('T')[0]

  function commitMeal() {
    const newMeal: Meal = {
      id: mealId ?? Date.now().toString(),
      name: mealName || 'Meal',
      time: mealTime,
      items: foodItems,
      date: todayIso,
    }

    if (mealId) {
      const existing = meals.find((m) => m.id === mealId)
      if (existing) updateMeal({ ...existing, items: [...existing.items, ...foodItems] })
    } else {
      addMeal(newMeal)
    }

    setMealName('')
    setFoodItems([])
    setModalVisible(false)
    router.back()
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Meal Card */}
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Meal Name"
          value={mealName}
          onChangeText={setMealName}
        />
        <Text style={styles.time}>{mealTime}</Text>
        {foodItems.map((itm, idx) => (
          <View key={idx} style={styles.itemContainer}>
            <Text style={styles.item}>
              • {itm.name} ({itm.grams}g)
            </Text>
          </View>
        ))}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            resetClassification()
            setModalVisible(true)
          }}
        >
          <Ionicons name="restaurant-outline" size={20} color="#000" />
          <Text style={styles.addBtnText}>Add Food Item</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.doneBtn} onPress={commitMeal}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.backdrop}>
          {!photoUri ? (
            <View style={styles.bottomSheet}>
              <Text style={styles.modalTitle}>Add Food</Text>
              <TouchableOpacity style={styles.modalBtn} onPress={pickImage}>
                <Ionicons name="image-outline" size={24} />
                <Text style={styles.modalBtnText}>Upload Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={snapPhoto}>
                <Ionicons name="camera-outline" size={24} />
                <Text style={styles.modalBtnText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  resetClassification()
                  setModalVisible(false)
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <SafeAreaView style={styles.fullscreenModal}>
              <ScrollView contentContainerStyle={styles.fullContent}>
                <View style={styles.imageContainer}>
                  <Image source={{ uri: photoUri }} style={styles.preview} />
                </View>
                
                {classifying && (
                  <View style={styles.classifyingContainer}>
                    <View style={styles.loadingCard}>
                      <ActivityIndicator size="large" color="#000" />
                      <Text style={styles.classifyingText}>Analyzing food...</Text>
                    </View>
                  </View>
                )}
                
                {result && macros && !classifying && (
                  <View style={styles.resultContainer}>
                    <View style={styles.macrosSection}>
                      <Text style={styles.macroLabel}>
                        {result.name}
                      </Text>
                      <Text style={styles.macro}>
                        Calories: {macros.calories ?? '–'} kcal
                      </Text>
                      <Text style={styles.macro}>
                        Protein: {macros.protein ?? '–'} g
                      </Text>
                      <Text style={styles.macro}>
                        Carbs: {macros.carbs ?? '–'} g
                      </Text>
                      <Text style={styles.macro}>
                        Fat: {macros.fat ?? '–'} g
                      </Text>
                    </View>
                    
                    <View style={styles.sliderSection}>
                      <View style={styles.sliderRow}>
                        <Text style={styles.gramText}>{grams} g</Text>
                        <Slider
                          style={styles.slider}
                          minimumValue={1}
                          maximumValue={baseWeight * 5}
                          step={1}
                          value={grams}
                          onValueChange={setGrams}
                          onSlidingComplete={async (val) => {
                            setClassifying(true)
                            try {
                              const nutri = await fetchNutrition(
                                `${val} g ${result.name}`
                              )
                              setMacros(nutri)
                            } catch (e: any) {
                              Alert.alert('Error', e.message)
                            } finally {
                              setClassifying(false)
                            }
                          }}
                        />
                      </View>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.addToMealBtn}
                      onPress={addToMeal}
                    >
                      <Text style={styles.addToMealText}>Add to Meal</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </SafeAreaView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  card: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fafafa',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
    marginTop: 60,
  },
  input: {
    fontSize: 24,
    fontWeight: '700',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 4,
    marginBottom: 12,
  },
  time: { fontSize: 16, color: '#666', marginBottom: 16 },
  itemContainer: {
    paddingVertical: 4,
  },
  item: { fontSize: 16, color: '#333' },
  addBtn: { flexDirection: 'row', alignItems: 'center',	marginTop: 16 },
  addBtnText: { marginLeft: 8, fontSize: 16, fontWeight: '600' },
  doneBtn: {
    marginTop: 24, backgroundColor: '#000', paddingVertical: 12,
    borderRadius: 12, alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  doneText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#fff', padding: 20,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {	fontSize: 18,	fontWeight: '600',	textAlign: 'center', marginBottom: 16 },
  modalBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  modalBtnText: { marginLeft: 12, fontSize: 16 },
  modalCancel: { marginTop: 16, alignItems: 'center' },
  modalCancelText: { fontSize: 16, fontWeight: '600',	color: '#666' },

  fullscreenModal: { flex: 1,	backgroundColor: '#fff' },
  fullContent: { alignItems: 'center',	padding: 16 },
  imageContainer: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
    borderRadius: 16,
    marginBottom: 16,
  },
  preview: {
    width: width - 64, height: width - 64,
    borderRadius: 16,
  },
  
  classifyingContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  classifyingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },

  resultContainer: {
    width: '90%',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  macrosSection: {
    marginBottom: 16,
  },
  macroLabel: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  macro: { fontSize: 14, marginVertical: 2 },

  sliderSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
    marginBottom: 16,
  },
  sliderRow: {
    flexDirection: 'row',	alignItems: 'center',
  },
  gramText: { fontSize: 16, fontWeight: '500' },
  slider: { flex: 1, marginHorizontal: 12 },

  addToMealBtn: {
    backgroundColor: '#000', padding: 16,
    borderRadius: 12, alignItems: 'center', width: '60%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  addToMealText: { color: '#fff', fontWeight: '600', fontSize: 16 },
})