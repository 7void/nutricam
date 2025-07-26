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
import { useState } from 'react'
import {
  Alert,
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
    if (!newEmail) {
      return Alert.alert('Error', 'Please enter a new email address.')
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >

          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.header}>Profile</Text>
            <Text style={styles.version}>v{Constants.manifest?.version || '1.0.0'}</Text>
          </View>

          {/* Account Details Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Account Details</Text>
            </View>
            <View style={styles.emailContainer}>
              <Text style={styles.emailLabel}>Email Address</Text>
              <View style={styles.emailBox}>
                <Text style={styles.emailText}>{email}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.linkButton} onPress={onPasswordReset}>
              <Text style={styles.linkButtonText}>Send Password Reset Email</Text>
            </TouchableOpacity>
          </View>

          {/* Change Email Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Update Email</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Email Address</Text>
              <TextInput
                style={styles.modernInput}
                placeholder="Enter your new email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={newEmail}
                onChangeText={setNewEmail}
              />
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={onChangeEmail}>
              <Text style={styles.primaryButtonText}>Update Email</Text>
            </TouchableOpacity>
          </View>

          {/* Change Password Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Update Password</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.modernInput}
                secureTextEntry
                placeholder="Enter your new password"
                placeholderTextColor="#9CA3AF"
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={onChangePassword}>
              <Text style={styles.primaryButtonText}>Update Password</Text>
            </TouchableOpacity>
          </View>

          {/* Nutrition Goals Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Nutrition Goals</Text>
            </View>
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

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={onDeleteAccount}>
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#E8E8E8',
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2A2A',
    letterSpacing: -0.2,
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
  inputGroup: {
    marginBottom: 20,
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
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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
  actionSection: {
    marginTop: 20,
    gap: 12,
  },
  logoutButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
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