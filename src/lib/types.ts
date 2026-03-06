export interface Provider {
  id: string;
  name: string;
  avatar_url: string | null;
  rating: number;
  review_count: number;
  location: string | null;
  categories: string[];
  price_min: number | null;
  price_max: number | null;
  whatsapp: string | null;
  phone: string | null;
  description: string | null;
  services: string[] | null;
  availability: string | null;
  years_experience: number | null;
  photos: string[] | null;
  dona_obra_comment: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  provider_id: string;
  author: string;
  rating: number;
  comment: string | null;
  date: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  started_at: string;
  last_message_at: string;
  status: 'active' | 'completed' | 'abandoned';
  user_name: string | null;
  user_avatar: string | null;
  topic: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  image_urls: string[] | null;
  metadata: EstimationData | null;
  created_at: string;
}

export interface EstimationData {
  type: 'estimation';
  category: string;
  service: string;
  priceRange: {
    min: number;
    max: number;
  };
  complexity: 'baja' | 'media' | 'alta';
  details: string;
  recommendedProviderIds: string[];
  topPickId: string;
  topPickComment: string;
}

// New Brief types for the 3-phase collection flow
export interface Brief {
  problem_summary: string;
  category: string;
  location: string;
  urgency: 'HOY' | 'Esta semana' | 'Sin prisa';
  availability: string;
  budget: string;
  photos_count: number;
  contact: { name: string; whatsapp: string };
  collected_at: string;
}

export interface Estimation {
  range_low: number;
  range_high: number;
  currency: string;
  includes: string[];
  excludes: string[];
  duration_estimate: string;
  confidence: 'alta' | 'media' | 'baja';
}

export interface ChatBrief {
  brief: Brief;
  estimation: Estimation;
  providers: Provider[];
}

export interface ContactRequest {
  id: string;
  conversation_id: string | null;
  provider_id: string;
  service_description: string | null;
  estimated_price_min: number | null;
  estimated_price_max: number | null;
  contact_method: 'whatsapp' | 'call' | 'solicitud';
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  estimation?: Estimation;
  brief?: Brief;
  providers?: Provider[];
  topPickId?: string;
  timestamp: Date;
}

export interface ConversationMeta {
  id: string;
  type: 'dona_obra' | 'provider';
  title: string;
  lastMessage: string;
  lastMessageAt: string;
  userName?: string;
  userAvatar?: string;
  topic?: string;
  providerName?: string;
  providerId?: string;
  providerAvatar?: string;
}

export interface ShareProjectData {
  provider: Provider;
  estimation: EstimationData;
  summary: string;
}
