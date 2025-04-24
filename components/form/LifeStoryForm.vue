<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Timestamp } from 'firebase/firestore';
import JournalEditor from '~/components/editor/JournalEditor.vue';
import SaveButton from '~/components/buttons/SaveButton.vue';
import CancelButton from '~/components/buttons/CancelButton.vue';
import EntryButton from '~/components/buttons/EntryButton.vue';
import type { 
  LifeStoryEntry, 
  LifeStoryGranularity, 
  LifeStoryLocation, 
  CustomField 
} from '~/types/lifeStory';

interface Props {
  initialData?: Partial<LifeStoryEntry>;
  isSubmitting?: boolean;
  isAutosaving?: boolean;
  lastAutosaveTime?: Date | null;
}

const props = withDefaults(defineProps<Props>(), {
  initialData: () => ({}),
  isSubmitting: false,
  isAutosaving: false,
  lastAutosaveTime: null
});

const emit = defineEmits<{
  (e: 'submit' | 'update', data: Omit<LifeStoryEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): void;
  (e: 'cancel'): void;
}>();

// Form state
const title = ref(props.initialData?.Title || '');
const content = ref<string>(props.initialData?.Content || '');
const granularity = ref<LifeStoryGranularity>(props.initialData?.eventGranularity || 'day');

// Date-related fields
const eventDate = ref<string>(formatDateForInput(props.initialData?.eventTimestamp));
const eventMonth = ref<string>(formatMonthForInput(props.initialData?.eventTimestamp));
const eventYear = ref<string>(formatYearForInput(props.initialData?.eventTimestamp));
const eventEndDate = ref<string>(formatDateForInput(props.initialData?.eventEndDate));
const eventLabel = ref<string>(props.initialData?.eventLabel || '');

// For range granularity, we need both start and end dates
const showDatePicker = computed(() => granularity.value === 'day');
const showMonthPicker = computed(() => granularity.value === 'month');
const showYearPicker = computed(() => granularity.value === 'year');
const showEraLabel = computed(() => granularity.value === 'era');

// Location fields
const country = ref<string | null>(props.initialData?.location?.country || null);
const city = ref<string | null>(props.initialData?.location?.city || null);
const locationDetails = ref<string | null>(props.initialData?.location?.Details || null);

// Custom fields
const customFields = ref<CustomField[]>(props.initialData?.customFields || []);
const newFieldName = ref('');
const newFieldValue = ref('');

// Years array for select options
const years = computed(() => {
  const currentYear = new Date().getFullYear();
  const yearsList = [];
  for (let i = currentYear; i >= currentYear - 100; i--) {
    yearsList.push(i);
  }
  return yearsList;
});

// Form validation
const isTitleValid = computed(() => title.value.trim().length > 0);
const isContentValid = computed(() => content.value.trim().length > 0);
const isDateValid = computed(() => {
  if (granularity.value === 'day') return eventDate.value;
  if (granularity.value === 'month') return eventMonth.value;
  if (granularity.value === 'year') return eventYear.value;
  if (granularity.value === 'range') return eventDate.value && (eventEndDate.value || true);
  if (granularity.value === 'era') return eventLabel.value;
  return true;
});

const isFormValid = computed(() => isTitleValid.value && isContentValid.value && isDateValid.value);

// Helper functions for date formatting
function formatDateForInput(timestamp: Timestamp | Date | undefined | null): string {
  if (!timestamp) return '';
  
  const date = timestamp instanceof Timestamp 
    ? timestamp.toDate() 
    : new Date(timestamp);
  
  return date.toISOString().split('T')[0];
}

