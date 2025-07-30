import {
  INodeType,
  INodeTypeDescription,
  IWebhookFunctions,
  IHookFunctions,
  IWebhookResponseData,
  NodeConnectionType,
  ILoadOptionsFunctions,
} from 'n8n-workflow';
import { PLATFORM_API_URLS, TRIGGER_SETTINGS, TRIGGER_SETTINGS_EVENT_SOURCES } from './constants';

export class RespondioTrigger implements INodeType {
  description: INodeTypeDescription;
  webhookMethods: INodeType['webhookMethods']
  static triggerEventTypeName = 'triggerEventType'
  static triggerDefaultValue = TRIGGER_SETTINGS.NEW_INCOMING_MESSAGE.value;

  constructor() {
    this.description = {
      displayName: 'Respond.io Trigger',
      name: 'respondioTrigger',
      icon: 'file:respondio.svg',
      group: ['trigger'],
      version: 1,
      description: 'Trigger workflow via Respond.io webhook',
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
          name: RespondioTrigger.triggerEventTypeName,
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
          default: RespondioTrigger.triggerDefaultValue,
          required: true
        },
        {
          displayName: 'Event Source',
          name: 'eventSource',
          type: 'options',
          displayOptions: {
            show: {
              [RespondioTrigger.triggerEventTypeName]: [
                TRIGGER_SETTINGS.CONVERSATION_CLOSED.value, ,
                TRIGGER_SETTINGS.CONVERSATION_OPENED.value, ,
                TRIGGER_SETTINGS.NEW_OUTGOING_MESSAGE.value, ,
              ],
            }
          },
          typeOptions: {
            loadOptionsMethod: 'getEventSources',
            loadOptionsDependsOn: [RespondioTrigger.triggerEventTypeName],
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

          const eventType = this.getNodeParameter(
            RespondioTrigger.triggerEventTypeName,
            RespondioTrigger.triggerDefaultValue,
          ) as string;
          this.logger.info(`eventType: ${JSON.stringify(eventType)}`)
          const executionEnv = credentials?.environment as 'production' | 'staging' || 'staging';
          const platformUrl = PLATFORM_API_URLS[executionEnv]
          this.logger.info(`platformUrl: ${JSON.stringify(platformUrl)}`)

          const response = await this.helpers.request({
            method: 'POST',
            url: 'https://webhook.site/28126219-0c38-46d7-ac76-742169397987',
            // url: `${platformUrl}/n8n/subscribe`,
            headers: {
              Authorization: `Bearer ${credentials.apiKey}`,
            },
            body: {
              // const { type, url, hookId, bundle: { inputData } } = this.req.body;
              // url: webhookUrl,
              // event: eventType,
              type: eventType,
              url: webhookUrl,
              hookId: currentNode.webhookId,
              bundle: {},
            },
            json: true,
          });

          // Store webhook ID for later cleanup
          this.getWorkflowStaticData('global').respondioWebhookId = response.id;

          return true;
        },

        async delete(this: IHookFunctions): Promise<boolean> {
          const credentials = await this.getCredentials('respondIoApi');
          const staticData = this.getWorkflowStaticData('global');
          const webhookId = staticData.respondioWebhookId;

          if (!webhookId) return true;

          await this.helpers.request({
            method: 'DELETE',
            url: `https://api.respond.io/webhooks/${webhookId}`,
            headers: {
              Authorization: `Bearer ${credentials.apiKey}`,
            },
          });

          return true;
        },

        async checkExists(this: IHookFunctions): Promise<boolean> {
          // return false everytime since the delete happens on:
          // 1. workflow executed -> webhookMethods.create -> workflow stop -> webhookMethods.delete
          // 2. workflow activated -> webhookMethods.create -> workflow deactivated -> webhookMethods.delete
          return false
        },
      },
    };
  }

  methods = {
    loadOptions: {
      async getEventSources(this: ILoadOptionsFunctions) {
        const eventType = this.getNodeParameter(
          RespondioTrigger.triggerEventTypeName,
          RespondioTrigger.triggerDefaultValue,
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

