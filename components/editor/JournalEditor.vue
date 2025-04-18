<!-- components/editor/JournalEditor.vue -->
<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { watch, onBeforeUnmount } from 'vue';

interface Props {
  initialContent: string | null; // HTML content
  editable?: boolean;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  editable: true,
  placeholder: 'Start writing...'
});

const emit = defineEmits<{
  (e: 'update', content: string): void; // Emit HTML content
}>();

const editor = useEditor({
  extensions: [StarterKit],
  content: props.initialContent || '',
  editable: props.editable,
  editorProps: {
    attributes: {
      class: 'prose dark:prose-invert max-w-none p-4 min-h-[250px]',
    },
    handleKeyDown: (view, event) => {
      if (event.key === ' ') {
        return false; // Let the default handler take care of it
      }
      return false;
    }
  },
  onBlur: ({ editor }) => {
    emit('update', editor.getHTML());
  }
});

// Watch for external content changes
watch(() => props.initialContent, (newContent) => {
  if (editor.value && newContent) {
    editor.value.commands.setContent(newContent);
  }
}, { deep: true });

// Clean up on unmount
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
});

// Define toolbar actions with proper type handling
type ToolbarItem = {
  type?: 'separator';
  icon?: string;
  title?: string;
  command?: string;
  args?: Record<string, unknown>;
};

const toolbarActions: ToolbarItem[] = [
  { icon: 'ri-bold', title: 'Bold', command: 'toggleBold' },
  { icon: 'ri-italic', title: 'Italic', command: 'toggleItalic' },
  { icon: 'ri-strikethrough', title: 'Strike', command: 'toggleStrike' },
  { type: 'separator' },
  { icon: 'ri-paragraph', title: 'Paragraph', command: 'setParagraph' },
  { icon: 'ri-h-1', title: 'Heading 1', command: 'toggleHeading', args: { level: 1 } },
  { icon: 'ri-h-2', title: 'Heading 2', command: 'toggleHeading', args: { level: 2 } },
  { type: 'separator' },
  { icon: 'ri-list-unordered', title: 'Bullet List', command: 'toggleBulletList' },
  { icon: 'ri-list-ordered', title: 'Ordered List', command: 'toggleOrderedList' },
  { icon: 'ri-double-quotes-l', title: 'Blockquote', command: 'toggleBlockquote' },
  { type: 'separator' },
  { icon: 'ri-arrow-go-back-line', title: 'Undo', command: 'undo' },
  { icon: 'ri-arrow-go-forward-line', title: 'Redo', command: 'redo' }
];
</script>

<template>
  <div class="border rounded-md dark:border-gray-700 overflow-hidden">
    <!-- Editor toolbar -->
    <div v-if="editor && editable" class="flex flex-wrap gap-1 p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <template v-for="(action, key) in toolbarActions" :key="key">
        <button
          v-if="action.icon && action.command"
          :class="{ 'bg-blue-100 dark:bg-blue-900': editor.isActive(action.command, action.args) }"
          class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          :title="action.title"
          type="button"
          @click="() => {
            if (editor && action.command) {
              const chain = editor.chain().focus();
              if (action.command in chain) {
                const cmd = chain[action.command as keyof typeof chain];
                if (typeof cmd === 'function') {
                  (cmd as Function)(action.args).run();
                }
              }
            }
          }"
        >
          <i :class="action.icon" />
        </button>
        <span 
          v-else 
          class="border-r dark:border-gray-700 mx-1"
        />
      </template>
    </div>
    
    <!-- Editor content area -->
    <EditorContent :editor="editor" />
  </div>
</template>

<style>

</style> 