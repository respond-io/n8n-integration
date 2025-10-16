import { IExecuteFunctions, INodeExecutionData, NodeExecutionWithMetadata } from "n8n-workflow";
import { ACTION_NAMES } from "../constants";

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

export type GetMessageResponseStatusItem = {
  value: string;
  timestamp: number;
  message: string;
}

export type GetMessageResponse = {
  messageId: number;
  channelMessageId: string;
  contactId: number;
  channelId: number;
  traffic: string;
  message: {
    type: string;
    text: string;
    messageTag: string;
    subType?: string;
    title?: string;
    replies?: string[];
  },
  status: Array<GetMessageResponseStatusItem>;
}

export type CustomFieldMapperReturnValue = {
  mappingMode: 'defineBelow',
  value: Record<string, string | number | boolean | Date>,
  matchingColumns: string[],
  schema: Array<Record<string, any>>,
  attemptToConvertTypes: boolean,
  convertFieldsToString: boolean
}

export enum SendMessageTypes {
  TEXT = 'text',
  ATTACHMENT = 'attachment',
  CUSTOM_PAYLOAD = 'custom_payload',
  QUICK_REPLY = 'quick_reply',
  EMAIL = 'email',
  WHATSAPP_TEMPLATE = 'whatsapp_template',
}

export type FetchWhatsappTemplateResponse = {
  status: string;
  message: string;
  data: Omit<WhatsAppTemplate, 'components'> & {
    components: Record<string, any>[] | string; // JSON string of components
    bundle: Record<string, any>;
    channel: Record<string, any>;
    catalogProducts: Record<string, any>[];
  }
}

export type SendMessageResponse = {
  messageId: number;
}

export type WhatsappTemplateComponentField = {
  type: 'text' | 'header' | 'buttons' | 'image' | 'video' | 'document' | 'audio';
  format?: 'text' | 'date' | 'time' | 'video' | 'image' | 'document';
  text?: string;
  example: Record<string, any> | string;
  buttons?: any[] | null;
}

export type CreateContactPayload = {
  firstName?: string;
  lastName?: string;
  language?: string;
  profilePic?: string;
  countryCode?: string;
  custom_fields?: { name: string; value: string | number | boolean | Date }[];
  email?: string;
  phone?: string;
}

export type GenericActionHandler = {
  execute: (action: ACTION_NAMES, ctx: IExecuteFunctions) => Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null>;
};
