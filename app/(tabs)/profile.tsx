// app/profile.tsx
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import {
  deleteUser,
  sendPasswordResetEmail,
  signOut,
  updateEmail,
  updatePassword,
} from 'firebase/auth'
import { useRef, useState } from 'react'
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Goals, useMeals } from '../context/MealsContext'
import { auth } from '../utils/firebase'
import { Ionicons } from '@expo/vector-icons'


export default function ProfileScreen() {
  const router = useRouter()
  const { goals, updateGoals } = useMeals()
  const user = auth.currentUser
  const email = user?.email ?? ''

  // Goal fields
  const [calorieGoal, setCalorieGoal] = useState(goals.calories.toString())
  const [proteinGoal, setProteinGoal] = useState(goals.protein.toString())
  const [carbsGoal, setCarbsGoal]     = useState(goals.carbs.toString())
  const [fatGoal, setFatGoal]         = useState(goals.fat.toString())

  // Password & Email fields
  const [newPassword, setNewPassword] = useState('')
  const [newEmail, setNewEmail]       = useState('')

  // User info fields
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [age, setAge] = useState('')
  const [activityLevel, setActivityLevel] = useState('Moderate')
  const [showActivityPicker, setShowActivityPicker] = useState(false)
  
  // Animation values
  const modalAnimation = useRef(new Animated.Value(0)).current
  const backdropAnimation = useRef(new Animated.Value(0)).current

  // ----- Handlers -----
  const onSaveGoals = () => {
    if (!calorieGoal || !proteinGoal || !carbsGoal || !fatGoal) {
      return Alert.alert('Error', 'Please fill in all goal fields.')
    }
    const newGoals: Goals = {
      calories: parseInt(calorieGoal, 10),
      protein:  parseInt(proteinGoal, 10),
      carbs:    parseInt(carbsGoal,   10),
      fat:      parseInt(fatGoal,     10),
    }
    updateGoals(newGoals)
    Alert.alert('Success', 'Your goals have been updated.')
  }

  const onSaveUserInfo = () => {
    Alert.alert('Success', 'Your personal information has been updated.')
  }

  const onPasswordReset = async () => {
    if (!email) return
    try {
      await sendPasswordResetEmail(auth, email)
      Alert.alert('Reset Email Sent', `Password reset email sent to ${email}`)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    }
  }

  const onChangePassword = async () => {
    if (!newPassword) {
      return Alert.alert('Error', 'Please enter a new password.')
    }
    try {
      if (user) {
        await updatePassword(user, newPassword)
        Alert.alert('Success', 'Password updated successfully.')
        setNewPassword('')
      }
    } catch (e: any) {
      Alert.alert('Error', e.message)
    }
  }

  const onChangeEmail = async () => {
    if (!newEmail || newEmail === email) {
      return Alert.alert('Error', 'Please enter a valid new email address.')
    }
    try {
      if (user) {
        await updateEmail(user, newEmail)
        Alert.alert('Success', `Email updated to ${newEmail}`)
        setNewEmail('')
      }
    } catch (e: any) {
      Alert.alert('Error', e.message)
    }
  }

  const onLogout = async () => {
    try {
      await signOut(auth)
      router.replace('/login')
    } catch (e: any) {
      Alert.alert('Error', e.message)
    }
  }

  const onDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is irreversible. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user) {
                await deleteUser(user)
                router.replace('/signup')
              }
            } catch (e: any) {
              Alert.alert('Error', e.message)
            }
          },
        },
      ]
    )
  }

  const nutritionGoals = [
    { label: 'Calories', value: calorieGoal, onChange: setCalorieGoal, unit: 'kcal', icon: '○' },
    { label: 'Protein', value: proteinGoal, onChange: setProteinGoal, unit: 'g', icon: '●' },
    { label: 'Carbs', value: carbsGoal, onChange: setCarbsGoal, unit: 'g', icon: '◐' },
    { label: 'Fat', value: fatGoal, onChange: setFatGoal, unit: 'g', icon: '◑' },
  ]

  const activityLevels = ['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active']

  //Animations
  const openActivityPicker = () => {
    setShowActivityPicker(true)
    Animated.parallel([
      Animated.spring(modalAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(backdropAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const closeActivityPicker = () => {
    Animated.parallel([
      Animated.spring(modalAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }),
      Animated.timing(backdropAnimation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowActivityPicker(false)
    })
  }

  const selectActivityLevel = (level: string) => {
    setActivityLevel(level)
    closeActivityPicker()
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!showActivityPicker}
        >

          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.header}>Profile</Text>
            <Text style={styles.version}>v{Constants.manifest?.version || '1.0.0'}</Text>
          </View>

          {/* Personal Information Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Personal Information</Text>
            <View style={styles.card}>
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Height (cm)</Text>
                  <TextInput
                    style={styles.modernInput}
                    placeholder="170"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    value={height}
                    onChangeText={setHeight}
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Weight (kg)</Text>
                  <TextInput
                    style={styles.modernInput}
                    placeholder="70"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    value={weight}
                    onChangeText={setWeight}
                  />
                </View>
              </View>
              
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Age</Text>
                  <TextInput
                    style={styles.modernInput}
                    placeholder="25"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    value={age}
                    onChangeText={setAge}
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Activity Level</Text>
                  <TouchableOpacity 
                    style={styles.pickerContainer} 
                    onPress={openActivityPicker}
                  >
                    <Text style={styles.pickerText}>{activityLevel}</Text>
                    <Text style={styles.pickerArrow}>▼</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={onSaveUserInfo}>
                <Text style={styles.primaryButtonText}>Save Personal Info</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Custom Activity Level Picker */}
          {showActivityPicker && (
            <View style={styles.pickerOverlay}>
              <Animated.View 
                style={[
                  styles.pickerBackdrop,
                  {
                    opacity: backdropAnimation,
                  }
                ]}
              >
                <TouchableOpacity 
                  style={styles.pickerBackdropTouch} 
                  onPress={closeActivityPicker}
                  activeOpacity={1}
                />
              </Animated.View>
              <Animated.View 
                style={[
                  styles.pickerModal,
                  {
                    opacity: modalAnimation,
                    transform: [
                      {
                        scale: modalAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1],
                        }),
                      },
                      {
                        translateY: modalAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-50, 0],
                        }),
                      },
                    ],
                  }
                ]}
              >
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Select Activity Level</Text>
                  <TouchableOpacity 
                    style={styles.pickerClose} 
                    onPress={closeActivityPicker}
                  >
                    <Text style={styles.pickerCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                {activityLevels.map((level, index) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.pickerOption,
                      activityLevel === level && styles.pickerOptionSelected,
                      index === activityLevels.length - 1 && styles.pickerOptionLast
                    ]}
                    onPress={() => selectActivityLevel(level)}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      activityLevel === level && styles.pickerOptionTextSelected
                    ]}>
                      {level}
                    </Text>
                    {activityLevel === level && (
                      <Text style={styles.pickerCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </Animated.View>
            </View>
          )}

          {/* Nutrition Goals Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Nutrition Goals</Text>
            <View style={styles.card}>
              <View style={styles.goalsGrid}>
                {nutritionGoals.map(({ label, value, onChange, unit, icon }) => (
                  <View key={label} style={styles.goalItem}>
                    <View style={styles.goalHeader}>
                      <Text style={styles.goalIcon}>{icon}</Text>
                      <Text style={styles.goalLabel}>{label}</Text>
                    </View>
                    <View style={styles.goalInputContainer}>
                      <TextInput
                        style={styles.goalInput}
                        keyboardType="number-pad"
                        value={value}
                        onChangeText={onChange}
                        placeholder="0"
                        placeholderTextColor="#9CA3AF"
                      />
                      <Text style={styles.goalUnit}>{unit}</Text>
                    </View>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={onSaveGoals}>
                <Text style={styles.primaryButtonText}>Save Goals</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/*Account Section*/}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Account</Text>
            <View style={styles.card}>
              
              {/* User PFP */}
              <View style={styles.userBadge}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userInitial}>{email.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userEmail}>{email}</Text>
                  <TouchableOpacity onPress={onPasswordReset}>
                    <Text style={styles.resetLink}>Reset Password</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quick Actions Grid */}
              <View style={styles.actionsGrid}>
                <TouchableOpacity style={styles.actionItem} onPress={() => setNewEmail(email)}>
                  <View style={styles.actionIcon}>
                    <Text style={styles.actionIconText}>@</Text>
                  </View>
                  <Text style={styles.actionLabel}>Change Email</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={() => setNewPassword('')}>
                  <View style={styles.actionIcon}>
                    <Ionicons name="lock-closed" size={24} color="#453a3aff"/>
                  </View>
                  <Text style={styles.actionLabel}>Change Password</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={onLogout}>
                  <View style={[styles.actionIcon, styles.logoutIcon]}>
                    <Text style={styles.actionIconText}>↗</Text>
                  </View>
                  <Text style={styles.actionLabel}>Sign Out</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={onDeleteAccount}>
                  <View style={[styles.actionIcon, styles.deleteIcon]}>
                    <Text style={styles.actionIconText}>⚠</Text>
                  </View>
                  <Text style={styles.actionLabel}>Delete Account</Text>
                </TouchableOpacity>
              </View>

              {newEmail !== '' && (
                <View style={styles.inlineForm}>
                  <TextInput
                    style={styles.inlineInput}
                    placeholder="Enter new email"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={newEmail}
                    onChangeText={setNewEmail}
                  />
                  <View style={styles.inlineActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setNewEmail('')}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveBtn} onPress={onChangeEmail}>
                      <Text style={styles.saveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {newPassword !== '' && (
                <View style={styles.inlineForm}>
                  <TextInput
                    style={styles.inlineInput}
                    secureTextEntry
                    placeholder="Enter new password"
                    placeholderTextColor="#9CA3AF"
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <View style={styles.inlineActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setNewPassword('')}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveBtn} onPress={onChangePassword}>
                      <Text style={styles.saveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  version: {
    fontSize: 12,
    color: '#8A8A8A',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#E8E8E8',
  },
  subsection: {
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInitial: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  resetLink: {
    fontSize: 14,
    color: '#6A6A6A',
    textDecorationLine: 'underline',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  actionItem: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  logoutIcon: {
    backgroundColor: '#F0F0F0',
  },
  deleteIcon: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FFDDDD',
  },
  actionIconText: {
    fontSize: 20,
    fontWeight: '600',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4A4A4A',
    textAlign: 'center',
  },
  inlineForm: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  inlineInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  inlineActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  cancelText: {
    fontSize: 14,
    color: '#6A6A6A',
    fontWeight: '500',
  },
  saveBtn: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    paddingTop: 180,
    zIndex: 1000,
  },
  pickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerBackdropTouch: {
    flex: 1,
  },
  pickerModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  pickerClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerCloseText: {
    fontSize: 16,
    color: '#6A6A6A',
    fontWeight: '500',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  pickerOptionSelected: {
    backgroundColor: '#FAFAFA',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#4A4A4A',
    fontWeight: '500',
  },
  pickerOptionTextSelected: {
    color: '#2A2A2A',
    fontWeight: '600',
  },
  pickerCheck: {
    fontSize: 16,
    color: '#2A2A2A',
    fontWeight: '600',
  },
  pickerOptionLast: {
    borderBottomWidth: 0,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  inputHalf: {
    flex: 0.48,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3A3A3A',
    marginBottom: 8,
  },
  modernInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '400',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '400',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emailContainer: {
    marginBottom: 16,
  },
  emailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5A5A5A',
    marginBottom: 8,
  },
  emailBox: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  emailText: {
    fontSize: 16,
    color: '#2A2A2A',
    fontWeight: '500',
  },
  linkButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  linkButtonText: {
    color: '#4A4A4A',
    fontSize: 15,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  primaryButton: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    backgroundColor: '#F8F8F8',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  secondaryButtonText: {
    color: '#2A2A2A',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 20,
  },
  goalItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#6A6A6A',
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A4A',
    flex: 1,
  },
  goalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
  },
  goalInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  goalUnit: {
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '500',
    color: '#7A7A7A',
    backgroundColor: '#F0F0F0',
    paddingVertical: 14,
  },
  logoutButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  logoutButtonText: {
    color: '#4A4A4A',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  deleteButton: {
    backgroundColor: '#FF4444',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
})