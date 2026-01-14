import { INodeProperties } from "n8n-workflow";

import { generateContactIdentifierInputFields, IContactIdentifiers } from "../../../utils";
import email from './email';
import attachments from './attachments';
import custom_payload from './custom_payload';
import quick_reply from './quick_reply';
import whatsapp_template from './whatsapp_template';
import text_message from './text_message';
import ACTION_NAMES from "../action_names";
import {
  CustomFieldMapperReturnValue,
  FetchWhatsappTemplateResponse,
  SendMessageTypes,
  WhatsappTemplateComponentField,
} from "../../../types";
import { INPUT_IDENTIFIER } from "../..";

type GetWhatsappTemplateMessageInput = {
  messageType: SendMessageTypes;
  templateComponentsFields: CustomFieldMapperReturnValue;
  templateDetails: FetchWhatsappTemplateResponse['data'];
}

const createDefaultFieldValue = (field: any) => {
  if (typeof Object.values(field)[0] === 'boolean') {
    return { [field.id]: true };
  }
  return { [field.id]: field };
};

// Helper function to filter out false boolean values
const filterValidValues = (templateValue: Record<string, any>) => {
  return Object.entries(templateValue)
    .filter(([, value]) => !(typeof value === 'boolean' && !value))
    .map(([key, value]) => ({ [key]: value }));
};

// Helper function to add detail fields
const addDetailFields = (
  fields: Array<Record<string, any>>,
  schema: any[]
) => {
  schema.forEach((field) => {
    if (field.id.includes('_details')) {
      fields.push({ [field.id]: field });
    }
  });
};

const convertSchemaToDefaultComponent = (
  valuePresent: boolean,
  templateComponentsFieldsSchema: GetWhatsappTemplateMessageInput['templateComponentsFields']['schema'],
  templateComponentsFieldsValue: GetWhatsappTemplateMessageInput['templateComponentsFields']['value'],
  buttonType?: string,
) => {
  // For catalog type, return all items regardless of selection
  if (buttonType === 'catalog') {
    const returningFields: Array<Record<string, any>> = [];

    templateComponentsFieldsSchema.forEach((field) => {
      if (field.id.includes('_details')) {
        returningFields.push({ [field.id]: field });
      } else {
        // For catalog, include all product fields (not just selected ones)
        returningFields.push({ [field.id]: field });
      }
    });

    return returningFields;
  }

  if (valuePresent) {
    const returningFields = filterValidValues(templateComponentsFieldsValue);
    addDetailFields(returningFields, templateComponentsFieldsSchema);
    return returningFields;
  }

  return templateComponentsFieldsSchema.map(createDefaultFieldValue);
};

const extractProductFromRawComponents = (rawComponents: ReturnType<typeof convertSchemaToDefaultComponent>, includeDetails: boolean) => {
  return rawComponents.filter((obj) => {
    const key = Object.keys(obj)[0];
    return includeDetails ? key.includes('_details') : (!key.includes('_details') && !key.includes(INPUT_IDENTIFIER));
  })
}

const createInputMap = (rawComponents: Array<Record<string, any>>) => {
  const inputValues = rawComponents.filter((obj) =>
    Object.keys(obj)[0].includes(INPUT_IDENTIFIER)
  );
  return Object.assign({}, ...inputValues);
};

const createTextComponents = (
  nonButtonComponents: Array<WhatsappTemplateComponentField>,
  inputMap: Record<string, string>,
) => {
  const components: any[] = [];
  for (const component of nonButtonComponents) {
    if (!component.text) continue;

    const parameterIncluded = /\{\{\d+\}\}/.test(component.text);

    let parameters: any[] = [];

    if (parameterIncluded) {
      // Extract all placeholder indices from the text
      const placeholderMatches = component.text.match(/\{\{(\d+)\}\}/g);
      if (placeholderMatches) {
        // Get unique placeholder indices and sort them
        const uniqueIndices = [...new Set(placeholderMatches.map(match => {
          const indexMatch = match.match(/\{\{(\d+)\}\}/);
          return indexMatch ? indexMatch[1] : null;
        }).filter(Boolean))].sort();

        // Create a parameter for each placeholder
        parameters = uniqueIndices.map(idx => {
          const key = `${INPUT_IDENTIFIER}_${component.type}_${idx}`;
          const replacementValue = inputMap[key] ?? '';
          return {
            type: "text",
            text: replacementValue
          };
        });
      }
    }

    components.push({
      type: component.type,
      format: component.format || undefined,
      text: component.text || undefined,
      parameters: parameters,
    });
  }

  return components;
};

const parseProductDetails = (productDetailsField: any) => {
  const { options } = Object.values(productDetailsField)[0] as Record<string, any>;
  const { value: productDetailsString } = options[0];
  return JSON.parse(productDetailsString as string);
};

// Helper function to get first product detail
const getFirstProductDetail = (productDetails: Array<Record<string, any>>) => {
  if (productDetails.length === 0) return null;
  return parseProductDetails(productDetails[0]);
};

