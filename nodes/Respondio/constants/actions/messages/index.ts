import { INodeProperties } from "n8n-workflow";

import { generateContactIdentifierInputFields, IContactIdentifiers } from "../../../utils";
import email from './email';
import attachments from './attachments';
import custom_payload from './custom_payload';
import quick_reply from './quick_reply';
import whatsapp_template from './whatsapp_template';
import text_message from './text_message';
import ACTION_NAMES from "../action_names";
import { HIDDEN_INPUT_IDENTIFIER, INPUT_IDENTIFIER } from "../..";
import { SendMessageTypes } from "../../../types";

const CATTALOG_PRODUCTS_KEY = 'catalog_products'

function unflatten(data: Record<string, any>, separator = '.'): Record<string, any> {
  const result: Record<string, any> = {};

  for (const flatKey in data) {
    const value = data[flatKey];
    const keys = flatKey.split(separator);

    let current = result;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (i === keys.length - 1) {
        current[key] = value;
      } else {
        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }
    }
  }

  return result;
}

type GetWhatsappTemplateMessageInput = {
  templateName: string;
  templateLanguageCode: string;
  messageType: SendMessageTypes;
  templateComponentsFields: Record<string, any> | string;
  inputData: Record<string, any>;
}

const getWhatsappTemplateMessage = (input: GetWhatsappTemplateMessageInput) => {
  let templateComponentsFieldsParsed: Record<string, any> | null = null
  const {
    templateName,
    templateLanguageCode,
    messageType,
    templateComponentsFields,
    inputData,
  } = input;

  try {
    templateComponentsFieldsParsed = typeof templateComponentsFields === 'string' ?
      JSON.parse(templateComponentsFields) :
      templateComponentsFields;

    for (const key in templateComponentsFieldsParsed) {
      if (
        templateComponentsFieldsParsed[key].includes(INPUT_IDENTIFIER) &&
        inputData[key]
      ) {
        if (
          templateComponentsFieldsParsed[key].includes(CATTALOG_PRODUCTS_KEY) &&
          (
            inputData[key].length < 1 ||
            inputData[key].length > 30
          )
        ) {
          const error = new Error('Can not select more than 30 products');
          error.name = 'ValidationError'
          throw error;
        }

        templateComponentsFieldsParsed[key] = inputData[key]
      } else if (
        templateComponentsFieldsParsed[key].includes(
          HIDDEN_INPUT_IDENTIFIER
        ) &&
        inputData[key]
      ) {
        templateComponentsFieldsParsed[key] = inputData[key];
      }
    }
  } catch (error) {
    console.log('error: ', error);
    if (error.name === 'ValidationError') {
      throw error
    }
    templateComponentsFieldsParsed = null;
  }

  return {
    type: messageType,
    template: {
      name: templateName,
      languageCode: templateLanguageCode,
      ...(templateComponentsFieldsParsed
        ? unflatten(templateComponentsFieldsParsed) as Record<string, any>
        : {}),
    }
  }
}

export type BaseRequestBody = {
  channelId?: number;
  message?:
  | { type: 'text'; text: string; messageTag?: string }
  | { type: 'attachment'; attachment: { type: string; url: string } }
  | { type: 'custom_payload'; payload: Record<string, any> }
  | { type: 'quick_reply'; title: string; replies: string }
  | { type: 'email'; message?: string; subject?: string; attachments?: string[]; cc?: string; bcc?: string; replyToMessageId?: string }
  | Record<string, any>;
};

export interface SharedInputFields {
  channelType: 'specificChannel' | 'lastInteractedChannel';
  channelId?: number;
}

interface TextInputData {
  messageType: SendMessageTypes.TEXT;
  text: string;
  messageTag?: string;
}

interface AttachmentInputData {
  messageType: SendMessageTypes.ATTACHMENT;
  attachmentType: 'image' | 'video' | 'audio' | 'file';
  attachmentUrl: string;
}

interface CustomPayloadInputData {
  messageType: SendMessageTypes.CUSTOM_PAYLOAD;
  payload: string;
}

interface QuickReplyInputData {
  messageType: SendMessageTypes.QUICK_REPLY;
  title?: string;
  replies?: string[];
}

interface EmailInputData {
  messageType: SendMessageTypes.EMAIL;
  text?: string;
  subject?: string;
  attachments?: unknown[];
  cc?: string[];
  bcc?: string[];
  replyToMessageId?: string;
}

interface WhatsappTemplateInputData {
  messageType: SendMessageTypes.WHATSAPP_TEMPLATE;
  [key: string]: any;
  templateName: string;
  templateLanguageCode: string;
  templateComponentsFields: Record<string, any> | string;
  inputData: Record<string, any>;
}

export type SendMessagePayloadFormatterInput =
  | (TextInputData & SharedInputFields)
  | (AttachmentInputData & SharedInputFields)
  | (CustomPayloadInputData & SharedInputFields)
  | (QuickReplyInputData & SharedInputFields)
  | (EmailInputData & SharedInputFields)
  | (WhatsappTemplateInputData & SharedInputFields);

