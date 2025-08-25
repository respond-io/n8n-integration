import {
  INodeType,
  INodeTypeDescription,
  IWebhookFunctions,
  IHookFunctions,
  IWebhookResponseData,
  NodeConnectionType,
  NodeOperationError,
  IWorkflowMetadata,
  INodeTypeBaseDescription,
} from 'n8n-workflow';
import { INTEGRATION_API_BASE_URL, TRIGGER_SETTINGS } from '../constants';
import { loadOptions } from '../classMethods';

export class RespondioTriggerV1 implements INodeType {
  description: INodeTypeDescription;
  webhookMethods: INodeType['webhookMethods']
  static triggerEventTypeName = 'triggerEventType'
  static eventSourceTypeName = 'eventSource'
  static triggerDefaultValue = TRIGGER_SETTINGS.NEW_INCOMING_MESSAGE.value;
  static messageTypeName = 'messageType';

  static contactFieldTypeName = 'contactFieldType';
  static contactFieldsName = 'contactFields';

  constructor(baseDescription: INodeTypeBaseDescription) {
    this.description = {
      ...baseDescription,
      version: 1,
      defaults: {
        name: 'Respond.io Trigger',
      },
      inputs: [],
      outputs: [NodeConnectionType.Main],
      credentials: [
        {
          name: 'respondIoApi',
          required: true,
        },
      ],
      webhooks: [
        {
          name: 'default',
          httpMethod: 'POST',
          responseMode: 'onReceived',
          path: 'respondio',
        },
      ],
      properties: [
        {
          displayName: 'Trigger on',
          name: RespondioTriggerV1.triggerEventTypeName,
          type: 'options',
          options: [
            TRIGGER_SETTINGS.CONTACT_ASSIGNEE_UPDATED,
            TRIGGER_SETTINGS.NEW_INCOMING_MESSAGE,
            TRIGGER_SETTINGS.NEW_OUTGOING_MESSAGE,
            TRIGGER_SETTINGS.NEW_COMMENT,
            TRIGGER_SETTINGS.CONVERSATION_CLOSED,
            TRIGGER_SETTINGS.CONVERSATION_OPENED,
            TRIGGER_SETTINGS.NEW_CONTACT,
            TRIGGER_SETTINGS.CONTACT_UPDATED,
            TRIGGER_SETTINGS.CONTACT_TAG_UPDATED,
            TRIGGER_SETTINGS.CONTACT_LIFECYCLE_UPDATED,
          ],
          default: RespondioTriggerV1.triggerDefaultValue,
          required: true
        },
        {
          displayName: 'Event Source',
          name: RespondioTriggerV1.eventSourceTypeName,
          type: 'multiOptions',
          displayOptions: {
            show: {
              [RespondioTriggerV1.triggerEventTypeName]: [
                TRIGGER_SETTINGS.CONVERSATION_CLOSED.value,
                TRIGGER_SETTINGS.CONVERSATION_OPENED.value,
                TRIGGER_SETTINGS.NEW_OUTGOING_MESSAGE.value,
              ],
            }
          },
          typeOptions: {
            loadOptionsMethod: 'getEventSources',
            loadOptionsDependsOn: [RespondioTriggerV1.triggerEventTypeName],
          },
          default: undefined
        },
        {
          displayName: 'Message Type',
          name: RespondioTriggerV1.messageTypeName,
          default: [],
          type: 'multiOptions',
          options: [
            { name: 'Text', value: 'text' },
            { name: 'Attachment', value: 'attachment' },
            { name: 'Story Reply', value: 'story_reply' },
            { name: 'Location', value: 'location' },
            { name: 'Email', value: 'email' },
            { name: 'Un Supported', value: 'unsupported' },
            { name: 'Product Message', value: 'whatsapp_interactive' }
          ],
          displayOptions: {
            show: {
              [RespondioTriggerV1.triggerEventTypeName]: [
                TRIGGER_SETTINGS.NEW_INCOMING_MESSAGE.value,
              ]
            }
          },
        },
        {
          displayName: 'Message Type',
          name: RespondioTriggerV1.messageTypeName,
          default: [],
          required: true,
          type: 'multiOptions',
          options: [
            { name: 'Text', value: 'text' },
            { name: 'Attachment', value: 'attachment' },
            { name: 'Quick Reply', value: 'quick_reply' },
            { name: 'Custom Payload', value: 'custom_payload' },
            { name: 'WhatsApp Template', value: 'whatsapp_template' },
            { name: 'Location', value: 'location' },
            { name: 'Email', value: 'email' },
            { name: 'Card', value: 'card' },
            { name: 'Rating', value: 'rating' },
            { name: 'Product Message', value: 'whatsapp_interactive' },
          ],
          displayOptions: {
            show: {
              [RespondioTriggerV1.triggerEventTypeName]: [
                TRIGGER_SETTINGS.NEW_OUTGOING_MESSAGE.value,
              ]
            }
          },
        },
        {
          displayName: 'Contact Field Type',
          name: RespondioTriggerV1.contactFieldTypeName,
          default: '',
          type: 'options',
          required: true,
          options: [
            { name: '', value: '' },
            { name: 'Contact Standard Field', value: 'standard_field' },
            { name: 'Contact Custom Field', value: 'custom_field' },
          ],
          displayOptions: {
            show: {
              [RespondioTriggerV1.triggerEventTypeName]: [
                TRIGGER_SETTINGS.CONTACT_UPDATED.value,
              ]
            }
          },
        },
        {
          displayName: 'Select Contact Fields',
          name: RespondioTriggerV1.contactFieldsName,
          default: [],
          type: 'multiOptions',
          required: true,
          typeOptions: {
            loadOptionsMethod: 'getContactFields',
            loadOptionsDependsOn: [RespondioTriggerV1.contactFieldTypeName],
          },
          displayOptions: {
            show: {
              [RespondioTriggerV1.triggerEventTypeName]: [TRIGGER_SETTINGS.CONTACT_UPDATED.value],
              [RespondioTriggerV1.contactFieldTypeName]: [{ _cnd: { exists: true } }]
            }
          },
        },
      ],
    };

    this.webhookMethods = {
      default: {
        async create(this: IHookFunctions): Promise<boolean> {
          const credentials = await this.getCredentials('respondIoApi');
          const webhookUrl = this.getNodeWebhookUrl('default');
          const currentNode = this.getNode();
          const workflow = this.getWorkflow();

          const eventType = this.getNodeParameter(
            RespondioTriggerV1.triggerEventTypeName,
            RespondioTriggerV1.triggerDefaultValue,
          ) as string;
          const eventSources = this.getNodeParameter(RespondioTriggerV1.eventSourceTypeName, []) as string[];
          const messageType = this.getNodeParameter(RespondioTriggerV1.messageTypeName, []) as string[];
          const contactFieldType = this.getNodeParameter(RespondioTriggerV1.contactFieldTypeName, '') as 'standard_field' | 'custom_field' | '';
          const fields = contactFieldType?.length ? this.getNodeParameter(RespondioTriggerV1.contactFieldsName, []) as string[] : [];

          const platformUrl = INTEGRATION_API_BASE_URL;
          const bundle: { source?: string[]; workflowDetails?: IWorkflowMetadata, messageType?: string[]; fields?: string[]; contactFieldType?: 'standard_field' | 'custom_field' } = {}

          if (!webhookUrl) throw new NodeOperationError(this.getNode(), 'Webhook URL is not defined. Please set the webhook URL in the node settings.');

          if (eventSources?.length) bundle.source = eventSources
          if (workflow) bundle.workflowDetails = workflow
          if (messageType?.length) bundle.messageType = messageType;

          if (contactFieldType.length && contactFieldType !== '' && fields.length) {
            bundle.fields = fields;
            bundle.contactFieldType = contactFieldType;
          }

          try {
            await this.helpers.request({
              method: 'POST',
              url: `${platformUrl}/integration/n8n-api/subscribe`,
              headers: {
                Authorization: `Bearer ${credentials.apiKey}`,
              },
              body: {
                webHookName: `${this.getWebhookName()} - ${currentNode.name}`,
                type: eventType,
                url: webhookUrl,
                hookId: currentNode.webhookId,
                bundle,
              },
              json: true,
            });
          } catch (error) {
            this.logger.info(`Error: ${JSON.stringify(error)}`);
            throw new NodeOperationError(this.getNode(), `Failed to create webhook subscription: ${error.message}`);
          }

          return true;
        },

        async delete(this: IHookFunctions): Promise<boolean> {
          const credentials = await this.getCredentials('respondIoApi');
          const currentNode = this.getNode();
          const webhookId = currentNode.webhookId;

          if (!webhookId) return true

          const platformUrl = INTEGRATION_API_BASE_URL;
          try {
            const response = await this.helpers.request({
              method: 'DELETE',
              url: `${platformUrl}/integration/n8n-api/unsubscribe/${webhookId}`,
              headers: {
                Authorization: `Bearer ${credentials.apiKey}`,
              },
            });

            this.logger.info(`Delete response: ${JSON.stringify(response)}`);
          } catch (error) {
            this.logger.info(`Error: ${JSON.stringify(error)}`);
            throw new NodeOperationError(this.getNode(), `Failed to delete webhook subscription: ${error.message}`);
          }

          return true;
        },

        async checkExists(this: IHookFunctions): Promise<boolean> {
          // return false everytime since the delete happens on:
          // 1. workflow executed -> webhookMethods.create -> workflow stop -> webhookMethods.delete
          // 2. workflow activated -> webhookMethods.create -> workflow deactivated -> webhookMethods.delete
          const credentials = await this.getCredentials('respondIoApi');
          const currentNode = this.getNode();
          const webhookId = currentNode.webhookId;

          const platformUrl = INTEGRATION_API_BASE_URL;
          try {
            const response = await this.helpers.request({
              method: 'GET',
              url: `${platformUrl}/integration/n8n-api/webhook/${webhookId}`,
              headers: {
                Authorization: `Bearer ${credentials.apiKey}`,
              },
              json: true
            });

            if (response === '<h3 align=\"center\">404 not Found!</h3>') {
              return false;
            }

            return true;
          } catch (error) {
            this.logger.info(`Error: ${JSON.stringify(error)}`);
            return false;
          }
        },
      },
    };
  }

  methods = { loadOptions };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const req = this.getRequestObject();
    const body = req.body;

    return {
      workflowData: [[{ json: body }]],
    };
  }
}
