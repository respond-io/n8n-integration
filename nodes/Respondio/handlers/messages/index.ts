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

const execute = async (
  action: ACTION_NAMES,
  executionContext: IExecuteFunctions,
): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> => {
  // we only care about FIND_MESSAGE & SEND_MESSAGE for the MESSAGES operation
  const allowedActions = [
    ACTION_NAMES.FIND_MESSAGE,
    ACTION_NAMES.SEND_MESSAGE,
  ]
  if (!allowedActions.includes(action)) return []

  const identifierType = executionContext.getNodeParameter('identifierType', 0, '') as IContactIdentifiers;
  const identifier = constructIdentifier(executionContext);

  if (identifierType === IContactIdentifiers.id) {
    const contactId = identifier.split(':')[1];
    if (!contactId) throw new Error('Contact ID is required for this action');
  }

  if (action === ACTION_NAMES.FIND_MESSAGE) {
    const messageId = executionContext.getNodeParameter('messageId', 0, '') as string;

    const response = await callDeveloperApi<GetMessageResponse>(executionContext, {
      method: 'GET',
      path: `/contact/${identifier}/message/${messageId}`,
    })

    return [[{ json: response }]]
  }

  if (action === ACTION_NAMES.SEND_MESSAGE) {
    const channelType = executionContext.getNodeParameter('channelType', 0, '') as SharedInputFields['channelType'];
    const channelId = executionContext.getNodeParameter('channelId', 0, '') as number;
    const messageType = executionContext.getNodeParameter('messageType', 0, '') as SendMessageTypes;

    if (!channelId) throw new Error('Channel ID is required to send a message');

    const sendMessagePath = `/contact/${identifier}/message`;
    let payload: BaseRequestBody = {};

    if (messageType === SendMessageTypes.TEXT) {
      const text = executionContext.getNodeParameter('text', 0, '') as string;
      const messageTag = executionContext.getNodeParameter('messageTag', 0, '') as string;
      payload = sendMessagePayloadFormatter({
        messageType,
        channelId,
        channelType,
        text,
        messageTag
      })
    }

    if (messageType === SendMessageTypes.EMAIL) {
      const text = executionContext.getNodeParameter('text', 0, '') as string;
      const subject = executionContext.getNodeParameter('subject', 0, '') as string;
      const cc = executionContext.getNodeParameter('cc', 0, '') as string[];
      const bcc = executionContext.getNodeParameter('bcc', 0, '') as string[];
      const attachmentCollection = executionContext.getNodeParameter('attachmentCollection', 0, []) as { attachments: { type: 'image' | 'video' | 'audio' | 'file'; fileName: string; url: string; }[] };
      const replyToMessageId = executionContext.getNodeParameter('replyToMessageId', 0, '') as string;

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
      const attachmentType = executionContext.getNodeParameter('attachmentType', 0, '') as 'file' | 'image' | 'video' | 'audio';
      const attachmentUrl = executionContext.getNodeParameter('attachmentUrl', 0, '') as string;

      payload = sendMessagePayloadFormatter({
        messageType,
        channelId,
        channelType,
        attachmentUrl,
        attachmentType
      })
    }

    if (messageType === SendMessageTypes.QUICK_REPLY) {
      const title = executionContext.getNodeParameter('title', 0, '') as string;
      const replies = executionContext.getNodeParameter('replies', 0, []) as string[];

      payload = sendMessagePayloadFormatter({
        messageType,
        channelId,
        channelType,
        title,
        replies,
      })
    }

    if (messageType === SendMessageTypes.CUSTOM_PAYLOAD) {
      const payloadString = executionContext.getNodeParameter('payload', 0, '') as string;

      payload = sendMessagePayloadFormatter({
        messageType,
        channelId,
        channelType,
        payload: payloadString
      })
    }

    if (messageType === SendMessageTypes.WHATSAPP_TEMPLATE) {
      const templateId = executionContext.getNodeParameter('templateId', 0, '') as number;
      const templateComponentsFields = executionContext.getNodeParameter('whatsappTemplateComponentFields', 0, {}) as CustomFieldMapperReturnValue;

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

    const response = await callDeveloperApi<SendMessageResponse>(executionContext, {
      method: 'POST',
      path: sendMessagePath,
      body: payload
    })

    return [[{ json: response }]]
  }

  return [[{ json: { message: 'Action not handled' } }]]
}

export default { execute }
