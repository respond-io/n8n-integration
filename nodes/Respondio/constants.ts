import { INodePropertyOptions } from "n8n-workflow";

const TRIGGER_SETTINGS = {
  CONTACT_ASSIGNEE_UPDATED: {
    name: 'Contact Assignee Updated',
    value: 'contactAssigneeUpdated',
    description: 'Trigger on contact assignee being updated',
  },
  CONTACT_TAG_UPDATED: {
    name: 'Contact Tag Updated',
    value: 'contactTagUpdated',
    description: 'Trigger on contact tag being updated',
  },
  CONTACT_UPDATED: {
    name: 'Contact Updated',
    value: 'contactUpdated',
    description: 'Trigger on contact being updated',
  },
  CONVERSATION_CLOSED: {
    name: 'Conversation Closed',
    value: 'conversationClosed',
    description: 'Trigger on conversation being closed',
  },
  CONVERSATION_OPENED: {
    name: 'Conversation Opened',
    value: 'conversationOpened',
    description: 'Trigger on conversation being opened',
  },
  NEW_COMMENT: {
    name: 'New Comment',
    value: 'newComment',
    description: 'Trigger on new comment being added to a conversation',
  },
  NEW_CONTACT: {
    name: 'New Contact',
    value: 'newContact',
    description: 'Trigger on new contact being created',
  },
  NEW_INCOMING_MESSAGE: {
    name: 'New Incoming Message',
    value: 'newIncomingMessage',
    description: 'Trigger on new incoming message',
  },
  NEW_OUTGOING_MESSAGE: {
    name: 'New Outgoing Message',
    value: 'newOutgoingMessage',
    description: 'Trigger on new outgoing message',
  },
  CONTACT_LIFECYCLE_UPDATED: {
    name: 'Contact Lifecycle Updated',
    value: 'lifecycleUpdated',
    description: 'Trigger on contact lifecycle being updated',
  },
} as const satisfies Record<string, INodePropertyOptions>;

export type TriggerSettingKey = keyof typeof TRIGGER_SETTINGS;

const TRIGGER_SETTINGS_EVENT_SOURCES = {
  CONVERSATION_CLOSED: [
    {
      name: 'User',
      value: 'user'
    },
    {
      name: 'Workflow',
      value: 'workflow'
    },
    {
      name: 'Developer API',
      value: 'api'
    },
    {
      name: 'Zapier',
      value: 'zapier'
    },
    {
      name: 'Bot',
      value: 'bot'
    },
    {
      name: 'Make',
      value: 'make'
    },
  ],
  CONVERSATION_OPENED: [
    {
      name: 'User',
      value: 'user'
    },
    {
      name: 'Contact',
      value: 'contact'
    },
    {
      name: 'Workflow',
      value: 'workflow'
    },
    {
      name: 'Api',
      value: 'api'
    },
    {
      name: 'Zapier',
      value: 'zapier'
    },
    {
      name: 'Make',
      value: 'make'
    },
    {
      name: 'Click-to-Chat-Ads',
      value: 'ctc_ads'
    },
  ],
  NEW_OUTGOING_MESSAGE: [
    {
      name: 'User',
      value: 'user'
    },
    {
      name: 'Workflow',
      value: 'workflow'
    },
    {
      name: 'Developer API',
      value: 'api'
    },
    {
      name: 'Zapier',
      value: 'zapier'
    },
    {
      name: 'Bot',
      value: 'bot'
    },
    {
      name: 'Echo',
      value: 'echo'
    },
    {
      name: 'Make',
      value: 'make'
    },
  ]
}

const PLATFORM_API_URLS = {
  staging: 'https://staging.respond.io/integration',
  production: 'https://app.respond.io/integration'
}

export { TRIGGER_SETTINGS, TRIGGER_SETTINGS_EVENT_SOURCES, PLATFORM_API_URLS };