const mapProductsWithDetails = (
  productsWithoutDetails: Array<Record<string, any>>,
  productDetails: Array<Record<string, any>>
) => {
  return productsWithoutDetails.map((product) => {
    const key = Object.keys(product)[0];
    const mappedProduct = productDetails.find((detail) =>
      Object.keys(detail)[0] === `${key}_details`
    );

    if (!mappedProduct) return null;

    const { options } = Object.values(mappedProduct)[0] as any;
    if (!options) return null;

    const productDetail = parseProductDetails(mappedProduct);
    return {
      ...productDetail,
      product_retailer_id: productDetail.retailer_id,
    };
  }).filter(Boolean);
};

const createMpmButtonComponent = (
  buttonComponent: any,
  rawComponents: Array<Record<string, any>>,
) => {
  const mpmProductsWithoutDetails = extractProductFromRawComponents(rawComponents, false);
  const mpmProductDetails = extractProductFromRawComponents(rawComponents, true);

  const hasNotChosenProducts = mpmProductsWithoutDetails.every(obj =>
    Object.values(obj)[0] === false
  );

  if (hasNotChosenProducts) {
    throw new Error('Please select at least one product from the MPM products list.');
  }

  const firstProductDetail = getFirstProductDetail(mpmProductDetails);
  if (!firstProductDetail) return null;

  const productItems = mapProductsWithDetails(mpmProductsWithoutDetails, mpmProductDetails);

  return {
    type: 'buttons',
    buttons: [{
      type: 'mpm',
      text: buttonComponent?.buttons?.[0].text || 'View items',
      parameters: [{
        type: 'action',
        action: {
          thumbnail_product_retailer_id: firstProductDetail.retailer_id,
          thumbnail_product_image_url: firstProductDetail.image_url,
          sections: [{ product_items: productItems }]
        }
      }]
    }],
  };
};

const createCatalogButtonComponent = (
  buttonComponent: any,
  rawComponents: Array<Record<string, any>>
) => {
  const catalogProductsWithoutDetails = extractProductFromRawComponents(rawComponents, false);
  const catalogProductDetails = extractProductFromRawComponents(rawComponents, true);

  const firstProductDetail = getFirstProductDetail(catalogProductDetails);
  if (!firstProductDetail) return null;

  const productItems = mapProductsWithDetails(catalogProductsWithoutDetails, catalogProductDetails);
  return {
    type: 'buttons',
    buttons: [{
      type: 'catalog',
      text: buttonComponent?.buttons?.[0].text || 'View items',
      parameters: [{
        type: 'action',
        action: {
          thumbnail_product_retailer_id: firstProductDetail.retailer_id,
          thumbnail_product_image_url: firstProductDetail.image_url,
          sections: [{ product_items: productItems }]
        }
      }]
    }]
  };
};

const createLinkButtonComponent = (
  buttonComponent: any,
  rawComponents: Array<Record<string, any>>,
) => {
  const buttonComponents = rawComponents.filter((obj) => Object.keys(obj)[0].includes('$input$_buttons'));

  if (!buttonComponents?.length) return null;

  return {
    type: 'buttons',
    buttons: [{
      type: 'url',
      text: buttonComponent?.buttons?.[0]?.text || 'View items',
      url: buttonComponent?.buttons?.[0]?.url || 'https://example.com',
      parameters: buttonComponents.map((obj) => ({
        type: 'text',
        text: Object.values(obj)[0]
      }))
    }],
  };
};

const createQuickReplyButtonComponent = (buttonComponent: any) => {
  const buttons = buttonComponent?.buttons;
  if (!buttons?.length) return null;

  return {
    type: 'buttons',
    buttons: buttons.map((button: Record<string, any>) => ({
      type: button.type,
      text: button.text || 'Choose an option',
    }))
  }
}

const createProductButtonComponent = (
  originalComponents: Array<WhatsappTemplateComponentField>,
  rawComponents: Array<Record<string, any>>,
) => {
  const buttonComponent = originalComponents.find((item) =>
    item.type === 'buttons' && item.buttons?.length
  ) as { type: 'buttons', buttons: any[] } | undefined;

  if (!buttonComponent) return null;

  const buttonType = buttonComponent.buttons?.[0]?.type;

  if (buttonType === 'mpm') {
    return createMpmButtonComponent(buttonComponent, rawComponents);
  }

  if (buttonType === 'catalog') {
    return createCatalogButtonComponent(buttonComponent, rawComponents);
  }

  if (buttonType === 'url') {
    return createLinkButtonComponent(buttonComponent, rawComponents);
  }

  if (buttonType === 'quick_reply') {
    return createQuickReplyButtonComponent(buttonComponent);
  }

  return null;
};

