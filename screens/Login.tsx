// src/screens/Login.tsx
import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { auth } from '../app/utils/firebase';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // On success, navigate into the tab layout
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.flex}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          {/* Login Form Card */}
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                style={styles.input}
              />
            </View>

            <TouchableOpacity 
              onPress={handleLogin} 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sign up link */}
          <View style={styles.linkSection}>
            <Text style={styles.linkText}>Don't have an account?</Text>
            <Link href="/signup" asChild>
              <TouchableOpacity style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6A6A6A',
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: '#E8E8E8',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3A3A3A',
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '400',
  },
  loginButton: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loginButtonDisabled: {
    backgroundColor: '#8A8A8A',
    shadowOpacity: 0.05,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  linkSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  linkText: {
    fontSize: 15,
    color: '#6A6A6A',
    fontWeight: '400',
  },
  linkButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  linkButtonText: {
    fontSize: 15,
    color: '#2A2A2A',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});