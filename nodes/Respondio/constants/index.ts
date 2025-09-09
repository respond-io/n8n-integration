import { INodeProperties, INodePropertyOptions } from "n8n-workflow";

import ACTION_NAMES from "./actions/action_names";
import channelActions from './actions/channels'
import closingNotesActions from './actions/closing_notes'
import commentsActions from './actions/comments'
import contactActions from './actions/contacts'
import contactFieldActions from './actions/contact_fields'
import conversationsActions from './actions/conversations'
import lifecycleActions from './actions/lifecycle'
import messagesActions from './actions/messages'
import usersActions from './actions/users';
import tagsActions from './actions/tags';
import OPERATION_NAMES from "./actions/operation_names";

const TRIGGER_SETTINGS = {
  CONTACT_ASSIGNEE_UPDATED: {
    name: 'Contact Assignee Updated',
    value: 'contactAssigneeUpdated',
    description: 'Trigger on contact assignee being updated',
    action: 'On Contact Assignee updated'
  },
  CONTACT_TAG_UPDATED: {
    name: 'Contact Tag Updated',
    value: 'contactTagUpdated',
    description: 'Trigger on contact tag being updated',
    action: 'On Contact Tag updated'
  },
  CONTACT_UPDATED: {
    name: 'Contact Updated',
    value: 'contactUpdated',
    description: 'Trigger on contact being updated',
    action: 'On Contact updated'
  },
  CONVERSATION_CLOSED: {
    name: 'Conversation Closed',
    value: 'conversationClosed',
    description: 'Trigger on conversation being closed',
    action: 'On Conversation closed'
  },
  CONVERSATION_OPENED: {
    name: 'Conversation Opened',
    value: 'conversationOpened',
    description: 'Trigger on conversation being opened',
    action: 'On Conversation opened'
  },
  NEW_COMMENT: {
    name: 'New Comment',
    value: 'newComment',
    description: 'Trigger on new comment being added to a conversation',
    action: 'On Comment added'
  },
  NEW_CONTACT: {
    name: 'New Contact',
    value: 'newContact',
    description: 'Trigger on new contact being created',
    action: 'On Contact created'
  },
  NEW_INCOMING_MESSAGE: {
    name: 'New Incoming Message',
    value: 'newIncomingMessage',
    description: 'Trigger on new incoming message',
    action: 'On Message received'
  },
  NEW_OUTGOING_MESSAGE: {
    name: 'New Outgoing Message',
    value: 'newOutgoingMessage',
    description: 'Trigger on new outgoing message',
    action: 'On Message sent'
  },
  CONTACT_LIFECYCLE_UPDATED: {
    name: 'Contact Lifecycle Updated',
    value: 'lifecycleUpdated',
    description: 'Trigger on contact lifecycle being updated',
    action: 'On Contact Lifecycle updated'
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
    { name: 'n8n', value: 'n8n' },
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
    { name: 'n8n', value: 'n8n' },
  ]
}

const ACTION_SETTINGS = {
  [OPERATION_NAMES.CHANNELS]: { [ACTION_NAMES.GET_ALL_CHANNELS]: channelActions.GET_ALL_CHANNELS },
  [OPERATION_NAMES.CLOSING_NOTES]: { [ACTION_NAMES.GET_ALL_CLOSING_NOTES]: closingNotesActions.GET_ALL_CLOSING_NOTES },
  [OPERATION_NAMES.COMMENTS]: { [ACTION_NAMES.ADD_COMMENT]: commentsActions.ADD_COMMENT },
  [OPERATION_NAMES.CONTACTS]: {
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
  [OPERATION_NAMES.CONTACT_FIELDS]: {
    [ACTION_NAMES.GET_ALL_CUSTOM_FIELDS]: contactFieldActions.GET_ALL_CUSTOM_FIELDS,
    [ACTION_NAMES.FIND_CUSTOM_FIELD]: contactFieldActions.FIND_CUSTOM_FIELD,
    [ACTION_NAMES.CREATE_CUSTOM_FIELD]: contactFieldActions.CREATE_CUSTOM_FIELD,
  },
  [OPERATION_NAMES.CONVERSATIONS]: {
    [ACTION_NAMES.ASSIGN_OR_UNASSIGNED_CONVERSATION]: conversationsActions.ASSIGN_OR_UNASSIGNED_CONVERSATION,
    [ACTION_NAMES.OPEN_OR_CLOSE_CONVERSATION]: conversationsActions.OPEN_OR_CLOSE_CONVERSATION,
  },
  [OPERATION_NAMES.LIFECYCLE]: {
    [ACTION_NAMES.REMOVE_CONTACT_LIFECYCLE]: lifecycleActions.REMOVE_CONTACT_LIFECYCLE,
    [ACTION_NAMES.UPDATE_CONTACT_LIFECYCLE]: lifecycleActions.UPDATE_CONTACT_LIFECYCLE,
  },
  [OPERATION_NAMES.MESSAGES]: {
    [ACTION_NAMES.FIND_MESSAGE]: messagesActions.FIND_MESSAGE,
    [ACTION_NAMES.SEND_MESSAGE]: messagesActions.SEND_MESSAGE
  },
  [OPERATION_NAMES.USER]: {
    [ACTION_NAMES.FIND_USER]: usersActions.FIND_USER,
    [ACTION_NAMES.GET_ALL_USERS]: usersActions.GET_ALL_USERS,
  },
  [OPERATION_NAMES.TAGS]: {
    [ACTION_NAMES.ADD_SPACE_TAG]: tagsActions.ADD_SPACE_TAG,
    [ACTION_NAMES.DELETE_SPACE_TAG]: tagsActions.DELETE_SPACE_TAG,
    [ACTION_NAMES.UPDATE_SPACE_TAG]: tagsActions.UPDATE_SPACE_TAG,
  }
} as const satisfies Record<
  string,
  Record<
    string,
    INodePropertyOptions & {
      params: INodeProperties[];
    }
  >
>;

const DEVELOPER_API_BASE_URL = 'https://api.respond.io'
const INTEGRATION_API_BASE_URL = 'https://app.respond.io';

export const INPUT_IDENTIFIER = '$input$';
export const HIDDEN_INPUT_IDENTIFIER = '$hidden$';

export {
  TRIGGER_SETTINGS,
  TRIGGER_SETTINGS_EVENT_SOURCES,
  ACTION_SETTINGS,
  ACTION_NAMES,
  DEVELOPER_API_BASE_URL,
  INTEGRATION_API_BASE_URL
};
