import {
  INodeType,
  INodeTypeDescription,
  IWebhookFunctions,
  IHookFunctions,
  IWebhookResponseData,
  NodeConnectionType,
  ILoadOptionsFunctions,
  NodeOperationError,
  IWorkflowMetadata,
  INodeTypeBaseDescription,
} from 'n8n-workflow';
import { INTEGRATION_API_BASE_URL, TRIGGER_SETTINGS, TRIGGER_SETTINGS_EVENT_SOURCES } from '../constants';

export class RespondioTriggerV1 implements INodeType {
  description: INodeTypeDescription;
  webhookMethods: INodeType['webhookMethods']
  static triggerEventTypeName = 'triggerEventType'
  static eventSourceTypeName = 'eventSource'
  static triggerDefaultValue = TRIGGER_SETTINGS.NEW_INCOMING_MESSAGE.value;

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
        }
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

          const platformUrl = INTEGRATION_API_BASE_URL;
          const bundle: { sources?: string[]; workflowDetails?: IWorkflowMetadata } = {}

          if (eventSources?.length) bundle.sources = eventSources
          if (workflow) bundle.workflowDetails = workflow

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

          if (!webhookId) return true;

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
          return false;
        },
      },
    };
  }

  methods = {
    loadOptions: {
      async getEventSources(this: ILoadOptionsFunctions) {
        const eventType = this.getNodeParameter(
          RespondioTriggerV1.triggerEventTypeName,
          RespondioTriggerV1.triggerDefaultValue,
        ) as string;

        if (eventType === TRIGGER_SETTINGS.CONVERSATION_CLOSED.value) {
          return TRIGGER_SETTINGS_EVENT_SOURCES.CONVERSATION_CLOSED;
        }
        if (eventType === TRIGGER_SETTINGS.CONVERSATION_OPENED.value) {
          return TRIGGER_SETTINGS_EVENT_SOURCES.CONVERSATION_OPENED;
        }
        if (eventType === TRIGGER_SETTINGS.NEW_OUTGOING_MESSAGE.value) {
          return TRIGGER_SETTINGS_EVENT_SOURCES.NEW_OUTGOING_MESSAGE;
        }

        // default: no options
        return [];
      },
    },
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const req = this.getRequestObject();
    const body = req.body;

    return {
      workflowData: [[{ json: body }]],
    };
  }
}
