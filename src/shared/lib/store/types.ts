export interface Project {
  id: string;
  title: string;
  tagline: string | null;
  description: string | null;
  tech: string[];
  image: string;
  githubLink: string | null;
  sort_order?: number;
}

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
  image: string;
  sort_order?: number;
}

export interface TechItem {
  id?: string;
  name: string;
  icon: string;
  sort_order?: number;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface CollectionMap {
  projects: Project;
  certificates: Certificate;
  tech_stack: TechItem;
  messages: Message;
}

export type Collection = keyof CollectionMap;
export type Values<C extends Collection> = Partial<Omit<CollectionMap[C], 'id'>>;

export interface ListResult<T> {
  data: T[];
  source: 'live' | 'seed';
}

export interface MessageInput {
  name: string;
  email: string;
  message: string;
}

export type StoreErrorCode =
  'not-configured' | 'offline' | 'denied' | 'validation' | 'rate-limited';