export const sendMessagePayloadFormatter = (input: SendMessagePayloadFormatterInput) => {
  const requestBody: BaseRequestBody = {};
  const { messageType, channelType, channelId, ...rest } = input;

  if (channelType === 'specificChannel') requestBody.channelId = channelId;

  if (messageType === SendMessageTypes.TEXT) {
    const { text, messageTag } = rest as TextInputData;
    requestBody.message = {
      type: messageType,
      text,
      ...(messageTag && { messageTag }),
    };
  }

  if (messageType === SendMessageTypes.ATTACHMENT) {
    const { messageType, attachmentType, attachmentUrl } = rest as AttachmentInputData;
    requestBody.message = {
      type: messageType,
      attachment: {
        type: attachmentType,
        url: `https://${attachmentUrl}`
      }
    };
  }

  if (messageType === SendMessageTypes.CUSTOM_PAYLOAD) {
    const { payload } = rest as CustomPayloadInputData;
    try {
      JSON.parse(payload);
    } catch (e) {
      throw new Error('Please provide a valid json payload and try again!');
    }

    requestBody.message = {
      type: messageType,
      payload: JSON.parse(payload)
    };
  }

  if (messageType === SendMessageTypes.QUICK_REPLY) {
    const { title, replies } = rest as QuickReplyInputData;
    requestBody.message = {
      type: messageType,
      title,
      replies
    };
  }

  if (messageType === SendMessageTypes.EMAIL) {
    let { attachments, text, subject, cc, bcc, replyToMessageId } = rest as EmailInputData;
    if (!attachments) attachments = [];

    requestBody.message = {
      type: messageType,
      ...(text && { message: text }),
      ...(subject && { subject }),
      ...(attachments && { attachments }),
      ...(cc && { cc }),
      ...(bcc && { bcc }),
      ...(replyToMessageId && { replyToMessageId })
    };
  }

  if (messageType === SendMessageTypes.WHATSAPP_TEMPLATE) {
    const {
      templateComponentsFields,
      templateLanguageCode,
      templateName,
      inputData,
      messageType,
    } = rest as WhatsappTemplateInputData;
    requestBody.message = getWhatsappTemplateMessage({
      messageType,
      inputData,
      templateName,
      templateLanguageCode,
      templateComponentsFields
    })
  }

  return requestBody
}

export default {
  [ACTION_NAMES.FIND_MESSAGE]: {
    name: 'Find a Message',
    value: 'FIND_MESSAGE',
    description: 'Finds a specific message by identifier',
    params: [
      ...generateContactIdentifierInputFields([
        IContactIdentifiers.id,
        IContactIdentifiers.email,
        IContactIdentifiers.phone,
      ]),
      {
        displayName: 'Message ID',
        name: 'messageId',
        type: 'number',
        required: true,
        description: 'Numeric ID of the message',
        default: 0,
      }
    ] as unknown as INodeProperties[]
  },
  [ACTION_NAMES.SEND_MESSAGE]: {
    name: 'Send a Message',
    value: 'SEND_MESSAGE',
    description: 'Sends a message to a contact',
    params: [
      ...generateContactIdentifierInputFields([
        IContactIdentifiers.id,
        IContactIdentifiers.email,
        IContactIdentifiers.phone,
      ]),
      {
        displayName: 'Channel Type',
        name: 'channelType',
        type: 'options',
        options: [
          { name: 'Specific Channel', value: 'specificChannel' },
          { name: 'Last Interacted Channel', value: 'lastInteractedChannel' },
        ],
        required: true,
        description: 'Select the channel type to send the message',
        default: 'specificChannel'
      },
      {
        displayName: 'Channel ID',
        name: 'channelId',
        type: 'options',
        typeOptions: {
          loadOptionsMethod: 'getSpaceChannels',
          loadOptionsDependsOn: ['channelType']
        },
        required: true,
        description: 'Choose your channel from the list of connected channels',
        displayOptions: {
          show: {
            channelType: ['specificChannel'],
          },
        },
        default: 0,
      },
      {
        displayName: 'Message Type',
        name: 'messageType',
        type: 'options',
        options: [
          { name: 'Text', value: 'text' },
          { name: 'Attachments', value: 'attachment' },
          { name: 'Quick Reply', value: 'quick_reply' },
          { name: 'Custom Payload', value: 'custom_payload' },
          { name: 'WhatsApp Template', value: 'whatsapp_template' },
          { name: 'Email', value: 'email' },
        ],
        required: true,
        description: 'Select the channel type to send the message',
        default: 'text'
      },
      ...email.generateFields(),
      ...attachments.generateFields(),
      ...custom_payload.generateFields(),
      ...quick_reply.generateFields(),
      ...whatsapp_template.generateFields(),
      ...text_message.generateFields(),
    ] as unknown as INodeProperties[]
  },
};
