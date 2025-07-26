// app/meal/[id].tsx
import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { StatusBar } from 'expo-status-bar'
import Slider from '@react-native-community/slider'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { useMeals, FoodItem } from '../context/MealsContext'
import { classifyWithClarifai, ClarifaiConcept } from '../utils/ClassifyFood'
import { fetchNutrition, Nutrition } from '../utils/nutritionixService'

const { width } = Dimensions.get('window')

export default function MealDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { meals, updateMeal } = useMeals()

  // --- Meal data ---
  const meal = meals.find((m) => m.id === id)!
  const [items, setItems] = useState<FoodItem[]>(meal.items)

  // --- Modal & classification state ---
  const [modalVisible, setModalVisible] = useState(false)
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [classifying, setClassifying] = useState(false)
  const [result, setResult] = useState<ClarifaiConcept | null>(null)
  const [macros, setMacros] = useState<Nutrition | null>(null)
  const [grams, setGrams] = useState(0)
  const [baseWeight, setBaseWeight] = useState(0)

  // Reset modal state
  function resetModal() {
    setPhotoUri(null)
    setClassifying(false)
    setResult(null)
    setMacros(null)
    setGrams(0)
    setBaseWeight(0)
  }

  // Open modal and reset
  const openModal = () => {
    resetModal()
    setModalVisible(true)
  }

  // Pick or snap image
  const pickImage = async () => {
    resetModal()
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 })
    if (!res.canceled && res.assets.length) setPhotoUri(res.assets[0].uri)
  }
  const snapPhoto = async () => {
    resetModal()
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 })
    if (!res.canceled && res.assets.length) setPhotoUri(res.assets[0].uri)
  }

  // Classify + fetch macros
  const classify = async () => {
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

  // Add to meal & close modal
  const addToMeal = () => {
    if (!result || !macros) return
    const item: FoodItem = {
      name:     result.name,
      grams,
      calories: macros.calories ?? 0,
      protein:  macros.protein  ?? 0,
      carbs:    macros.carbs    ?? 0,
      fat:      macros.fat      ?? 0,
    }
    const newItems = [...items, item]
    setItems(newItems)
    updateMeal({ ...meal, items: newItems })
    setModalVisible(false)
  }

  // Ask permissions on mount
  useEffect(() => {
    ;(async () => {
      await ImagePicker.requestCameraPermissionsAsync()
      await ImagePicker.requestMediaLibraryPermissionsAsync()
    })()
  }, [])

  // Keep items synced if meal updates elsewhere
  useEffect(() => {
    setItems(meal.items)
  }, [meal.items])

  // Totals
  const totals = items.reduce(
    (acc, it) => ({
      calories: acc.calories + it.calories,
      protein:  acc.protein + it.protein,
      carbs:    acc.carbs + it.carbs,
      fat:      acc.fat + it.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{meal.name}</Text>
        <Text style={styles.sub}>{meal.time}</Text>
      </View>

      {/* Items */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Items</Text>
        <FlatList
          data={items}
          keyExtractor={(_, i) => i.toString()}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          renderItem={({ item, index }) => (
            <View style={styles.itemRow}>
              <View style={styles.itemText}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemGram}>{item.grams} g</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  const filtered = items.filter((_, i) => i !== index)
                  setItems(filtered)
                  updateMeal({ ...meal, items: filtered })
                }}
              >
                <Text style={styles.remove}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      {/* Totals */}
      <View style={[styles.card, styles.totalsCard]}>
        <Text style={styles.sectionTitle}>Totals</Text>

        <View style={styles.totalsRow}>
          <Text style={styles.totalLabel}>Calories</Text>
          <Text style={styles.totalValue}>
            {Math.round(totals.calories)} kcal
          </Text>
        </View>

        <View style={styles.totalsRow}>
          <Text style={styles.totalLabel}>Protein</Text>
          <Text style={styles.totalValue}>
            {Math.round(totals.protein)} g
          </Text>
        </View>

        <View style={styles.totalsRow}>
          <Text style={styles.totalLabel}>Carbs</Text>
          <Text style={styles.totalValue}>
            {Math.round(totals.carbs)} g
          </Text>
        </View>

        <View style={styles.totalsRow}>
          <Text style={styles.totalLabel}>Fat</Text>
          <Text style={styles.totalValue}>
            {Math.round(totals.fat)} g
          </Text>
        </View>
      </View>


      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.addButton]} onPress={openModal}>
          <Text style={styles.addText}>+ Add Item</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={() => router.back()}>
          <Text style={styles.saveText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Add-Food Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
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
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <SafeAreaView style={styles.fullscreenModal}>
              <ScrollView contentContainerStyle={styles.fullContent}>
                <Image source={{ uri: photoUri }} style={styles.preview} />
                <TouchableOpacity
                  style={styles.classifyBtn}
                  onPress={classify}
                  disabled={classifying}
                >
                  {classifying ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.classifyText}>Classify</Text>
                  )}
                </TouchableOpacity>
                {result && macros && (
                  <>
                    <View style={styles.macrosCard}>
                      <Text style={styles.macroLabel}>
                        {result.name} · {(result.value * 100).toFixed(0)}%
                      </Text>
                      <Text style={styles.macro}>Calories: {macros.calories ?? '–'} kcal</Text>
                      <Text style={styles.macro}>Protein: {macros.protein ?? '–'} g</Text>
                      <Text style={styles.macro}>Carbs: {macros.carbs ?? '–'} g</Text>
                      <Text style={styles.macro}>Fat: {macros.fat ?? '–'} g</Text>
                    </View>
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
                            const nutri = await fetchNutrition(`${val} g ${result.name}`)
                            setMacros(nutri)
                          } catch (e: any) {
                            Alert.alert('Error', e.message)
                          } finally {
                            setClassifying(false)
                          }
                        }}
                      />
                    </View>
                    <TouchableOpacity style={styles.addToMealBtn} onPress={addToMeal}>
                      <Text style={styles.addToMealText}>Add to Meal</Text>
                    </TouchableOpacity>
                  </>
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
  container:    { flex: 1, backgroundColor: '#fafafa', padding: 16 },
  header:       { marginBottom: 16 },
  title:        { fontSize: 28, fontWeight: '700', color: '#333' },
  sub:          { fontSize: 16, color: '#888', marginTop: 4 },
  card:         {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#444' },
  divider:      { height: 1, backgroundColor: '#eee', marginVertical: 8 },
  itemRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemText:     { flexDirection: 'row', alignItems: 'flex-end' },
  itemName:     { fontSize: 16, color: '#333', flexShrink: 1 },
  itemGram:     { fontSize: 14, color: '#666', marginLeft: 8 },
  remove:       { color: '#f44336', fontWeight: '600' },
  totalsCard:   { marginBottom: 24 },
  totalsRow:    { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  totalLabel:   { fontSize: 16, color: '#555' },
  totalValue:   { fontSize: 16, fontWeight: '600', color: '#222' },
  actions:      { flexDirection: 'row', justifyContent: 'space-between' },
  button:       { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  addButton:    { backgroundColor: '#fff', borderWidth: 1, borderColor: '#007AFF', marginRight: 8 },
  addText:      { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  saveButton:   { backgroundColor: '#007AFF', marginLeft: 8 },
  saveText:     { fontSize: 16, color: '#fff', fontWeight: '600' },

  /* Modal styles */
  backdrop:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end' },
  bottomSheet:       { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  modalTitle:        { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  modalBtn:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalBtnText:      { marginLeft: 12, fontSize: 16 },
  modalCancel:       { marginTop: 16, alignItems: 'center' },
  modalCancelText:   { fontSize: 16, fontWeight: '600', color: '#666' },
  fullscreenModal:   { flex: 1, backgroundColor: '#fff' },
  fullContent:       { alignItems: 'center', padding: 16 },
  preview:           { width: width - 64, height: width - 64, borderRadius: 12, marginBottom: 16 },
  classifyBtn:       { backgroundColor: '#000', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16, width: '60%' },
  classifyText:      { color: '#fff', fontWeight: '600' },
  macrosCard:        { width: '90%', backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, marginBottom: 16 },
  macroLabel:        { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  macro:             { fontSize: 14, marginVertical: 2 },
  sliderRow:         { flexDirection: 'row', alignItems: 'center', width: '90%', marginBottom: 16 },
  gramText:          { fontSize: 16 },
  slider:            { flex: 1, marginHorizontal: 12 },
  addToMealBtn:      { backgroundColor: '#000', padding: 12, borderRadius: 8, alignItems: 'center', width: '60%' },
  addToMealText:     { color: '#fff', fontWeight: '600' },
})
