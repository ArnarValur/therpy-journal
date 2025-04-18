export interface TiptapContent {
  type: 'doc';
  content: Array<{
    type: string;
    content?: TiptapContent[];
    marks?: Array<{
      type: string;
      attrs?: Record<string, unknown>;
    }>;
    attrs?: Record<string, unknown>;
    text?: string;
  }>;
}

export interface JournalEntry {
  id?: string;
  title: string;
  content: TiptapContent;
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