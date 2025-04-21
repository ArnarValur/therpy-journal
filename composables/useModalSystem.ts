// composables/useModalSystem.ts
import { ref, readonly } from 'vue';

// State should be outside the composable function to be truly global singleton
const isOpen = ref(false);
const title = ref('');
const message = ref('');
let resolvePromise: ((confirmed: boolean) => void) | null = null;

export function useModalSystem() {

  const prompt = (promptTitle: string, promptMessage: string): Promise<boolean> => {
    title.value = promptTitle;
    message.value = promptMessage;
    isOpen.value = true;
    // Return a new promise that will be resolved by confirm() or cancel()
    return new Promise<boolean>((resolve) => {
      resolvePromise = resolve;
    });
  };

  // Function called by the modal component on confirmation
  const confirm = () => {
    if (resolvePromise) {
      resolvePromise(true); // Resolve the promise with true
      resolvePromise = null; // Clear resolver
    }
    isOpen.value = false;
  };

  // Function called by the modal component on cancellation
  const cancel = () => {
    if (resolvePromise) {
      resolvePromise(false); // Resolve the promise with false
      resolvePromise = null; // Clear resolver
    }
    isOpen.value = false;
  };

  // Expose state (readonly preferred outside) and control functions
  return {
    isOpen: readonly(isOpen), // Expose as readonly for components just displaying it
    title: readonly(title),
    message: readonly(message),
    prompt,   // Function to trigger the modal and get a promise
    confirm,  // Function for the modal component to call
    cancel    // Function for the modal component to call
  };
}