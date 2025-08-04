export type getContactResponse = {
  id: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  language: string | null;
  profilePic: string;
  locale: string | null;
  countryCode: string | null;
  status: 'open' | 'closed' | 'done' | 'snoozed' | 'unsnoozed' | null;
  isBlocked: boolean;
  custom_fields: Array<{ name: string; value: string | null }>;
  tags: Array<{ id: string; name: string }>;
  assignee: {
    id: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
  lifecycle: string | null;
  created_at: number | null;
}

export type SpaceUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'agent' | 'admin' | 'owner';
  team: string | null;
  restrictions: string[];
}

export type GetSpaceUsersResponse = {
  items: SpaceUser[];
  pagination: {
    next?: string;
    previous?: string;
  };
}

export type ClosingNote = {
  timestamp: number;
  category: string;
  content: string;
  description: string | null;
}

export type GetClosingNotesResponse = {
  items: Array<ClosingNote>;
  pagination: {
    next?: string;
    previous?: string;
  };
}

export type Channel = {
  id: string;
  name: string;
  source: string;
  created_at: number;
}

export type GetSpaceChannelsResponse = {
  items: Array<Channel>;
  pagination: {
    next?: string;
    previous?: string;
  };
}

export type WhatsAppTemplate = {
  id: number;
  name: string;
  components: string; // JSON string of components
  bundle: string;
  channelId: string;
  botId: string;
  created_at: string;
  updated_at: string;
  languageCode: string;
  namespace: string;
  category: string;
  status: 'approved' | 'rejected';
  statusDetail: string;
  templateId: string;
  label: string;
  qualityScore: string;
}

export type GetWhatsAppTemplatesResponse = {
  items: Array<WhatsAppTemplate>;
  pagination: {
    next?: string;
    previous?: string;
  };
}
