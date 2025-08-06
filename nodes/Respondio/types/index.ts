export type GetContactResponse = {
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
  tags: Array<string>;
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

export enum CustomFieldDataTypes {
  TEXT = 'text',
  LIST = 'list',
  CHECKBOX = 'checkbox',
  NUMBER = 'number',
  EMAIL = 'email',
  URL = 'url',
  DATE = 'date',
  TIME = 'time'
}

export type CustomField = {
  id: number;
  name: string;
  title: string;
  description: string | null;
  slug: string | null;
  dataType: CustomFieldDataTypes;
  created_at: number;
  bundle?: string | null;
  allowedValues?: {
    listValues?: string[]
  }
}

export type CreateCommentResponse = {
  contactId: number;
  text: string;
  created_at: number;
}

export type CreateSpaceTagResponse = {
  code: number;
  message: {
    id: number;
    name: string;
    createdAt: number;
    colorCode: string;
    emoji: string;
    description: string;
  }
}

export type DeleteSpaceTagResponse = {
  message: string;
}

export type DeleteManyTagsResponse = {
  contactId: number;
}

export type FindContactChannelsItem = {
  id: string;
  name: string;
  source: string;
  contactChannelId: number;
  meta: any | null;
  lastMessageTime: number;
  lastIncomingMessageTime: number;
  created_at: number;
}

export type GetManyContactsResponse = {
  items: Array<GetContactResponse>;
  pagination: {
    next?: string;
    previous?: string;
  };
}

export type CreateContactResponse = {
  code: number;
  message: string;
}

export type GetUserResponseItem = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  team: {
    id: number;
    name: string;
  },
  restrictions: string[];
}

export type GetAllUsersResponse = {
  items: Array<GetUserResponseItem>;
  pagination: {
    next?: string;
    previous?: string;
  };
}
