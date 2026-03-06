import { supabase } from './supabase';
import { setConversationMeta } from './conversations';
import { ConversationMeta } from './types';

const SEED_KEY = 'donaObraSeeded_v2';

const WELCOME_MESSAGE = `¡Ey, dimelo! 👷‍♀️ Soy Doña Obra, tu vecina de confianza pa' todo lo que es reparaciones y servicios del hogar. Yo conozco a todos los buenos maestros de la ciudad 💪

Cuéntame qué necesitas — mándame texto, fotos, lo que sea — y yo te digo cuánto te va a salir y quién te lo puede resolver. ¡Vamos al grano! 🔧`;

interface SeedMsg {
  role: 'user' | 'assistant';
  content: string;
  image_urls?: string[];
  delay_minutes: number;
}

interface SeedConv {
  meta: Omit<ConversationMeta, 'id'>;
  user_name: string;
  user_avatar: string;
  topic: string;
  messages: SeedMsg[];
}

const SAMPLE_CONVERSATIONS: SeedConv[] = [
  {
    meta: {
      type: 'dona_obra',
      title: 'Ana Martínez',
      lastMessage: 'Incluye materiales básicos y mano de obra.',
      lastMessageAt: '',
    },
    user_name: 'Ana Martínez',
    user_avatar: 'https://ui-avatars.com/api/?name=Ana+Martinez&background=E8614D&color=fff&size=128&bold=true',
    topic: 'Tubería goteando',
    messages: [
      {
        role: 'assistant',
        content: WELCOME_MESSAGE,
        delay_minutes: 0,
      },
      {
        role: 'user',
        content: 'Mira esta tubería del baño, está goteando fuerte 😰',
        image_urls: [
          'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=400&fit=crop&auto=format',
        ],
        delay_minutes: 2,
      },
      {
        role: 'assistant',
        content:
          '¡Uy mijo! Se ve que está chorreando bastante esa tubería 😬 Pero tranqui, eso se arregla fácil.\n\n¿Es agua fría o caliente la que gotea? ¿Y más o menos desde cuándo está así? 🔧',
        delay_minutes: 3,
      },
      {
        role: 'user',
        content: 'Es agua fría, empezó ayer en la noche',
        delay_minutes: 5,
      },
      {
        role: 'assistant',
        content:
          'Listo mijo, aquí va tu estimación 💪\n\n🔧 Reparación de tubería de agua fría\n💰 $30 — $80\n⭐ Complejidad: Baja\n\nIncluye materiales básicos y mano de obra.',
        delay_minutes: 6,
      },
    ],
  },
];

export async function seedSampleConversations(): Promise<ConversationMeta[]> {
  if (typeof window !== 'undefined' && localStorage.getItem(SEED_KEY)) {
    return [];
  }

  const createdMetas: ConversationMeta[] = [];

  for (const conv of SAMPLE_CONVERSATIONS) {
    try {
      const baseTime = new Date();
      const convOffset = SAMPLE_CONVERSATIONS.indexOf(conv) * 60;
      const convStartTime = new Date(baseTime.getTime() - convOffset * 60 * 1000);

      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .insert({
          status: 'active',
          started_at: convStartTime.toISOString(),
          last_message_at: new Date(
            convStartTime.getTime() +
              conv.messages[conv.messages.length - 1].delay_minutes * 60 * 1000
          ).toISOString(),
          user_name: conv.user_name,
          user_avatar: conv.user_avatar,
          topic: conv.topic,
        })
        .select('id')
        .single();

      if (convError || !convData) {
        console.error('Seed: error creating conversation', convError);
        continue;
      }

      const convId = convData.id;

      const messagesToInsert = conv.messages.map((msg) => ({
        conversation_id: convId,
        role: msg.role,
        content: msg.content,
        image_urls: msg.image_urls || null,
        metadata: null,
        created_at: new Date(
          convStartTime.getTime() + msg.delay_minutes * 60 * 1000
        ).toISOString(),
      }));

      const { error: msgError } = await supabase
        .from('messages')
        .insert(messagesToInsert);

      if (msgError) {
        console.error('Seed: error inserting messages', msgError);
        continue;
      }

      const lastMsg = conv.messages[conv.messages.length - 1];
      const meta: ConversationMeta = {
        id: convId,
        type: conv.meta.type,
        title: conv.user_name,
        lastMessage: lastMsg.content.slice(0, 80),
        lastMessageAt: new Date(
          convStartTime.getTime() + lastMsg.delay_minutes * 60 * 1000
        ).toISOString(),
        userName: conv.user_name,
        userAvatar: conv.user_avatar,
        topic: conv.topic,
      };

      setConversationMeta(meta);
      createdMetas.push(meta);
    } catch (err) {
      console.error('Seed: unexpected error', err);
    }
  }

  if (typeof window !== 'undefined' && createdMetas.length > 0) {
    localStorage.setItem(SEED_KEY, 'true');
  }

  return createdMetas;
}
