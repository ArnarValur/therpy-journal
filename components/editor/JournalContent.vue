<!-- components/editor/JournalContent.vue -->
<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { computed, onBeforeUnmount } from 'vue';

interface Props {
  content: string; // HTML content
  preview?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  preview: false
});

const editor = useEditor({
  extensions: [StarterKit],
  content: props.content,
  editable: false,
  editorProps: {
    attributes: {
      class: 'prose dark:prose-invert max-w-none',
    }
  },
});

const previewText = computed(() => {
  if (!editor.value || !props.preview) return '';
  const text = editor.value.getText();
  return text.substring(0, 200) + (text.length > 200 ? '...' : '');
});

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
});
</script>

<template>
  <div v-if="preview" class="text-gray-600 dark:text-gray-300">
    {{ previewText }}
  </div>
  <EditorContent 
    v-else
    :editor="editor"
  />
</template> 