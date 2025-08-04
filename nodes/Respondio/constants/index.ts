import { INodeProperties, INodePropertyOptions } from "n8n-workflow";

import { generateContactIdentifierInputFields, generateContactInputFields, IContactIdentifiers } from "../utils";

import channelActions from './actions/channels'
import closingNotesActions from './actions/closing_notes'
import commentsActions from './actions/comments'
import contactActions from './actions/contacts'
import contactFieldActions from './actions/contact_fields'
import conversationsActions from './actions/conversations'
import lifecycleActions from './actions/lifecycle'
import messagesActions from './actions/messages'
import usersActions from './actions/users';

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
    { name: 'User', value: 'user' },
    { name: 'Workflow', value: 'workflow' },
    { name: 'Developer API', value: 'api' },
    { name: 'Zapier', value: 'zapier' },
    { name: 'Bot', value: 'bot' },
    { name: 'Make', value: 'make' },
  ],
  CONVERSATION_OPENED: [
    { name: 'User', value: 'user' },
    { name: 'Contact', value: 'contact' },
    { name: 'Workflow', value: 'workflow' },
    { name: 'Api', value: 'api' },
    { name: 'Zapier', value: 'zapier' },
    { name: 'Make', value: 'make' },
    { name: 'Click-to-Chat-Ads', value: 'ctc_ads' },
  ],
  NEW_OUTGOING_MESSAGE: [
    { name: 'User', value: 'user' },
    { name: 'Workflow', value: 'workflow' },
    { name: 'Developer API', value: 'api' },
    { name: 'Zapier', value: 'zapier' },
    { name: 'Bot', value: 'bot' },
    { name: 'Echo', value: 'echo' },
    { name: 'Make', value: 'make' },
  ]
}

enum ACTION_NAMES {
  GET_ALL_CHANNELS = 'GET_ALL_CHANNELS',
  GET_ALL_CLOSING_NOTES = 'GET_ALL_CLOSING_NOTES',
  ADD_COMMENT = 'ADD_COMMENT',
  ADD_SPACE_TAG = 'ADD_SPACE_TAG',
  DELETE_SPACE_TAG = 'DELETE_SPACE_TAG',
  UPDATE_SPACE_TAG = 'UPDATE_SPACE_TAG',
  REMOVE_TAGS = 'REMOVE_TAGS',
  DELETE_CONTACT = 'DELETE_CONTACT',
  FIND_CONTACT_CHANNELS = 'FIND_CONTACT_CHANNELS',
  FIND_CONTACT = 'FIND_CONTACT',
  ADD_TAGS = 'ADD_TAGS',
  GET_MANY_CONTACTS = 'GET_MANY_CONTACTS',
  UPDATE_CONTACT = 'UPDATE_CONTACT',
  CREATE_OR_UPDATE_CONTACT = 'CREATE_OR_UPDATE_CONTACT',
  CREATE_CONTACT = 'CREATE_CONTACT',
  GET_ALL_CUSTOM_FIELDS = 'GET_ALL_CUSTOM_FIELDS',
  FIND_CUSTOM_FIELD = 'FIND_CUSTOM_FIELD',
  CREATE_CUSTOM_FIELD = 'CREATE_CUSTOM_FIELD',
  ASSIGN_OR_UNASSIGNED_CONVERSATION = 'ASSIGN_OR_UNASSIGNED_CONVERSATION',
  OPEN_OR_CLOSE_CONVERSATION = 'OPEN_OR_CLOSE_CONVERSATION',
  REMOVE_CONTACT_LIFECYCLE = 'REMOVE_CONTACT_LIFECYCLE',
  UPDATE_CONTACT_LIFECYCLE = 'UPDATE_CONTACT_LIFECYCLE',
  FIND_MESSAGE = 'FIND_MESSAGE',
  SEND_MESSAGE = 'SEND_MESSAGE',
  FIND_USER = 'FIND_USER',
  GET_ALL_USERS = 'GET_ALL_USERS',
}

