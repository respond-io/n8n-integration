import { INodeProperties } from "n8n-workflow";

import { generateContactIdentifierInputFields, IContactIdentifiers } from "../../../utils";
import email from './email';
import attachments from './attachments';
import custom_payload from './custom_payload';
import quick_reply from './quick_reply';
import whatsapp_template from './whatsapp_template';
import text_message from './text_message';
import { ACTION_NAMES } from "../..";

const INPUT_IDENTIFIER = '$input$';
const HIDDEN_INPUT_IDENTIFIER = '$hidden$';
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

const getWhatsappTemplateMessage = (
  inputData: Record<string, any>,
  templateName: string,
  templateLanguageCode: string,
  messageType: string,
  templateComponentsFields: string
) => {
  let templateComponentsFieldsParsed: Record<string, any> | null = null

  try {
    templateComponentsFieldsParsed = JSON.parse(templateComponentsFields)

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

type BaseRequestBody = {
  channelId?: number;
  message?:
  | { type: 'text'; text: string; messageTag?: string }
  | { type: 'attachment'; attachment: { type: string; url: string } }
  | { type: 'custom_payload'; payload: Record<string, any> }
  | { type: 'quick_reply'; title: string; replies: string }
  | { type: 'email'; message?: string; subject?: string; attachments?: string[]; cc?: string; bcc?: string; replyToMessageId?: string }
  | Record<string, any>;
};

// @ts-ignore
const payloadFormatter = (
  channelType: string,
  channelId: number,
  messageType: string,
  text: string,
  messageTag: string,
  attachmentType: string,
  attachmentUrl: string,
  title: string,
  replies: string,
  subject: string,
  payload: string,
  cc: string,
  bcc: string,
  replyToMessageId: string,
  attachments: string[],
  templateName: string,
  templateLanguageCode: string,
  templateComponentsFields: string,
  inputData: Record<string, any>
) => {
  const requestBody: BaseRequestBody = {};

  if (channelType === 'specificChannel') {
    requestBody.channelId = channelId;
  }

  switch (messageType) {
    case 'text':
      requestBody.message = {
        type: messageType,
        text,
        ...(messageTag && { messageTag }),
      }
      break;
    case 'attachment':
      requestBody.message = {
        type: messageType,
        attachment: {
          type: attachmentType,
          url: `https://${attachmentUrl}`
        }
      }
      break;
    case 'custom_payload':
      try {
        JSON.parse(payload)
      } catch (error) {
        throw new Error('Please provide a valid JSON payload and try again!')
      }

      requestBody.message = {
        type: messageType,
        payload: JSON.parse(payload)
      }
      break;
    case 'quick_reply':
      requestBody.message = {
        type: messageType,
        title,
        replies
      }
      break;
    case 'email':
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
      break;
    case 'whatsapp_template':
      requestBody.message = getWhatsappTemplateMessage(
        inputData,
        templateName,
        templateLanguageCode,
        messageType,
        templateComponentsFields,
      );
      break;
  }
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
        type: 'number',
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
          { name: 'Attachments', value: 'attachments' },
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
