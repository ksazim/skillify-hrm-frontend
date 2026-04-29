<template>
  <div class="settings-page">
    <div class="settings-container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">Settings</h1>
          <p class="page-description">Manage your account settings and preferences</p>
        </div>
      </div>

      <!-- Settings Tabs -->
      <div class="settings-tabs">
        <button 
          class="tab-button"
          :class="{ active: activeTab === 'profile' }"
          @click="activeTab = 'profile'"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
          </svg>
          <span>Profile Information</span>
        </button>
        <button 
          class="tab-button"
          :class="{ active: activeTab === 'password' }"
          @click="activeTab = 'password'"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
          </svg>
          <span>Change Password</span>
        </button>
      </div>

      <!-- Profile Information Tab -->
      <div v-show="activeTab === 'profile'" class="settings-content">
        <div class="settings-card">
          <div class="card-header">
            <div class="card-header-content">
              <h2 class="card-title">Profile Information</h2>
              <p class="card-description">Update your account profile information</p>
            </div>
          </div>

          <div class="card-body">
            <!-- Success Message -->
            <div v-if="profileSuccess" class="alert alert-success">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              <span>{{ profileSuccess }}</span>
            </div>

            <!-- Error Message -->
            <div v-if="profileError" class="alert alert-error">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
              <span>{{ profileError }}</span>
            </div>

            <form @submit.prevent="updateProfile" class="settings-form">
              <!-- Avatar Section -->
              <div class="avatar-section">
                <div class="avatar-display">
                  <div class="avatar-placeholder">
                    {{ getUserInitials() }}
                  </div>
                </div>
                <div class="avatar-info">
                  <h4>Profile Picture</h4>
                  <p>This is your avatar. You can customize it later.</p>
                </div>
              </div>

              <div class="form-divider"></div>

              <!-- Name Field -->
              <div class="form-group">
                <label for="name" class="form-label">
                  Full Name <span class="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  v-model="profileForm.name"
                  class="form-input"
                  placeholder="Enter your full name"
                  required
                  :disabled="profileLoading"
                />
              </div>

              <!-- Email Field -->
              <div class="form-group">
                <label for="email" class="form-label">
                  Email Address <span class="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  v-model="profileForm.email"
                  class="form-input"
                  placeholder="Enter your email address"
                  required
                  :disabled="profileLoading"
                />
              </div>

              <!-- Phone Field -->
              <div class="form-group">
                <label for="phone" class="form-label">
                  Phone Number <span class="required">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  v-model="profileForm.phone"
                  class="form-input"
                  placeholder="Enter your phone number"
                  required
                  :disabled="profileLoading"
                />
              </div>

              <!-- Action Buttons -->
              <div class="form-actions">
                <button
                  type="button"
                  class="btn btn-secondary"
                  @click="resetProfileForm"
                  :disabled="profileLoading"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="profileLoading"
                >
                  <span v-if="!profileLoading">Save Changes</span>
                  <span v-else class="loading-text">
                    <svg class="spinner" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none"/>
                    </svg>
                    Saving...
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Change Password Tab -->
      <div v-show="activeTab === 'password'" class="settings-content">
        <div class="settings-card">
          <div class="card-header">
            <div class="card-header-content">
              <h2 class="card-title">Change Password</h2>
              <p class="card-description">Update your password to keep your account secure</p>
            </div>
          </div>

          <div class="card-body">
            <!-- Success Message -->
            <div v-if="passwordSuccess" class="alert alert-success">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              <span>{{ passwordSuccess }}</span>
            </div>

            <!-- Error Message -->
            <div v-if="passwordError" class="alert alert-error">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
              <span>{{ passwordError }}</span>
            </div>

            <form @submit.prevent="changePassword" class="settings-form">
              <!-- Password Requirements Info -->
              <div class="info-box">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
                <div>
                  <strong>Password Requirements:</strong>
                  <ul>
                    <li>Minimum 8 characters long</li>
                    <li>New password must match confirmation</li>
                  </ul>
                </div>
              </div>

              <!-- Current Password -->
              <div class="form-group">
                <label for="old_password" class="form-label">
                  Current Password <span class="required">*</span>
                </label>
                <div class="password-input-wrapper">
                  <input
                    :type="showOldPassword ? 'text' : 'password'"
                    id="old_password"
                    v-model="passwordForm.old_password"
                    class="form-input"
                    placeholder="Enter your current password"
                    required
                    :disabled="passwordLoading"
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    @click="showOldPassword = !showOldPassword"
                    :disabled="passwordLoading"
                  >
                    <svg v-if="!showOldPassword" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                      <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                    </svg>
                    <svg v-else width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/>
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- New Password -->
              <div class="form-group">
                <label for="new_password" class="form-label">
                  New Password <span class="required">*</span>
                </label>
                <div class="password-input-wrapper">
                  <input
                    :type="showNewPassword ? 'text' : 'password'"
                    id="new_password"
                    v-model="passwordForm.new_password"
                    class="form-input"
                    placeholder="Enter your new password"
                    required
                    minlength="8"
                    :disabled="passwordLoading"
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    @click="showNewPassword = !showNewPassword"
                    :disabled="passwordLoading"
                  >
                    <svg v-if="!showNewPassword" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                      <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                    </svg>
                    <svg v-else width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/>
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Confirm New Password -->
              <div class="form-group">
                <label for="password_confirmation" class="form-label">
                  Confirm New Password <span class="required">*</span>
                </label>
                <div class="password-input-wrapper">
                  <input
                    :type="showConfirmPassword ? 'text' : 'password'"
                    id="password_confirmation"
                    v-model="passwordForm.password_confirmation"
                    class="form-input"
                    placeholder="Confirm your new password"
                    required
                    minlength="8"
                    :disabled="passwordLoading"
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    @click="showConfirmPassword = !showConfirmPassword"
                    :disabled="passwordLoading"
                  >
                    <svg v-if="!showConfirmPassword" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                      <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                    </svg>
                    <svg v-else width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/>
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                    </svg>
                  </button>
                </div>
                <p v-if="passwordForm.new_password && passwordForm.password_confirmation && passwordForm.new_password !== passwordForm.password_confirmation" class="error-hint">
                  Passwords do not match
                </p>
              </div>

              <!-- Action Buttons -->
              <div class="form-actions">
                <button
                  type="button"
                  class="btn btn-secondary"
                  @click="resetPasswordForm"
                  :disabled="passwordLoading"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="passwordLoading"
                >
                  <span v-if="!passwordLoading">Update Password</span>
                  <span v-else class="loading-text">
                    <svg class="spinner" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none"/>
                    </svg>
                    Updating...
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import axios from 'axios'

