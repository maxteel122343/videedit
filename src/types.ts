export enum EditorProfile {
  YOUTUBER = 'YOUTUBER',
  REELS = 'REELS',
  CLASSROOM = 'CLASSROOM'
}

export enum ExportFormat {
  MP4 = 'MP4',
  MOV = 'MOV'
}

export enum ExportQuality {
  ECONOMICO = 'Económico',
  PADRAO = 'Padrão',
  MAXIMO = 'Máximo'
}

export interface Word {
  id: string;
  text: string;
  start: number;
  end: number;
  isRemoved: boolean;
  type?: 'silence' | 'error' | 'breath' | 'normal';
}

export interface VideoProject {
  id: string;
  name: string;
  videoUrl: string;
  transcript: Word[];
  profile: EditorProfile;
  createdAt: number;
  originalSize: number; // in bytes
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
