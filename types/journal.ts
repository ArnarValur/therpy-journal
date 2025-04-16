export type SentimentType = 'positive' | 'neutral' | 'negative';

export type SentimentSlider = {
  id: string;
  name: string;
  value: number;
  min: number;
  max: number;
};

export type JournalTag = {
  id: string;
  name: string;
  color: string;
};

export type JournalEntry = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  isEncrypted: boolean;
  sentiment?: SentimentType;
  sentimentSliders?: SentimentSlider[];
  tags?: JournalTag[];
}; 