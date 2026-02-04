
export interface HighlightedItem {
  text: string;
  page?: number;
  color?: string;
  category?: string;
}

export interface ExtractionResult {
  highlights: HighlightedItem[];
  summary?: string;
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