const ACTION_SETTINGS = {
  CHANNELS: { [ACTION_NAMES.GET_ALL_CHANNELS]: channelActions.GET_ALL_CHANNELS },
  CLOSING_NOTES: { [ACTION_NAMES.GET_ALL_CLOSING_NOTES]: closingNotesActions.GET_ALL_CLOSING_NOTES },
  COMMENTS: { [ACTION_NAMES.ADD_COMMENT]: commentsActions.ADD_COMMENT },
  CONTACTS: {
    [ACTION_NAMES.ADD_SPACE_TAG]: contactActions.ADD_SPACE_TAG,
    [ACTION_NAMES.DELETE_SPACE_TAG]: contactActions.DELETE_SPACE_TAG,
    [ACTION_NAMES.UPDATE_SPACE_TAG]: contactActions.UPDATE_SPACE_TAG,
    [ACTION_NAMES.REMOVE_TAGS]: contactActions.REMOVE_TAGS,
    [ACTION_NAMES.DELETE_CONTACT]: contactActions.DELETE_CONTACT,
    [ACTION_NAMES.FIND_CONTACT_CHANNELS]: contactActions.FIND_CONTACT_CHANNELS,
    [ACTION_NAMES.FIND_CONTACT]: contactActions.FIND_CONTACT,
    [ACTION_NAMES.ADD_TAGS]: contactActions.ADD_TAGS,
    [ACTION_NAMES.GET_MANY_CONTACTS]: contactActions.GET_MANY_CONTACTS,
    [ACTION_NAMES.UPDATE_CONTACT]: contactActions.UPDATE_CONTACT,
    [ACTION_NAMES.CREATE_OR_UPDATE_CONTACT]: contactActions.CREATE_OR_UPDATE_CONTACT,
    [ACTION_NAMES.CREATE_CONTACT]: contactActions.CREATE_CONTACT,
  },
  CONTACT_FIELDS: {
    [ACTION_NAMES.GET_ALL_CUSTOM_FIELDS]: contactFieldActions.GET_ALL_CUSTOM_FIELDS,
    [ACTION_NAMES.FIND_CUSTOM_FIELD]: contactFieldActions.FIND_CUSTOM_FIELD,
    [ACTION_NAMES.CREATE_CUSTOM_FIELD]: contactFieldActions.CREATE_CUSTOM_FIELD,
  },
  CONVERSATIONS: {
    [ACTION_NAMES.ASSIGN_OR_UNASSIGNED_CONVERSATION]: conversationsActions.ASSIGN_OR_UNASSIGNED_CONVERSATION,
    [ACTION_NAMES.OPEN_OR_CLOSE_CONVERSATION]: conversationsActions.OPEN_OR_CLOSE_CONVERSATION,
  },
  LIFECYCLE: {
    [ACTION_NAMES.REMOVE_CONTACT_LIFECYCLE]: lifecycleActions.REMOVE_CONTACT_LIFECYCLE,
    [ACTION_NAMES.UPDATE_CONTACT_LIFECYCLE]: lifecycleActions.UPDATE_CONTACT_LIFECYCLE,
  },
  MESSAGES: {
    [ACTION_NAMES.FIND_MESSAGE]: messagesActions.FIND_MESSAGE,
    [ACTION_NAMES.SEND_MESSAGE]: messagesActions.SEND_MESSAGE
  },
  USER: {
    [ACTION_NAMES.FIND_USER]: usersActions.FIND_USER,
    [ACTION_NAMES.GET_ALL_USERS]: usersActions.GET_ALL_USERS,
  }
} as const satisfies Record<string, Record<string, INodePropertyOptions & { params: Array<INodeProperties> | Array<Object> }>>;

const PLATFORM_API_URLS = {
  staging: 'https://staging.respond.io',
  production: 'https://app.respond.io',
  test: 'https://a8b4597fcf19.ngrok-free.app'
}

export { TRIGGER_SETTINGS, TRIGGER_SETTINGS_EVENT_SOURCES, PLATFORM_API_URLS, ACTION_SETTINGS, ACTION_NAMES };