const authStore = useAuthStore()

// Active Tab
const activeTab = ref('profile')

// User Data
const userData = ref(null)

// Profile Form
const profileForm = ref({
  name: '',
  email: '',
  phone: ''
})
const profileLoading = ref(false)
const profileSuccess = ref('')
const profileError = ref('')

// Password Form
const passwordForm = ref({
  old_password: '',
  new_password: '',
  password_confirmation: ''
})
const passwordLoading = ref(false)
const passwordSuccess = ref('')
const passwordError = ref('')
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Fetch User Data
const fetchUserData = async () => {
  try {
    axios.defaults.headers.common['Authorization'] = `Bearer ${authStore.token}`
    
    const response = await axios.get(process.env.VUE_APP_BASE_API+'/admin/user')
    
    if (response.data && response.data.user) {
      userData.value = response.data.user
      
      // Populate profile form
      profileForm.value = {
        name: userData.value.name || '',
        email: userData.value.email || '',
        phone: userData.value.phone || ''
      }
    }
  } catch (error) {
    console.error('Error fetching user data:', error)
  }
}

// Get User Initials
const getUserInitials = () => {
  if (!userData.value || !userData.value.name) return 'U'
  
  const names = userData.value.name.split(' ')
  if (names.length >= 2) {
    return (names[0][0] + names[1][0]).toUpperCase()
  }
  return userData.value.name.substring(0, 2).toUpperCase()
}

// Update Profile
const updateProfile = async () => {
  profileLoading.value = true
  profileSuccess.value = ''
  profileError.value = ''

  try {
    axios.defaults.headers.common['Authorization'] = `Bearer ${authStore.token}`
    
    const response = await axios.post(process.env.VUE_APP_BASE_API+'/admin/user/update', {
      name: profileForm.value.name,
      email: profileForm.value.email,
      phone: profileForm.value.phone
    })

    if (response.data && response.data.status === 200) {
      profileSuccess.value = response.data.message || 'Profile updated successfully!'
      
      // Update local user data
      userData.value = {
        ...userData.value,
        name: profileForm.value.name,
        email: profileForm.value.email,
        phone: profileForm.value.phone
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        profileSuccess.value = ''
      }, 5000)
    } else {
      profileError.value = response.data.message || 'Failed to update profile'
    }
  } catch (error) {
    console.error('Error updating profile:', error)
    
    if (error.response && error.response.data) {
      profileError.value = error.response.data.message || 'Failed to update profile. Please try again.'
    } else {
      profileError.value = 'An error occurred. Please try again.'
    }
  } finally {
    profileLoading.value = false
  }
}

// Reset Profile Form
const resetProfileForm = () => {
  if (userData.value) {
    profileForm.value = {
      name: userData.value.name || '',
      email: userData.value.email || '',
      phone: userData.value.phone || ''
    }
  }
  profileSuccess.value = ''
  profileError.value = ''
}

