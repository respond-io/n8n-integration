import { IExecuteFunctions, INodeExecutionData, NodeExecutionWithMetadata } from "n8n-workflow";

import { ACTION_NAMES } from "../../constants/actions/action_names";
import { callDeveloperApi, constructIdentifier, IContactIdentifiers } from "../../utils";
import {
  CustomFieldMapperReturnValue,
  FetchWhatsappTemplateResponse,
  GetMessageResponse,
  SendMessageTypes,
  SendMessageResponse,
} from "../../types";
import { BaseRequestBody, sendMessagePayloadFormatter, SharedInputFields } from "../../constants/actions/messages";

const actionHandlers = {
  [ACTION_NAMES.FIND_MESSAGE]: async (executionContext: IExecuteFunctions, itemIndex: number, identifier: string) => {
    const messageId = executionContext.getNodeParameter('messageId', itemIndex, '') as string;

    const response = await callDeveloperApi<GetMessageResponse>(executionContext, {
      method: 'GET',
      path: `/contact/${identifier}/message/${messageId}`,
    })

    return response;
  },
  [ACTION_NAMES.SEND_MESSAGE]: async (executionContext: IExecuteFunctions, itemIndex: number, identifier: string) => {
    const channelType = executionContext.getNodeParameter('channelType', itemIndex, '') as SharedInputFields['channelType'];
    const channelId = executionContext.getNodeParameter('channelId', itemIndex, '') as number;
    const messageType = executionContext.getNodeParameter('messageType', itemIndex, '') as SendMessageTypes;

    if (!channelId && channelType === 'specificChannel') throw new Error('Channel ID is required to send a message');

    const sendMessagePath = `/contact/${identifier}/message`;
    let payload: BaseRequestBody = {};

    if (messageType === SendMessageTypes.TEXT) {
      const text = executionContext.getNodeParameter('text', itemIndex, '') as string;
      const messageTag = executionContext.getNodeParameter('messageTag', itemIndex, '') as string;
      payload = sendMessagePayloadFormatter({
        messageType,
        channelId,
        channelType,
        text,
        messageTag
      })
    }

    if (messageType === SendMessageTypes.EMAIL) {
      const text = executionContext.getNodeParameter('text', itemIndex, '') as string;
      const subject = executionContext.getNodeParameter('subject', itemIndex, '') as string;
      const cc = executionContext.getNodeParameter('cc', itemIndex, '') as string[];
      const bcc = executionContext.getNodeParameter('bcc', itemIndex, '') as string[];
      const attachmentCollection = executionContext.getNodeParameter('attachmentCollection', itemIndex, []) as { attachments: { type: 'image' | 'video' | 'audio' | 'file'; fileName: string; url: string; }[] };
      const replyToMessageId = executionContext.getNodeParameter('replyToMessageId', itemIndex, '') as string;

      payload = sendMessagePayloadFormatter({
        messageType,
        channelType,
        channelId,
        replyToMessageId,
        cc,
        bcc,
        attachments: attachmentCollection.attachments,
        text,
        subject
      })
    }

    if (messageType === SendMessageTypes.ATTACHMENT) {
      const attachmentType = executionContext.getNodeParameter('attachmentType', itemIndex, '') as 'file' | 'image' | 'video' | 'audio';
      const attachmentUrl = executionContext.getNodeParameter('attachmentUrl', itemIndex, '') as string;

      payload = sendMessagePayloadFormatter({
        messageType,
        channelId,
        channelType,
        attachmentUrl,
        attachmentType
      })
    }

    if (messageType === SendMessageTypes.QUICK_REPLY) {
      const title = executionContext.getNodeParameter('title', itemIndex, '') as string;
      const replies = executionContext.getNodeParameter('replies', itemIndex, []) as string[];

      payload = sendMessagePayloadFormatter({
        messageType,
        channelId,
        channelType,
        title,
        replies,
      })
    }

    if (messageType === SendMessageTypes.CUSTOM_PAYLOAD) {
      const payloadString = executionContext.getNodeParameter('payload', itemIndex, '') as string;

      payload = sendMessagePayloadFormatter({
        messageType,
        channelId,
        channelType,
        payload: payloadString
      })
    }

    if (messageType === SendMessageTypes.WHATSAPP_TEMPLATE) {
      const templateId = executionContext.getNodeParameter('templateId', itemIndex, '') as number;
      const templateComponentsFields = executionContext.getNodeParameter('whatsappTemplateComponentFields', itemIndex, {}) as CustomFieldMapperReturnValue;

      const templateDetails = await callDeveloperApi<FetchWhatsappTemplateResponse>(executionContext, {
        method: 'GET',
        path: `/space/mtm/${templateId}`,
      })

      payload = sendMessagePayloadFormatter({
        messageType,
        channelId,
        channelType,
        templateComponentsFields,
        templateDetails: templateDetails.data,
      })
    }

    if (messageType === SendMessageTypes.FACEBOOK_TEMPLATE) {
      const templateId = executionContext.getNodeParameter('templateId', itemIndex, '') as number;
      const templateComponentsFields = executionContext.getNodeParameter('messengerTemplateComponentFields', itemIndex, {}) as CustomFieldMapperReturnValue;

      const templateDetails = await callDeveloperApi<FetchWhatsappTemplateResponse>(executionContext, {
        method: 'GET',
        path: `/space/mtm/${templateId}`,
      })

      payload = sendMessagePayloadFormatter({
        messageType,
        channelId,
        channelType,
        templateComponentsFields,
        templateDetails: templateDetails.data,
      })
    }

    if (!payload || Object.keys(payload).length === 0) {
      throw new Error(`No payload is constructed for sending message with type of ${messageType}`);
    }

    const response = await callDeveloperApi<SendMessageResponse>(executionContext, {
      method: 'POST',
      path: sendMessagePath,
      body: payload
    })

    return response;
  },
}

const ALLOWED_MESSAGE_ACTIONS = [
  ACTION_NAMES.FIND_MESSAGE,
  ACTION_NAMES.SEND_MESSAGE,
] as const;

type VALID_MESSAGE_ACTIONS = typeof ALLOWED_MESSAGE_ACTIONS[number];

const execute = async (
  action: VALID_MESSAGE_ACTIONS,
  executionContext: IExecuteFunctions,
): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> => {
  if (!ALLOWED_MESSAGE_ACTIONS.includes(action)) return [];
  const items = executionContext.getInputData();
  const results: INodeExecutionData[] = [];
  const handler = actionHandlers[action];

  if (!handler) return [[{ json: { message: 'No action executed' }, pairedItem: 0 }]];

  for (let i = 0; i < items.length; i++) {
    const identifierType = executionContext.getNodeParameter('identifierType', i, '') as IContactIdentifiers;
    const identifier = constructIdentifier(executionContext, i);

    if (identifierType === IContactIdentifiers.id) {
      const contactId = identifier.split(':')[1];
      if (!contactId) throw new Error('Contact ID is required for this action');
    }
    const data = await handler(executionContext, i, identifier);

    if (Array.isArray(data)) {
      results.push(
        ...data.map(d => ({
          json: d,
          pairedItem: { item: i },
        }))
      );
    } else {
      results.push({ json: data, pairedItem: { item: i } });
    }
  }

  return [results];
}

export default { execute }
