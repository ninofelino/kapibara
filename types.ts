export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
  isError?: boolean;
  image?: string; // Base64 data URI for generated images
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}