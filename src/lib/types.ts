export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          display_name?: string | null;
        };
      };
      decks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          source_type: "text" | "url";
          source_content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          source_type: "text" | "url";
          source_content: string;
          created_at?: string;
        };
        Update: {
          title?: string;
        };
      };
      cards: {
        Row: {
          id: string;
          deck_id: string;
          question_zh: string;
          question_en: string;
          answer_zh: string;
          answer_en: string;
          knowledge_tag: string;
          difficulty: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          deck_id: string;
          question_zh: string;
          question_en: string;
          answer_zh: string;
          answer_en: string;
          knowledge_tag: string;
          difficulty: number;
          created_at?: string;
        };
        Update: {
          question_zh?: string;
          question_en?: string;
          answer_zh?: string;
          answer_en?: string;
          knowledge_tag?: string;
          difficulty?: number;
        };
      };
      reviews: {
        Row: {
          id: string;
          card_id: string;
          user_id: string;
          easiness_factor: number;
          interval: number;
          repetitions: number;
          next_review: string;
          last_review: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          user_id: string;
          easiness_factor?: number;
          interval?: number;
          repetitions?: number;
          next_review?: string;
          last_review?: string;
        };
        Update: {
          easiness_factor?: number;
          interval?: number;
          repetitions?: number;
          next_review?: string;
          last_review?: string;
        };
      };
    };
  };
}

export type Card = Database["public"]["Tables"]["cards"]["Row"];
export type Deck = Database["public"]["Tables"]["decks"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface GeneratedCard {
  question_zh: string;
  question_en: string;
  answer_zh: string;
  answer_en: string;
  knowledge_tag: string;
  difficulty: number;
}

export interface GeneratedDeck {
  title: string;
  cards: GeneratedCard[];
}
