import { useFeatureFlagsStore } from '~/stores/featureFlags';

export default defineNuxtPlugin({
  name: 'feature-flags',
  async setup() {
    const featureFlagsStore = useFeatureFlagsStore();
    
    try {
      console.log('[CLIENT] Initializing Feature Flags');
      await featureFlagsStore.loadFeatureFlags();
      console.log('[CLIENT] Feature Flags initialized');
    } catch (error) {
      console.error('[CLIENT] Failed to initialize Feature Flags:', error);
    }
  }
}); 