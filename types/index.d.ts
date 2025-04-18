import type { JSONContent } from '@tiptap/core';

export interface TiptapNode {
  type: string;
  content?: TiptapNode[];
  marks?: Array<{
    type: string;
    attrs?: Record<string, unknown>;
  }>;
  attrs?: Record<string, unknown>;
  text?: string;
}

export interface TiptapContent {
  type: 'doc';
  content: TiptapNode[];
}

export interface JournalEntry {
  id?: string;
  title: string;
  content: string; // Store as HTML string
  tags?: string[];
  sentiments?: Record<string, number>;
  createdAt: Date;
  isDraft?: boolean;
}

export interface JournalState {
  entries: JournalEntry[];
  isLoading: boolean;
  error: string | null;
}

export interface EditorAction {
  icon: string;
  title: string;
  command: string;
  args?: Record<string, unknown>;
  type?: 'separator';
} 