function formatMonthForInput(timestamp: Timestamp | Date | undefined | null): string {
  if (!timestamp) return '';
  
  const date = timestamp instanceof Timestamp 
    ? timestamp.toDate() 
    : new Date(timestamp);
  
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatYearForInput(timestamp: Timestamp | Date | undefined | null): string {
  if (!timestamp) return '';
  
  const date = timestamp instanceof Timestamp 
    ? timestamp.toDate() 
    : new Date(timestamp);
  
  return date.getFullYear().toString();
}

// Function to add a custom field
function addCustomField() {
  if (newFieldName.value.trim() && newFieldValue.value.trim()) {
    customFields.value.push({
      fieldName: newFieldName.value.trim(),
      Value: newFieldValue.value.trim()
    });
    newFieldName.value = '';
    newFieldValue.value = '';
    
    // Emit update for autosave
    emitUpdate();
  }
}

// Function to remove a custom field
function removeCustomField(index: number) {
  customFields.value.splice(index, 1);
  
  // Emit update for autosave
  emitUpdate();
}

// Update editor content
function handleEditorUpdate(html: string) {
  content.value = html;
  
  // Emit update for autosave
  emitUpdate();
}

// Format time of last autosave
const formattedAutosaveTime = computed(() => {
  if (!props.lastAutosaveTime) return '';
  return props.lastAutosaveTime.toLocaleTimeString();
});

// Autosave status message
const autosaveStatus = computed(() => {
  if (props.isAutosaving) {
    return 'Saving...';
  }
  if (props.lastAutosaveTime) {
    return `Last saved at ${formattedAutosaveTime.value}`;
  }
  return '';
});

// Watch for changes in form fields and emit updates for autosave
watch([title, granularity, eventDate, eventMonth, eventYear, eventEndDate, eventLabel, country, city, locationDetails], () => {
  emitUpdate();
}, { deep: true });

// Function to emit current form data for autosave
function emitUpdate() {
  let eventTimestamp: Date;
  
  switch (granularity.value) {
    case 'day':
      eventTimestamp = eventDate.value ? new Date(eventDate.value) : new Date();
      break;
    case 'month':
      eventTimestamp = eventMonth.value ? new Date(`${eventMonth.value}-01`) : new Date();
      break;
    case 'year':
      eventTimestamp = eventYear.value ? new Date(Number(eventYear.value), 0, 1) : new Date();
      break;
    case 'range':
      eventTimestamp = eventDate.value ? new Date(eventDate.value) : new Date();
      break;
    case 'era':
      eventTimestamp = new Date(); // Current date as placeholder
      break;
    default:
      eventTimestamp = new Date();
  }

  // Prepare location data
  const location: LifeStoryLocation | null = (country.value || city.value || locationDetails.value) 
    ? {
        country: country.value,
        city: city.value,
        Details: locationDetails.value
      }
    : null;

  // Build the form data
  const formData = {
    Title: title.value,
    Content: content.value,
    eventTimestamp: Timestamp.fromDate(eventTimestamp),
    eventGranularity: granularity.value,
    eventEndDate: eventEndDate.value 
      ? Timestamp.fromDate(new Date(eventEndDate.value)) 
      : null,
    eventLabel: eventLabel.value || null,
    location,
    customFields: customFields.value.length > 0 ? customFields.value : null
  };

  emit('update', formData);
}

// Handle form submission
function handleSubmit() {
  if (!isFormValid.value) return;
  
  let eventTimestamp: Date;
  
  switch (granularity.value) {
    case 'day':
      eventTimestamp = new Date(eventDate.value);
      break;
    case 'month':
      eventTimestamp = new Date(`${eventMonth.value}-01`);
      break;
    case 'year':
      eventTimestamp = new Date(Number(eventYear.value), 0, 1);
      break;
    case 'range':
      eventTimestamp = new Date(eventDate.value);
      break;
    case 'era':
      eventTimestamp = new Date(); // Current date as placeholder
      break;
    default:
      eventTimestamp = new Date();
  }

  // Prepare location data
  const location: LifeStoryLocation | null = (country.value || city.value || locationDetails.value) 
    ? {
        country: country.value,
        city: city.value,
        Details: locationDetails.value
      }
    : null;

  // Build the form data
  const formData = {
    Title: title.value,
    Content: content.value,
    eventTimestamp: Timestamp.fromDate(eventTimestamp),
    eventGranularity: granularity.value,
    eventEndDate: eventEndDate.value 
      ? Timestamp.fromDate(new Date(eventEndDate.value)) 
      : null,
    eventLabel: eventLabel.value || null,
    location,
    customFields: customFields.value.length > 0 ? customFields.value : null
  };

  emit('submit', formData);
}

// Handle cancel
function handleCancel() {
  emit('cancel');
}
</script>

<template>
  <form class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700" @submit.prevent="handleSubmit">

    <!-- Title input -->
    <div class="mb-6">
      <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Title <span class="text-red-500">*</span>
      </label>
      <input
        id="title"
        v-model="title"
        type="text"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        placeholder="Enter a title for your story"
        :class="{ 'border-red-500': !isTitleValid && title.length > 0 }"
      >
    </div>

    <!-- Content editor -->
    <div class="mb-6 relative">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Content <span class="text-red-500">*</span>
      </label>
      <JournalEditor 
        :initial-content="content" 
        @update="handleEditorUpdate" 
      />
      
      <!-- Autosave status -->
      <div 
        v-if="autosaveStatus" 
        class="absolute bottom-0 right-0 translate-y-full pt-2 text-sm text-gray-500 dark:text-gray-400"
      >
        {{ autosaveStatus }}
      </div>
    </div>

    <!-- Time period selection -->
    <div class="space-y-4">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Time Period <span class="text-red-500">*</span>
      </label>
      
      <!-- Granularity selection -->
      <div class="flex flex-wrap gap-2">
        <label 
          v-for="option in ['day', 'month', 'year', 'range', 'era']" 
          :key="option"
          :class="[
            'px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer',
            granularity === option 
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          ]"
        >
          <input 
            v-model="granularity" 
            type="radio" 
            :value="option" 
            class="sr-only"
          >
          {{ option.charAt(0).toUpperCase() + option.slice(1) }}
        </label>
      </div>
      
      <!-- Date inputs based on granularity -->
      <div class="mt-2">
        <!-- Day granularity -->
        <div v-if="showDatePicker" class="mt-2">
          <label for="eventDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Date
          </label>
          <input
            id="eventDate"
            v-model="eventDate"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
        </div>
        
        <!-- Month granularity -->
        <div v-if="showMonthPicker" class="mt-2">
          <label for="eventMonth" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Month
          </label>
          <input
            id="eventMonth"
            v-model="eventMonth"
            type="month"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
        </div>
        
        <!-- Year granularity -->
        <div v-if="showYearPicker" class="mt-2">
          <label for="eventYear" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Year
          </label>
          <select
            id="eventYear"
            v-model="eventYear"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="" disabled>Select a year</option>
            <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
          </select>
        </div>
        
        <!-- Range granularity -->
        <div v-if="granularity === 'range'" class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="startDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Start Date
            </label>
            <input
              id="startDate"
              v-model="eventDate"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
          </div>
          
          <div>
            <label for="endDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              End Date
            </label>
            <input
              id="endDate"
              v-model="eventEndDate"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
          </div>
        </div>
        
        <!-- Era granularity -->
        <div v-if="showEraLabel" class="mt-2">
          <label for="eraLabel" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Era Label
          </label>
          <input
            id="eraLabel"
            v-model="eventLabel"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="e.g., Childhood, College Years, First Job"
          >
        </div>
      </div>
    </div>

    <!-- Location details -->
    <div class="space-y-4 mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">Location (Optional)</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="country" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Country
          </label>
          <input
            id="country"
            v-model="country"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Country name"
          >
        </div>
        
        <div>
          <label for="city" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            City
          </label>
          <input
            id="city"
            v-model="city"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="City name"
          >
        </div>
      </div>
      
      <div>
        <label for="locationDetails" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Location Details
        </label>
        <textarea
          id="locationDetails"
          v-model="locationDetails"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Additional location details"
        />
      </div>
    </div>

    <!-- Custom fields -->
    <div class="space-y-4 mt-4 border-t border-gray-200 dark:border-gray-700 pt-4 pb-4">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">Custom Fields (Optional)</h3>
      
      <!-- Existing custom fields -->
      <div v-if="customFields.length > 0" class="">
        <div 
          v-for="(field, index) in customFields" 
          :key="index"
          class="flex items-start space-x-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-md"
        >
          <div class="flex-grow">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ field.fieldName }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ field.Value }}</p>
          </div>
          <button 
            type="button" 
            class="text-red-500 hover:text-red-700"
            @click="removeCustomField(index)"
          >
            <i class="ri-delete-bin-line" />
          </button>
        </div>
      </div>
      
      <!-- Add new custom field -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="fieldName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Field Name
          </label>
          <input
            id="fieldName"
            v-model="newFieldName"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="e.g., Mood, Weather, People"
          >
        </div>
        
        <div>
          <label for="fieldValue" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Field Value
          </label>
          <input
            id="fieldValue"
            v-model="newFieldValue"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="e.g., Good, Rainy, Family"
          >
        </div>
      </div>
      
      <EntryButton 
        type="button" 
        class="inline-flex items-center px-3 py-2 border border-transparent leading-4 rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        :disabled="!newFieldName.trim() || !newFieldValue.trim()"
        @click="addCustomField"
      >
        <i class="ri-add-line mr-1" />
        Add Field
      </EntryButton>
    </div>

    <!-- Form actions -->
    <div class="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
      <CancelButton 
        type="button" 
        @click="handleCancel" 
      >
        Cancel
      </CancelButton>

      <SaveButton 
        type="submit" 
        :disabled="!isFormValid || isSubmitting" 
        :is-loading="isSubmitting"
      >
        Save Story
      </SaveButton>
    </div>
  </form>
</template> 