// Change Password
const changePassword = async () => {
  passwordLoading.value = true
  passwordSuccess.value = ''
  passwordError.value = ''

  try {
    axios.defaults.headers.common['Authorization'] = `Bearer ${authStore.token}`
    
    const response = await axios.post(process.env.VUE_APP_BASE_API+'/admin/user/change-password', {
      old_password: passwordForm.value.old_password,
      new_password: passwordForm.value.new_password,
      password_confirmation: passwordForm.value.password_confirmation
    })

    console.log('Password change response:', response.data)

    if (response.data && response.data.status === 200) {
      passwordSuccess.value = response.data.message || 'Password updated successfully!'
      resetPasswordForm()
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        passwordSuccess.value = ''
      }, 5000)
    } else if (response.data && response.data.status === 401) {
      passwordError.value = response.data.message || 'Current password is incorrect'
    } else if (response.data && response.data.status === 400) {
      // Validation errors
      const errors = response.data.errors
      if (errors) {
        const errorMessages = Object.values(errors).flat()
        passwordError.value = errorMessages.join(', ')
      } else {
        passwordError.value = 'Validation failed. Please check your inputs.'
      }
    } else {
      passwordError.value = response.data.message || 'Failed to update password'
    }
  } catch (error) {
    console.error('Error changing password:', error)
    
    if (error.response && error.response.data) {
      if (error.response.data.status === 401) {
        passwordError.value = error.response.data.message || 'Current password is incorrect'
      } else if (error.response.data.status === 400) {
        const errors = error.response.data.errors
        if (errors) {
          const errorMessages = Object.values(errors).flat()
          passwordError.value = errorMessages.join(', ')
        } else {
          passwordError.value = 'Validation failed. Please check your inputs.'
        }
      } else {
        passwordError.value = error.response.data.message || 'Failed to update password. Please try again.'
      }
    } else {
      passwordError.value = 'An error occurred. Please try again.'
    }
  } finally {
    passwordLoading.value = false
  }
}

// Reset Password Form
const resetPasswordForm = () => {
  passwordForm.value = {
    old_password: '',
    new_password: '',
    password_confirmation: ''
  }
  showOldPassword.value = false
  showNewPassword.value = false
  showConfirmPassword.value = false
  passwordSuccess.value = ''
  passwordError.value = ''
}

onMounted(() => {
  fetchUserData()
})
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 32px 24px;
}

.settings-container {
  max-width: 900px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  margin-bottom: 32px;
}

.header-content {
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 32px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 16px;
  color: #64748b;
  margin: 0;
}

/* Settings Tabs */
.settings-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: all 0.3s ease;
}

.tab-button:hover {
  color: #1e293b;
  background: #f8fafc;
  border-radius: 8px 8px 0 0;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-button svg {
  width: 20px;
  height: 20px;
}

/* Settings Content */
.settings-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.settings-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 28px 32px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.card-title {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px 0;
}

.card-description {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.card-body {
  padding: 32px;
}

/* Alerts */
.alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  margin-bottom: 24px;
  font-size: 14px;
  line-height: 1.5;
}

.alert svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 1px;
}

.alert-success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #10b981;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #ef4444;
}

/* Avatar Section */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 24px;
}

.avatar-display {
  flex-shrink: 0;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  font-size: 32px;
  font-weight: 700;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.avatar-info h4 {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 6px 0;
}

.avatar-info p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

/* Forms */
.settings-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 8px 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.required {
  color: #ef4444;
}

.form-input {
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  color: #1e293b;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Password Input */
.password-input-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;
}

.password-toggle:hover {
  color: #64748b;
}

.password-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.error-hint {
  font-size: 13px;
  color: #ef4444;
  margin: 4px 0 0 0;
}

/* Info Box */
.info-box {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #eff6ff;
  border: 1px solid #3b82f6;
  border-radius: 10px;
  font-size: 14px;
  color: #1e40af;
}

.info-box svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.info-box strong {
  display: block;
  margin-bottom: 8px;
}

.info-box ul {
  margin: 0;
  padding-left: 20px;
}

.info-box li {
  margin-bottom: 4px;
}

.info-box li:last-child {
  margin-bottom: 0;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
}

.btn {
  padding: 12px 28px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
}

.btn-secondary {
  background: white;
  color: #64748b;
  border: 2px solid #e2e8f0;
}

.btn-secondary:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.loading-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  width: 18px;
  height: 18px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .settings-page {
    padding: 20px 16px;
  }

  .header-content {
    padding: 24px;
  }

  .page-title {
    font-size: 24px;
  }

  .card-body {
    padding: 24px;
  }

  .settings-tabs {
    flex-direction: column;
    border-bottom: none;
  }

  .tab-button {
    border-bottom: none;
    border-left: 3px solid transparent;
    padding: 12px 16px;
    border-radius: 8px;
  }

  .tab-button.active {
    border-left-color: #3b82f6;
    background: #eff6ff;
  }

  .avatar-section {
    flex-direction: column;
    text-align: center;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>