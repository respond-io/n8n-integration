import { IExecuteFunctions, INodeProperties, ResourceMapperField } from "n8n-workflow";

import { generateContactIdentifierInputFields, IContactIdentifiers } from "../../../utils";
import email from './email';
import attachments from './attachments';
import custom_payload from './custom_payload';
import quick_reply from './quick_reply';
import whatsapp_template from './whatsapp_template';
import text_message from './text_message';
import ACTION_NAMES from "../action_names";
import { CustomFieldMapperReturnValue, FetchWhatsappTemplateResponse, SendMessageTypes, WhatsappTemplateComponentField } from "../../../types";
// import { HIDDEN_INPUT_IDENTIFIER, INPUT_IDENTIFIER } from "../..";

// const CATTALOG_PRODUCTS_KEY = 'catalog_products'

// function unflatten(data: Record<string, any>, separator = '.'): Record<string, any> {
//   const result: Record<string, any> = {};
//
//   for (const flatKey in data) {
//     const value = data[flatKey];
//     const keys = flatKey.split(separator);
//
//     let current = result;
//     for (let i = 0; i < keys.length; i++) {
//       const key = keys[i];
//       if (i === keys.length - 1) {
//         current[key] = value;
//       } else {
//         if (!current[key] || typeof current[key] !== 'object') {
//           current[key] = {};
//         }
//         current = current[key];
//       }
//     }
//   }
//
//   return result;
// }

type GetWhatsappTemplateMessageInput = {
  messageType: SendMessageTypes;
  templateComponentsFields: CustomFieldMapperReturnValue;
  templateDetails: FetchWhatsappTemplateResponse['data'];
  executionContext: IExecuteFunctions;
}

const convertSchemaToDefaultComponent = (
  valuePresent: boolean,
  templateComponentsFieldsSchema: GetWhatsappTemplateMessageInput['templateComponentsFields']['schema'],
  templateComponentsFieldsValue: GetWhatsappTemplateMessageInput['templateComponentsFields']['value'],
) => {
  if (valuePresent) {
    const returningFields: Array<Record<string, any>> =
      Object.entries(templateComponentsFieldsValue)
        .filter(([, value]) => !(typeof value === 'boolean' && !value))
        .map(([key, value]) => ({ [key]: value }));

    templateComponentsFieldsSchema.forEach((field) => {
      if (field.id.includes('_details')) {
        returningFields.push({ [field.id]: field })
      }
    })
    return returningFields
  }

  return templateComponentsFieldsSchema.map((field) => {
    if (typeof Object.values(field)[0] === 'boolean') { return { [field.id]: true } }

    return { [field.id]: field }
  })
}

const extractProductFromRawComponents = (rawComponents: ReturnType<typeof convertSchemaToDefaultComponent>, includeDetails: boolean) => {
  return rawComponents.filter((obj) => {
    const key = Object.keys(obj)[0];
    return includeDetails ? key.includes('_details') : !key.includes('_details');
  })
}

