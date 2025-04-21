// composables/useActionHandler.ts (Modified Confirmation Part)
import { ref } from 'vue';
import { useModalSystem } from '~/composables/useModalSystem'; // Import the modal system

interface ActionHandlerOptions<TInput, TResult> {
  actionFn: (data: TInput) => Promise<TResult>;
  confirmation?: {
    title: string;
    message: string;
  };
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (result: TResult, input: TInput) => Promise<void> | void;
  onError?: (error: Error, input: TInput) => Promise<void> | void;
}

export function useActionHandler<TInput = void, TResult = unknown>(options: ActionHandlerOptions<TInput, TResult>) {
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  const { prompt: showConfirmation } = useModalSystem(); // Get the prompt function

  const execute = async (data: TInput) => {
    isLoading.value = true;
    error.value = null;

    // --- 1. Confirmation ---
    if (options.confirmation) {
      try {
        // Use the modal system's prompt function, which returns a promise
        const confirmed = await showConfirmation(
          options.confirmation.title,
          options.confirmation.message
        );

        if (!confirmed) {
          isLoading.value = false;
          console.log('Action cancelled by user via modal.');
          return; // Abort if not confirmed
        }
      } catch (modalError) {
         // Handle potential errors from the modal system itself if needed
         console.error("Modal confirmation error:", modalError);
         isLoading.value = false;
         return;
      }
    }

    // --- 2. Execute Action ---
    try {
      // ... (rest of the try block: actionFn, onSuccess, successMessage) ...
      const result = await options.actionFn(data);
      if (options.successMessage) console.log('Success Toast:', options.successMessage); // Placeholder
      if (options.onSuccess) await options.onSuccess(result, data);

    } catch (err: unknown) {
      // --- 4. Handle Error ---
      // ... (rest of the catch block: onError, errorMessage) ...
      console.error('Action failed:', err);
      error.value = err instanceof Error ? err : new Error('An unknown error occurred');
      if (options.errorMessage) console.error('Error Toast:', options.errorMessage); // Placeholder
      if (options.onError) await options.onError(error.value, data);
    } finally {
       // --- 5. Cleanup ---
       isLoading.value = false;
    }
  };

  return {
    execute,
    isLoading,
    error,
  };
}