export interface ShareableContent {
  headline: string;
  caption: string;
  cta: string;
  hashtags: string[];
  image_heading: string;
  image_quote: string;
  image_prompt: string;
}

export interface PosterImage {
  mime_type: string;
  data_base64: string;
}

export interface GenerateContentResponse {
  key: number;
  partner_code: string;
  is_birthday_today: boolean;
  content: ShareableContent;
  poster_image?: PosterImage | null;
  poster_error?: string | null;
}

export interface GenerateContentRequest {
  key?: 1 | 2 | 3;
  partner_code: string;
  partner_name: string;
  partner_group?: string;
  partner_dob?: string;
  partner_phone_number?: string;
  email?: string;
  city?: string;
  experience_years?: number;
  top_product?: string;
  monthly_booking?: number;
  monthly_renewals?: number;
  include_poster?: boolean;
  protectionScore?: number;
  insight_text?: string;
  current_date?: string;
  user_prompt?: string;
}