const getWhatsappTemplateMessage = (input: GetWhatsappTemplateMessageInput) => {
  const {
    messageType,
    templateComponentsFields,
    templateDetails,
  } = input;

  const valuePresent = templateComponentsFields?.value && Object.keys(templateComponentsFields.value).length > 0;
  const rawComponents = convertSchemaToDefaultComponent(
    valuePresent,
    templateComponentsFields.schema,
    templateComponentsFields.value,
  );

  const originalComponents: Array<WhatsappTemplateComponentField> = typeof templateDetails.components === 'string' ?
    JSON.parse(templateDetails.components) :
    templateDetails.components;

  const nonButtonComponents: Array<WhatsappTemplateComponentField> = originalComponents.filter((item) => item.type !== 'buttons');
  const resultingComponents: any[] = [];

  for (const component of nonButtonComponents) {
    resultingComponents.push({
      type: component.type,
      format: component.format || undefined,
      text: component.text || undefined,
      parameters: [
        {
          type: "text",
          text: "Something testing"
        }
      ],
    })
  }

  const hasProducts = templateDetails.catalogProducts.length > 0;

  if (hasProducts) {
    const buttonComponent = originalComponents.find((item) => item.type === 'buttons' && item.buttons?.length) as { type: 'buttons', buttons: any[] } | undefined;

    // a template can only have either mpm or catalog_products
    const buttonType = buttonComponent?.buttons?.[0]?.type

    // mpm allows user to select products
    if (buttonComponent && buttonType === 'mpm') {
      const mpmProductsWithoutDetails = extractProductFromRawComponents(rawComponents, false);
      const mpmProductDetails = extractProductFromRawComponents(rawComponents, true);
      const hasNotChosenProducts = mpmProductsWithoutDetails.every(obj => Object.values(obj)[0] === false);

      if (hasNotChosenProducts) throw new Error('Please select at least one product from the MPM products list.');

      const { options } = Object.values(mpmProductDetails[0])[0] as Record<string, any>
      const { value: productDetailsString } = options[0];
      const firstProductDetail = JSON.parse(productDetailsString as string)
      resultingComponents.push({
        type: 'buttons',
        buttons: [
          {
            type: 'mpm',
            text: buttonComponent?.buttons?.[0].text || 'View items',
            parameters: [
              {
                type: 'action',
                action: {
                  thumbnail_product_retailer_id: firstProductDetail.retailer_id,
                  thumbnail_product_image_url: firstProductDetail.image_url,
                  sections: [
                    {
                      product_items: mpmProductsWithoutDetails.map((product) => {
                        const key = Object.keys(product)[0];
                        const mappedProduct = mpmProductDetails.find((detail) => Object.keys(detail)[0] === `${key}_details`) as ResourceMapperField | undefined;

                        if (!mappedProduct) return null;

                        const { options } = Object.values(mappedProduct)[0] as ResourceMapperField;
                        if (!options) return null;

                        const { value: productDetailsString } = options[0];

                        const productDetails = JSON.parse(productDetailsString as string)
                        return {
                          ...productDetails,
                          product_retailer_id: productDetails.retailer_id,
                        }
                      }).filter(Boolean),
                    }
                  ]
                }
              }
            ]
          }
        ],
      })
    }

    // catalog does not allow user to select products
    if (buttonComponent && buttonType === 'catalog') {
      const catalogProductsWithoutDetails = extractProductFromRawComponents(rawComponents, false);
      const catalogProductDetails = extractProductFromRawComponents(rawComponents, true);
      const { options } = Object.values(catalogProductDetails[0])[0] as Record<string, any>
      const { value: productDetailsString } = options[0];
      const firstProductDetail = JSON.parse(productDetailsString as string)

      resultingComponents.push({
        type: 'buttons',
        buttons: [
          {
            type: 'catalog',
            text: buttonComponent?.buttons?.[0].text || 'View items',
            parameters: [
              {
                type: 'action',
                action: {
                  thumbnail_product_retailer_id: firstProductDetail.retailer_id,
                  thumbnail_product_image_url: firstProductDetail.image_url,
                  sections: catalogProductsWithoutDetails.map((product) => {
                    const key = Object.keys(product)[0];
                    const mappedProduct = catalogProductDetails.find((detail) => Object.keys(detail)[0] === `${key}_details`) as ResourceMapperField | undefined;

                    if (!mappedProduct) return null;

                    const { options } = Object.values(mappedProduct)[0] as ResourceMapperField;
                    if (!options) return null;

                    const { value: productDetailsString } = options[0];

                    const productDetails = JSON.parse(productDetailsString as string)
                    return productDetails
                  }).filter(Boolean),
                }
              }
            ]
          }
        ]
      })
    }
  }

  const payload = {
    type: messageType,
    template: {
      name: templateDetails.name,
      languageCode: templateDetails.languageCode,
      components: resultingComponents
    }
  }

  return payload
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
  templateComponentsFields: CustomFieldMapperReturnValue;
  templateDetails: FetchWhatsappTemplateResponse['data'];
  executionContext: IExecuteFunctions
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
      templateDetails,
      executionContext
    } = rest as WhatsappTemplateInputData;

    requestBody.message = getWhatsappTemplateMessage({
      messageType,
      templateComponentsFields,
      templateDetails,
      executionContext
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
