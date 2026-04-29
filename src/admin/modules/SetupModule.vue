<template>
  <div class="setup-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">⚙️ Site Setup</h1>
          <p class="page-subtitle">Manage your website configuration and settings</p>
        </div>
        <div class="header-right">
          <button 
            class="btn btn-secondary"
            @click="resetForm"
            :disabled="isLoading"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3a5 5 0 104.546 2.914.5.5 0 01.908-.417A6 6 0 118 2v1z"/>
              <path d="M8 4.466V.534a.25.25 0 01.41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 018 4.466z"/>
            </svg>
            Reset
          </button>
          <button 
            class="btn btn-primary"
            @click="saveSetup"
            :disabled="isLoading"
          >
            <svg v-if="!isLoading" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.736 3.97a.733.733 0 011.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 01-1.065.02L3.217 8.384a.757.757 0 010-1.06.733.733 0 011.047 0l3.052 3.093 5.4-6.425a.247.247 0 01.02-.022z"/>
            </svg>
            <span v-if="isLoading" class="spinner"></span>
            {{ isLoading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Success/Error Alert -->
    <transition name="fade">
      <div v-if="notification.show" class="alert" :class="`alert-${notification.type}`">
        <div class="alert-content">
          <svg v-if="notification.type === 'success'" width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M16 8A8 8 0 110 8a8 8 0 0116 0zm-3.97-3.03a.75.75 0 00-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 00-1.06 1.06L6.97 11.03a.75.75 0 001.079-.02l3.992-4.99a.75.75 0 00-.01-1.05z"/>
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M16 8A8 8 0 110 8a8 8 0 0116 0zM8 4a.905.905 0 00-.9.995l.35 3.507a.552.552 0 001.1 0l.35-3.507A.905.905 0 008 4zm.002 6a1 1 0 100 2 1 1 0 000-2z"/>
          </svg>
          <span>{{ notification.message }}</span>
        </div>
        <button class="alert-close" @click="notification.show = false">×</button>
      </div>
    </transition>

    <!-- Loading State -->
    <div v-if="isLoading && !settingsData" class="loading-container">
      <div class="spinner-large"></div>
      <p>Loading settings...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError && !settingsData" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>Failed to Load Settings</h3>
      <p>{{ errorMessage }}</p>
      <button class="retry-btn" @click="loadSetup">Retry</button>
    </div>

    <!-- Tabs Navigation -->
    <div v-else class="tabs-container">
      <div class="tabs-nav">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-button"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span v-html="tab.icon"></span>
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tabs-content">
        <!-- Brand Identity Tab -->
        <div v-show="activeTab === 'brand'" class="tab-pane">
          <div class="form-grid">
            <div class="form-group full-width">
              <label class="form-label">
                Brand Name <span class="required">*</span>
              </label>
              <input 
                v-model="formData.brand_name"
                type="text"
                class="form-input"
                placeholder="Enter your brand name"
                required
              />
            </div>

            <div class="form-group full-width">
              <label class="form-label">Tagline</label>
              <input 
                v-model="formData.tagline"
                type="text"
                class="form-input"
                placeholder="Your catchy tagline"
              />
            </div>

            <div class="form-group full-width">
              <label class="form-label">Short Description</label>
              <textarea 
                v-model="formData.short_description"
                class="form-textarea"
                rows="3"
                placeholder="Brief description about your business"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Primary Color</label>
              <div class="color-input-group">
                <input 
                  v-model="formData.primary_color"
                  type="color"
                  class="form-color"
                />
                <input 
                  v-model="formData.primary_color"
                  type="text"
                  class="form-input"
                  placeholder="#4f46e5"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Secondary Color</label>
              <div class="color-input-group">
                <input 
                  v-model="formData.secondary_color"
                  type="color"
                  class="form-color"
                />
                <input 
                  v-model="formData.secondary_color"
                  type="text"
                  class="form-input"
                  placeholder="#10b981"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Logo</label>
              <div class="file-upload-area">
                <div class="file-preview" v-if="logoPreview">
                  <img :src="logoPreview" alt="Logo Preview" />
                  <button class="remove-file" @click="removeLogo">×</button>
                </div>
                <label class="file-upload-label" v-else>
                  <input 
                    type="file"
                    accept="image/*"
                    @change="handleLogoChange"
                    class="file-input"
                  />
                  <div class="upload-placeholder">
                    <svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M6.002 5.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                      <path d="M2.002 1a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V3a2 2 0 00-2-2h-12zm12 1a1 1 0 011 1v6.5l-3.777-1.947a.5.5 0 00-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 00-.63.062L1.002 12V3a1 1 0 011-1h12z"/>
                    </svg>
                    <p>Click to upload logo</p>
                    <span>PNG, JPG up to 2MB</span>
                  </div>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Favicon</label>
              <div class="file-upload-area">
                <div class="file-preview" v-if="faviconPreview">
                  <img :src="faviconPreview" alt="Favicon Preview" />
                  <button class="remove-file" @click="removeFavicon">×</button>
                </div>
                <label class="file-upload-label" v-else>
                  <input 
                    type="file"
                    accept="image/*"
                    @change="handleFaviconChange"
                    class="file-input"
                  />
                  <div class="upload-placeholder">
                    <svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M6.002 5.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                      <path d="M2.002 1a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V3a2 2 0 00-2-2h-12zm12 1a1 1 0 011 1v6.5l-3.777-1.947a.5.5 0 00-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 00-.63.062L1.002 12V3a1 1 0 011-1h12z"/>
                    </svg>
                    <p>Click to upload favicon</p>
                    <span>ICO, PNG 16x16 or 32x32</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Contact Information Tab -->
        <div v-show="activeTab === 'contact'" class="tab-pane">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">
                Email <span class="required">*</span>
              </label>
              <input 
                v-model="formData.email"
                type="email"
                class="form-input"
                placeholder="contact@example.com"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">
                Phone <span class="required">*</span>
              </label>
              <input 
                v-model="formData.phone"
                type="tel"
                class="form-input"
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Alternate Phone</label>
              <input 
                v-model="formData.alternate_phone"
                type="tel"
                class="form-input"
                placeholder="+1 (555) 987-6543"
              />
            </div>

            <div class="form-group">
              <label class="form-label">WhatsApp</label>
              <input 
                v-model="formData.whatsapp"
                type="tel"
                class="form-input"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div class="form-group full-width">
              <label class="form-label">Address</label>
              <textarea 
                v-model="formData.address"
                class="form-textarea"
                rows="2"
                placeholder="Street address"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">City</label>
              <input 
                v-model="formData.city"
                type="text"
                class="form-input"
                placeholder="City"
              />
            </div>

            <div class="form-group">
              <label class="form-label">State/Province</label>
              <input 
                v-model="formData.state"
                type="text"
                class="form-input"
                placeholder="State"
              />
            </div>

            <div class="form-group">
              <label class="form-label">ZIP/Postal Code</label>
              <input 
                v-model="formData.zip_code"
                type="text"
                class="form-input"
                placeholder="12345"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Country</label>
              <input 
                v-model="formData.country"
                type="text"
                class="form-input"
                placeholder="Country"
              />
            </div>
          </div>
        </div>

        <!-- Social Media Tab -->
        <div v-show="activeTab === 'social'" class="tab-pane">
          <div class="form-grid">
            <div class="form-group full-width">
              <label class="form-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877f2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </label>
              <input 
                v-model="formData.facebook"
                type="url"
                class="form-input"
                placeholder="https://facebook.com/yourpage"
              />
            </div>

            <div class="form-group full-width">
              <label class="form-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1da1f2">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Twitter
              </label>
              <input 
                v-model="formData.twitter"
                type="url"
                class="form-input"
                placeholder="https://twitter.com/yourhandle"
              />
            </div>

            <div class="form-group full-width">
              <label class="form-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="url(#instagram-gradient)">
                  <defs>
                    <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" style="stop-color:#f58529" />
                      <stop offset="50%" style="stop-color:#dd2a7b" />
                      <stop offset="100%" style="stop-color:#8134af" />
                    </linearGradient>
                  </defs>
                  <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                </svg>
                Instagram
              </label>
              <input 
                v-model="formData.instagram"
                type="url"
                class="form-input"
                placeholder="https://instagram.com/yourprofile"
              />
            </div>

            <div class="form-group full-width">
              <label class="form-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#0a66c2">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </label>
              <input 
                v-model="formData.linkedin"
                type="url"
                class="form-input"
                placeholder="https://linkedin.com/company/yourcompany"
              />
            </div>

            <div class="form-group full-width">
              <label class="form-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff0000">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                YouTube
              </label>
              <input 
                v-model="formData.youtube"
                type="url"
                class="form-input"
                placeholder="https://youtube.com/@yourchannel"
              />
            </div>
          </div>
        </div>

        <!-- Business Hours Tab -->
        <div v-show="activeTab === 'business'" class="tab-pane">
          <div class="business-hours-section">
            <div class="section-header">
              <h3>Business Hours</h3>
              <p>Set your operating hours for each day of the week</p>
            </div>
            <div class="form-group full-width">
              <label class="form-label">Business Hours (JSON format or text)</label>
              <textarea 
                v-model="formData.business_hours"
                class="form-textarea"
                rows="8"
                placeholder='{"monday": "9:00 AM - 5:00 PM", "tuesday": "9:00 AM - 5:00 PM", ...}'
              ></textarea>
              <small class="form-hint">You can use JSON format or plain text</small>
            </div>
          </div>
        </div>

        <!-- SEO & Settings Tab -->
        <div v-show="activeTab === 'seo'" class="tab-pane">
          <div class="form-grid">
            <div class="form-group full-width">
              <label class="form-label">Meta Description</label>
              <textarea 
                v-model="formData.meta_description"
                class="form-textarea"
                rows="3"
                maxlength="160"
                placeholder="Brief description for search engines (max 160 characters)"
              ></textarea>
              <small class="form-hint">{{ formData.meta_description?.length || 0 }}/160 characters</small>
            </div>

            <div class="form-group full-width">
              <label class="form-label">Meta Keywords</label>
              <input 
                v-model="formData.meta_keywords"
                type="text"
                class="form-input"
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>

            <div class="form-group full-width">
              <label class="form-label">Copyright Text</label>
              <input 
                v-model="formData.copyright"
                type="text"
                class="form-input"
                placeholder="© 2024 Your Company. All rights reserved."
              />
            </div>

            <div class="form-group full-width">
              <div class="divider"></div>
              <h3 class="section-title">Additional Settings</h3>
            </div>

            <div class="form-group full-width">
              <div class="toggle-group">
                <label class="toggle-item">
                  <input 
                    v-model="formData.enable_notifications"
                    type="checkbox"
                    class="toggle-checkbox"
                  />
                  <span class="toggle-slider"></span>
                  <div class="toggle-label">
                    <strong>Enable Notifications</strong>
                    <small>Allow system to send notifications to users</small>
                  </div>
                </label>

                <label class="toggle-item">
                  <input 
                    v-model="formData.enable_newsletter"
                    type="checkbox"
                    class="toggle-checkbox"
                  />
                  <span class="toggle-slider"></span>
                  <div class="toggle-label">
                    <strong>Enable Newsletter</strong>
                    <small>Allow users to subscribe to newsletter</small>
                  </div>
                </label>

                <label class="toggle-item danger">
                  <input 
                    v-model="formData.maintenance_mode"
                    type="checkbox"
                    class="toggle-checkbox"
                  />
                  <span class="toggle-slider"></span>
                  <div class="toggle-label">
                    <strong>Maintenance Mode</strong>
                    <small>Put the website in maintenance mode</small>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notification Modal -->
    <NotificationModal
      v-model="notification.show"
      :type="notification.type"
      :title="notification.title"
      :message="notification.message"
      :details="notification.details"
      :list="notification.list"
      :confirm-label="notification.confirmLabel"
      :auto-close="notification.autoClose"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useCrudStore } from '@/store/crud';
import NotificationModal from './components/NotificationModal.vue';

// Store
const crudStore = useCrudStore();

const activeTab = ref('brand');
const logoPreview = ref(null);
const faviconPreview = ref(null);

// Notification state
const notification = ref({
  show: false,
  type: 'success',
  title: '',
  message: '',
  details: '',
  list: [],
  confirmLabel: 'OK',
  autoClose: 0
});

// Computed properties from store
const isLoading = computed(() => crudStore.isLoading);
const hasError = computed(() => crudStore.hasError);
const errorMessage = computed(() => crudStore.getError?.message || 'An error occurred');
const settingsData = computed(() => crudStore.getCurrentItem);

const tabs = [
  { 
    id: 'brand', 
    label: 'Brand Identity',
    icon: '<svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5 8 5.961 14.154 3.5 8.186 1.113zM15 4.239l-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464L7.443.184z"/></svg>'
  },
  { 
    id: 'contact', 
    label: 'Contact Info',
    icon: '<svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"/></svg>'
  },
  { 
    id: 'social', 
    label: 'Social Media',
    icon: '<svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/></svg>'
  },
  { 
    id: 'business', 
    label: 'Business Hours',
    icon: '<svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/></svg>'
  },
  // { 
  //   id: 'seo', 
  //   label: 'SEO & Settings',
  //   icon: '<svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/></svg>'
  // }
];

const formData = ref({
  brand_name: '',
  tagline: '',
  short_description: '',
  logo: null,
  favicon: null,
  primary_color: '#4f46e5',
  secondary_color: '#10b981',
  email: '',
  phone: '',
  alternate_phone: '',
  whatsapp: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  country: '',
  facebook: '',
  twitter: '',
  instagram: '',
  linkedin: '',
  youtube: '',
  business_hours: '',
  meta_description: '',
  meta_keywords: '',
  copyright: '',
  enable_notifications: true,
  enable_newsletter: true,
  maintenance_mode: false
});

// Helper function to show notifications
const showNotification = (type, message, options = {}) => {
  notification.value = {
    show: true,
    type,
    message,
    title: options.title || '',
    details: options.details || '',
    list: options.list || [],
    confirmLabel: options.confirmLabel || 'OK',
    autoClose: options.autoClose || 0
  };
};

const handleLogoChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    formData.value.logo = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      logoPreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const handleFaviconChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    formData.value.favicon = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      faviconPreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const removeLogo = () => {
  formData.value.logo = null;
  logoPreview.value = null;
};

const removeFavicon = () => {
  formData.value.favicon = null;
  faviconPreview.value = null;
};

const saveSetup = async () => {
  // Validate required fields
  if (!formData.value.brand_name || !formData.value.email || !formData.value.phone) {
    showNotification('error', 'Please fill in all required fields', {
      details: 'Brand Name, Email, and Phone are required fields.'
    });
    return;
  }

  try {
    // Create FormData for file uploads
    const submitData = new FormData();
    
    // Append all form fields with backend field names
    submitData.append('brand_name', formData.value.brand_name);
    submitData.append('email', formData.value.email);
    submitData.append('phone', formData.value.phone);
    submitData.append('address', formData.value.address || '');
    
    // Optional fields
    if (formData.value.tagline) submitData.append('tagline', formData.value.tagline);
    if (formData.value.short_description) submitData.append('short_description', formData.value.short_description);
    if (formData.value.primary_color) submitData.append('primary_color', formData.value.primary_color);
    if (formData.value.secondary_color) submitData.append('secondary_color', formData.value.secondary_color);
    if (formData.value.alternate_phone) submitData.append('alternate_phone', formData.value.alternate_phone);
    if (formData.value.whatsapp) submitData.append('whatsapp', formData.value.whatsapp);
    if (formData.value.city) submitData.append('city', formData.value.city);
    if (formData.value.state) submitData.append('state', formData.value.state);
    if (formData.value.zip_code) submitData.append('zip_code', formData.value.zip_code);
    if (formData.value.country) submitData.append('country', formData.value.country);
    if (formData.value.facebook) submitData.append('facebook', formData.value.facebook);
    if (formData.value.twitter) submitData.append('twitter', formData.value.twitter);
    if (formData.value.instagram) submitData.append('instagram', formData.value.instagram);
    if (formData.value.linkedin) submitData.append('linkedin', formData.value.linkedin);
    if (formData.value.youtube) submitData.append('youtube', formData.value.youtube);
    if (formData.value.business_hours) submitData.append('business_hours', formData.value.business_hours);
    if (formData.value.meta_description) submitData.append('meta_description', formData.value.meta_description);
    if (formData.value.meta_keywords) submitData.append('meta_keywords', formData.value.meta_keywords);
    if (formData.value.copyright) submitData.append('copyright', formData.value.copyright);
    
    // Boolean fields
    submitData.append('enable_notifications', formData.value.enable_notifications ? '1' : '0');
    submitData.append('enable_newsletter', formData.value.enable_newsletter ? '1' : '0');
    submitData.append('maintenance_mode', formData.value.maintenance_mode ? '1' : '0');
    
    // Handle file uploads
    if (formData.value.logo instanceof File) {
      submitData.append('logo', formData.value.logo);
    }
    if (formData.value.favicon instanceof File) {
      submitData.append('favicon', formData.value.favicon);
    }

    // Use the store's post method (which uses updateOrCreate endpoint)
    const result = await crudStore.post('/admin/settings/update', submitData);

    if (result.success) {
      showNotification('success', 'Settings saved successfully!', {
        details: 'Your website configuration has been updated.',
        autoClose: 3000
      });
      
      // Reload settings to get the latest data including file paths
      await loadSetup();
    } else {
      throw new Error(result.error?.message || 'Failed to save settings');
    }
  } catch (error) {
    console.error('Save error:', error);
    
    let errorMessage = error.message || 'An unexpected error occurred. Please try again.';
    let errorDetails = '';
    let errorList = [];
    
    // Check if it's a validation error from the store
    if (error.response?.data?.errors) {
      errorDetails = 'Please check the following fields:';
      errorList = Object.entries(error.response.data.errors).map(
        ([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
      );
    }
    
    // Show error notification
    if (errorList.length > 0) {
      showNotification('error', errorMessage, {
        details: errorDetails,
        list: errorList
      });
    } else {
      showNotification('error', errorMessage, {
        details: errorDetails || 'Please check your input and try again.'
      });
    }
  }
};

const resetForm = () => {
  if (confirm('Are you sure you want to reset all changes?')) {
    loadSetup();
  }
};

const loadSetup = async () => {
  // Clear any previous errors
  crudStore.clearError();
  
  const result = await crudStore.fetchById('/admin/settings', '');
  
  if (result.success && result.data) {
    const data = result.data;
    
    // Map backend fields to frontend field names
    formData.value = {
      brand_name: data.brand_name || '',
      tagline: data.tagline || '',
      short_description: data.short_description || '',
      logo: null,
      favicon: null,
      primary_color: data.primary_color || '#4f46e5',
      secondary_color: data.secondary_color || '#10b981',
      email: data.email || '',
      phone: data.phone || '',
      alternate_phone: data.alternate_phone || '',
      whatsapp: data.whatsapp || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      zip_code: data.zip_code || '',
      country: data.country || '',
      facebook: data.facebook || '',
      twitter: data.twitter || '',
      instagram: data.instagram || '',
      linkedin: data.linkedin || '',
      youtube: data.youtube || '',
      business_hours: data.business_hours || '',
      meta_description: data.meta_description || '',
      meta_keywords: data.meta_keywords || '',
      copyright: data.copyright || '',
      enable_notifications: data.enable_notifications ?? true,
      enable_newsletter: data.enable_newsletter ?? true,
      maintenance_mode: data.maintenance_mode ?? false
    };
    
    // Set image previews if they exist
    if (data.logo) {
      logoPreview.value = data.logo.startsWith('http') 
        ? data.logo 
        : `${process.env.VUE_APP_BASE_URL}/${data.logo}`;
    } else {
      logoPreview.value = null;
    }
    
    if (data.favicon) {
      faviconPreview.value = data.favicon.startsWith('http') 
        ? data.favicon 
        : `${process.env.VUE_APP_BASE_URL}/${data.favicon}`;
    } else {
      faviconPreview.value = null;
    }
  } else if (result.error?.status === 404) {
    // No settings found yet, use defaults
    console.log('No settings found, using defaults');
  } else if (!result.success) {
    showNotification('error', 'Failed to load settings', {
      details: result.error?.message || 'Please try again later.'
    });
  }
};

// Load settings on mount
onMounted(() => {
  loadSetup();
});

// Cleanup on unmount
import { onBeforeUnmount } from 'vue';
onBeforeUnmount(() => {
  crudStore.clearCurrentItem();
});
</script>

<style scoped>
.setup-page {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  min-height: 100vh;
  background: #f0f2f5;
  padding: 30px;
}

/* Page Header */
.page-header {
  margin-bottom: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.header-content {
  background: #1d283a;
  color: white;
  padding: 30px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: white;
  color: #667eea;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(102, 126, 234, 0.3);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Alert */
.alert {
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alert-success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.alert-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: currentColor;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.alert-close:hover {
  opacity: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.spinner-large {
  width: 60px;
  height: 60px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.loading-container p {
  font-size: 16px;
  color: #6c757d;
  margin: 0;
}

/* Error State */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.error-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.error-container h3 {
  font-size: 24px;
  color: #dc3545;
  margin: 0 0 10px 0;
}

.error-container p {
  font-size: 16px;
  color: #6c757d;
  margin: 0 0 20px 0;
}

.retry-btn {
  padding: 12px 32px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* Tabs */
.tabs-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tabs-nav {
  display: flex;
  border-bottom: 2px solid #f3f4f6;
  overflow-x: auto;
  background: #fafafa;
}

.tabs-nav::-webkit-scrollbar {
  height: 4px;
}

.tabs-nav::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.tab-button {
  padding: 16px 24px;
  border: none;
  background: none;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.tab-button:hover {
  background: #f9fafb;
  color: #374151;
}

.tab-button.active {
  color: #667eea;
  border-bottom-color: #667eea;
  background: white;
}

.tabs-content {
  padding: 32px;
}

.tab-pane {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Form Grid */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.required {
  color: #ef4444;
}

.form-input,
.form-textarea,
.form-select {
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 6px;
}

/* Color Input */
.color-input-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.form-color {
  width: 60px;
  height: 44px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  padding: 4px;
}

.color-input-group .form-input {
  flex: 1;
}

/* File Upload */
.file-upload-area {
  position: relative;
}

.file-preview {
  position: relative;
  width: 200px;
  height: 200px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: #f9fafb;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.remove-file {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.remove-file:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.file-upload-label {
  display: block;
  cursor: pointer;
}

.file-input {
  position: absolute;
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  overflow: hidden;
  z-index: -1;
}

.upload-placeholder {
  width: 200px;
  height: 200px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #6b7280;
  transition: all 0.3s ease;
}

.upload-placeholder:hover {
  border-color: #667eea;
  color: #667eea;
  background: #f9fafb;
}

.upload-placeholder p {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

.upload-placeholder span {
  font-size: 12px;
  color: #9ca3af;
}

/* Toggle Switches */
.toggle-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toggle-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.toggle-item:hover {
  background: #f3f4f6;
}

.toggle-item.danger {
  background: #fef2f2;
}

.toggle-item.danger:hover {
  background: #fee2e2;
}

.toggle-checkbox {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: relative;
  width: 48px;
  height: 24px;
  background: #d1d5db;
  border-radius: 12px;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  left: 2px;
  top: 2px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.toggle-checkbox:checked + .toggle-slider {
  background: #667eea;
}

.toggle-item.danger .toggle-checkbox:checked + .toggle-slider {
  background: #ef4444;
}

.toggle-checkbox:checked + .toggle-slider::before {
  transform: translateX(24px);
}

.toggle-label {
  flex: 1;
}

.toggle-label strong {
  display: block;
  font-size: 14px;
  color: #1f2937;
  margin-bottom: 4px;
}

.toggle-label small {
  display: block;
  font-size: 12px;
  color: #6b7280;
}

/* Sections */
.section-header {
  margin-bottom: 24px;
}

.section-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.section-header p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.divider {
  height: 1px;
  background: #e5e7eb;
  margin: 8px 0 24px 0;
}

/* Responsive */
@media (max-width: 768px) {
  .setup-page {
    padding: 15px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    padding: 20px;
  }

  .header-right {
    width: 100%;
  }

  .header-right .btn {
    flex: 1;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .tabs-nav {
    flex-wrap: nowrap;
  }

  .tabs-content {
    padding: 20px;
  }

  .color-input-group {
    flex-direction: column;
    align-items: stretch;
  }

  .form-color {
    width: 100%;
  }
}
</style>