const getFilenameFromUrl = (url: string, format: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();

    if (filename && filename.includes('.')) {
      return filename;
    }

    // Fallback filename based on format
    const extensions = {
      'video': 'mp4',
      'image': 'jpg',
      'document': 'pdf'
    };
    return `media.${extensions[format as keyof typeof extensions] || 'bin'}`;
  } catch {
    const extensions = {
      'video': 'mp4',
      'image': 'jpg',
      'document': 'pdf'
    };
    return `media.${extensions[format as keyof typeof extensions] || 'bin'}`;
  }
};

const createMediaComponents = (
  originalComponents: Array<WhatsappTemplateComponentField>,
  rawComponents: Array<Record<string, any>>,
) => {
  const mediaFormats = ['image', 'document', 'video'];
  const mediaComponents = originalComponents.filter((item) => item.format && mediaFormats.includes(item.format))
  const result = []

  // Create a map from rawComponents for easier lookup
  const inputMap: Record<string, string> = {};
  for (const rawComponent of rawComponents) {
    Object.assign(inputMap, rawComponent);
  }

  for (const component of mediaComponents) {
    if (!component.format) continue;

    const inputKey = `$input$_${component.format}`;
    const mediaUrl = inputMap[inputKey];

    let parameters: any[] = [];

    if (mediaUrl) {
      // Extract filename from URL (fallback to generic name if not extractable)

      const filename = getFilenameFromUrl(mediaUrl, component.format);

      if (component.format === 'video') {
        parameters.push({
          type: "video",
          video: {
            link: mediaUrl,
            filename: filename,
            caption: ""
          }
        });
      } else if (component.format === 'image') {
        parameters.push({
          type: "image",
          image: {
            link: mediaUrl,
            filename: filename,
            caption: ""
          }
        });
      } else if (component.format === 'document') {
        parameters.push({
          type: "document",
          document: {
            link: mediaUrl,
            filename: filename,
            caption: ""
          }
        });
      }

      result.push({
        type: component.type,
        format: component.format,
        text: component.text || undefined,
        example: component.example || undefined,
        parameters: parameters,
      })
    }
  }

  return result;
}

const getWhatsappTemplateMessage = (input: GetWhatsappTemplateMessageInput) => {
  const {
    messageType,
    templateComponentsFields,
    templateDetails,
  } = input;

  const originalComponents: Array<WhatsappTemplateComponentField> = typeof templateDetails.components === 'string' ?
    JSON.parse(templateDetails.components) :
    templateDetails.components;

  const buttonComponent = originalComponents.find((item) =>
    item.type === 'buttons' && item.buttons?.length
  ) as { type: 'buttons', buttons: any[] } | undefined;

  const buttonType = buttonComponent?.buttons?.[0]?.type;

  // Convert schema to components
  const valuePresent = templateComponentsFields?.value &&
    Object.keys(templateComponentsFields.value).length > 0;

  const rawComponents = convertSchemaToDefaultComponent(
    valuePresent,
    templateComponentsFields.schema,
    templateComponentsFields.value,
    buttonType,
  );

  const nonButtonComponents: Array<WhatsappTemplateComponentField> = originalComponents.filter((item) => item.type !== 'buttons');

  const inputMap = createInputMap(rawComponents);
  const resultingComponents = createTextComponents(nonButtonComponents, inputMap);

  const hasProductsOrButton = templateDetails.catalogProducts.length > 0 || buttonComponent !== undefined;
  if (hasProductsOrButton) {
    const productButtonComponent = createProductButtonComponent(originalComponents, rawComponents);
    if (productButtonComponent) {
      resultingComponents.push(productButtonComponent);
    }
  }

  const mediaComponents = createMediaComponents(originalComponents, rawComponents);

  resultingComponents.push(...mediaComponents)

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
    const { attachmentType, attachmentUrl } = rest as AttachmentInputData;
    requestBody.message = {
      type: messageType,
      attachment: {
        type: attachmentType,
        url: attachmentUrl
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
    } = rest as WhatsappTemplateInputData;

    requestBody.message = getWhatsappTemplateMessage({
      messageType,
      templateComponentsFields,
      templateDetails,
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
          { name: '', value: '' },
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
          { name: '', value: '' },
          { name: 'Text', value: 'text' },
          { name: 'Attachments', value: 'attachment' },
          { name: 'Quick Reply', value: 'quick_reply' },
          { name: 'Custom Payload', value: 'custom_payload' },
          { name: 'WhatsApp Template', value: 'whatsapp_template' },
          { name: 'Email', value: 'email' },
        ],
        required: true,
        description: 'Select the channel type to send the message',
        default: 'text',
        displayOptions: {
          show: {
            channelType: ['specificChannel']
          }
        }
      },
      {
        displayName: 'Message Type',
        name: 'messageType',
        type: 'options',
        options: [
          { name: '', value: '' },
          { name: 'Text', value: 'text' },
          { name: 'Attachments', value: 'attachment' },
          { name: 'Quick Reply', value: 'quick_reply' },
          { name: 'Email', value: 'email' },
        ],
        required: true,
        description: 'Select the channel type to send the message',
        default: 'text',
        displayOptions: {
          show: {
            channelType: ['lastInteractedChannel']
          }
        }
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
