import {
  IExecuteFunctions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodeProperties,
  INodePropertyOptions,
  type INodeType,
  type INodeTypeDescription,
  NodeConnectionType,
  NodeExecutionWithMetadata,
} from 'n8n-workflow';
import { setTimeout as waitFor } from 'timers/promises';

import ACTION_NAMES from './constants/actions/action_names'
import { ACTION_SETTINGS, PLATFORM_API_URLS } from './constants';
import {
  GetClosingNotesResponse,
  getContactResponse,
  GetSpaceChannelsResponse,
  GetSpaceUsersResponse,
  GetWhatsAppTemplatesResponse,
  WhatsAppTemplate,
} from './types';

const abortControllers: Record<string, AbortController> = {};

const getWhatsappTemplates = async (context: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> => {
  const credentials = await context.getCredentials('respondIoApi');
  const executionEnv = credentials?.environment as 'production' | 'staging' || 'staging';
  const platformUrl = PLATFORM_API_URLS[executionEnv]

  // n8n does not support paginated fetch, so we have to fetch everything all at once...
  let cursor: string | null = null;
  const allWhatsappTemplates = [] as INodePropertyOptions[];
  const rawWhatsappTemplates = []
  do {
    // make it 10 for now
    let limit = 10;
    const urlObject = new URL(`${platformUrl}/developer-api/space/channel`);
    urlObject.searchParams.set('limit', limit.toString());
    if (cursor) urlObject.searchParams.set('cursorId', cursor);

    const response: GetWhatsAppTemplatesResponse = await context.helpers.request({
      url: urlObject.toString(),
      method: 'GET',
      headers: {
        Authorization: `Bearer ${credentials.apiKey}`,
      },
      json: true
    })

    allWhatsappTemplates.push(
      ...response.items.map((item) => ({
        name: `${item.name} (${item.languageCode})`,
        value: item.id,
        description: `Namespace: ${item.namespace}, Category: ${item.category}, Status: ${item.status}`,
      }))
    );
    rawWhatsappTemplates.push(...response.items)

    cursor = response?.pagination?.next
      ? new URL(response.pagination.next).searchParams.get('cursorId')
      : null;
    await waitFor(500);
  } while (cursor);
  context.logger.info(`Total space channels fetched: ${allWhatsappTemplates.length}`);

  // store the raw templates in global static data for subsequent usage
  const globalData = context.getWorkflowStaticData('global')
  globalData.whatsappTemplates = JSON.stringify(rawWhatsappTemplates);
  return allWhatsappTemplates;
}

function toGenericAbortSignal(signal: AbortSignal) {
  return {
    aborted: signal.aborted,
    onabort: signal.onabort,
    addEventListener: signal.addEventListener.bind(signal),
    removeEventListener: signal.removeEventListener.bind(signal),
  };
}

function buildDynamicProperties(resourceTypeName: string, resourceTypeDefault: string): INodeProperties[] {
  const properties: INodeProperties[] = [];

  // 🔹 Resource selector
  properties.push({
    displayName: 'Resource',
    name: resourceTypeName,
    type: 'options',
    options: Object.keys(ACTION_SETTINGS).map(resource => ({
      name: resource,
      value: resource,
    })),
    default: resourceTypeDefault,
    required: true,
  });

  properties.push({
    displayName: 'Action',
    name: 'action',
    type: 'options',
    typeOptions: {
      loadOptionsMethod: 'getActionsForResource',
      loadOptionsDependsOn: [resourceTypeName],
    },
    default: '',
    required: true,
  });

  for (const [resource, actions] of Object.entries(ACTION_SETTINGS)) {
    for (const action of Object.values(actions)) {
      if (action.params) {
        for (const param of action.params) {
          const mergedDisplayOptions = param.displayOptions
            ? {
              show: {
                ...param.displayOptions.show,
                [resourceTypeName]: [resource],
                action: [action.value],
              },
            }
            : {
              show: {
                [resourceTypeName]: [resource],
                action: [action.value],
              },
            };

          properties.push({
            ...param,
            displayOptions: mergedDisplayOptions,
          });
        }
      }
    }
  }

  return properties;
}

export class Respondio implements INodeType {
  description: INodeTypeDescription;
  static resourceTypeName = 'resource'
  static resourceTypeDefault = Object.keys(ACTION_SETTINGS)[0] || 'CHANNELS'

  constructor() {
    this.description = {
      displayName: 'Respond.io',
      name: 'respondio',
      icon: 'file:respondio.svg',
      group: ['input'],
      description: 'Read, update, write and delete data from Respond.io',
      defaultVersion: 1.0,
      version: 1,
      defaults: {
        name: 'Respond.io Actions',
      },
      inputs: [],
      outputs: [NodeConnectionType.Main],
      credentials: [
        {
          name: 'respondIoApi',
          required: true,
        },
      ],
      properties: buildDynamicProperties(Respondio.resourceTypeName, Respondio.resourceTypeDefault),
    };
  }

  methods = {
    loadOptions: {
      async getActionsForResource(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const resource = this.getNodeParameter('resource', 0) as keyof typeof ACTION_SETTINGS;
        this.logger.info(`resource: ${JSON.stringify(resource)}`);

        // Make sure resource exists
        const actionsForResource = ACTION_SETTINGS[resource] ?? {};
        // this.logger.info(`actionsForResource: ${JSON.stringify(actionsForResource)}`);

        return Object.values(actionsForResource).map(action => ({
          name: action.name,
          value: action.value,
          description: action.description,
        }));
      },
      async getTagsForContact(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const nodeId = this.getNode().id;
        // Abort previous request for this node
        if (abortControllers[nodeId]) {
          abortControllers[nodeId].abort();
        }

        const abortController = new AbortController();
        abortControllers[nodeId] = abortController;

        const credentials = await this.getCredentials('respondIoApi');
        const identifierType = this.getNodeParameter('identifierType', 0) as string;
        const contactId = this.getNodeParameter('contactId', 0) as string;
        const contactIdentifier = this.getNodeParameter('contactIdentifier', 0) as string;

        const identifierValue = identifierType === 'id' ? contactId : contactIdentifier;

        // Skip if no identifier provided yet
        if (!identifierValue) return [];

        const executionEnv = credentials?.environment as 'production' | 'staging' || 'staging';
        const platformUrl = PLATFORM_API_URLS[executionEnv]

        try {
          const response: getContactResponse = await this.helpers.httpRequest({
            method: 'GET',
            url: `${platformUrl}/developer-api/contact/${identifierType}:${identifierValue.toString().trim()}`,
            headers: {
              Authorization: `Bearer ${credentials.apiKey}`,
            },
            json: true,
            abortSignal: toGenericAbortSignal(abortController.signal),
          });

          this.logger.info(`Response from API: [${nodeId}] ${JSON.stringify(response)}`);
          return response.tags.map((tag: any) => ({
            name: tag.name,
            value: tag.id,
          }));
        } catch (error: any) {
          if (error.name === 'AbortError') {
            this.logger.info('Previous request aborted due to new input.');
            return [];
          }

          this.logger.error(`Failed to load tags: ${error.message || error}`);
          return [];
        }
      },
      async getSpaceUsers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('respondIoApi');

        const executionEnv = credentials?.environment as 'production' | 'staging' || 'staging';
        const platformUrl = PLATFORM_API_URLS[executionEnv]

        // n8n does not support paginated fetch, so we have to fetch everything all at once...
        let cursor: string | null = null;
        const allSpaceUsers = [] as INodePropertyOptions[];
        do {
          // make it 10 for now
          let limit = 10;
          const urlObject = new URL(`${platformUrl}/developer-api/space/users`);
          urlObject.searchParams.set('limit', limit.toString());
          if (cursor) urlObject.searchParams.set('cursorId', cursor);

          const response: GetSpaceUsersResponse = await this.helpers.request({
            url: urlObject.toString(),
            method: 'GET',
            headers: {
              Authorization: `Bearer ${credentials.apiKey}`,
            },
            json: true
          })

          allSpaceUsers.push(
            ...response.items.map((user) => ({
              name: `${user.firstName} ${user.lastName} (${user.email})`,
              value: user.id,
            }))
          );

          cursor = response?.pagination?.next
            ? new URL(response.pagination.next).searchParams.get('cursorId')
            : null;
          await waitFor(500);
        } while (cursor);
        this.logger.info(`Total space users fetched: ${allSpaceUsers.length}`);
        return allSpaceUsers;
      },
      async getClosingNotes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('respondIoApi');
        const executionEnv = credentials?.environment as 'production' | 'staging' || 'staging';
        const platformUrl = PLATFORM_API_URLS[executionEnv]

        // n8n does not support paginated fetch, so we have to fetch everything all at once...
        let cursor: string | null = null;
        const allClosingNotes = [] as INodePropertyOptions[];
        do {
          // make it 10 for now
          let limit = 10;
          const urlObject = new URL(`${platformUrl}/developer-api/space/closing_notes`);
          urlObject.searchParams.set('limit', limit.toString());
          if (cursor) urlObject.searchParams.set('cursorId', cursor);

          const response: GetClosingNotesResponse = await this.helpers.request({
            url: urlObject.toString(),
            method: 'GET',
            headers: {
              Authorization: `Bearer ${credentials.apiKey}`,
            },
            json: true
          })

          allClosingNotes.push(
            ...response.items.map((item) => ({
              name: item.category,
              value: item.category,
              description: item.description || item.content,
            }))
          );

          cursor = response?.pagination?.next
            ? new URL(response.pagination.next).searchParams.get('cursorId')
            : null;
          await waitFor(500);
        } while (cursor);
        this.logger.info(`Total closing notes fetched: ${allClosingNotes.length}`);
        return allClosingNotes;
      },
      async getSpaceChannels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('respondIoApi');
        const executionEnv = credentials?.environment as 'production' | 'staging' || 'staging';
        const platformUrl = PLATFORM_API_URLS[executionEnv]

        // n8n does not support paginated fetch, so we have to fetch everything all at once...
        let cursor: string | null = null;
        const allSpaceChannels = [] as INodePropertyOptions[];
        do {
          // make it 10 for now
          let limit = 10;
          const urlObject = new URL(`${platformUrl}/developer-api/space/channel`);
          urlObject.searchParams.set('limit', limit.toString());
          if (cursor) urlObject.searchParams.set('cursorId', cursor);

          const response: GetSpaceChannelsResponse = await this.helpers.request({
            url: urlObject.toString(),
            method: 'GET',
            headers: {
              Authorization: `Bearer ${credentials.apiKey}`,
            },
            json: true
          })

          allSpaceChannels.push(
            ...response.items.map((item) => ({
              name: item.name,
              value: item.id,
              description: `${item.name} - ${item.source}`
            }))
          );

          cursor = response?.pagination?.next
            ? new URL(response.pagination.next).searchParams.get('cursorId')
            : null;
          await waitFor(500);
        } while (cursor);
        this.logger.info(`Total space channels fetched: ${allSpaceChannels.length}`);
        return allSpaceChannels;
      },
      async getWhatsappTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        return getWhatsappTemplates(this);
      },
      async getWhatsappTemplateLanguageCodes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const globalData = this.getWorkflowStaticData('global')

        if (!globalData.whatsappTemplates) {
          await getWhatsappTemplates(this);
          const globalData = this.getWorkflowStaticData('global')
          const whatsappTemplates = globalData.whatsappTemplates ?
            JSON.parse(globalData.whatsappTemplates as string) as Array<WhatsAppTemplate> :
            [];
          if (whatsappTemplates?.length) {
            return whatsappTemplates.map((template: WhatsAppTemplate) => ({
              name: template.languageCode,
              value: template.languageCode,
            }));
          }
        }

        const whatsappTemplates = globalData.whatsappTemplates ?
          JSON.parse(globalData.whatsappTemplates as string) as Array<WhatsAppTemplate> :
          [];

        return whatsappTemplates.map((template: WhatsAppTemplate) => ({
          name: template.languageCode,
          value: template.languageCode,
        }))
      }
    },
  };

  // async async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> {
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> {
    const inputData = this.getInputData()
    this.logger.info(JSON.stringify(inputData, null, 2));

    const operation = this.getNodeParameter(Respondio.resourceTypeName, 0) as string;
    this.logger.info(`Operation: ${operation}`);
    const action = this.getNodeParameter('action', 0) as string;

    switch (action) {
      case ACTION_NAMES.GET_ALL_CHANNELS:
        this.logger.info('Fetching all channels');
        break;
      case ACTION_NAMES.GET_ALL_CLOSING_NOTES:
        this.logger.info('Fetching all closing notes');
        break;
      case ACTION_NAMES.ADD_COMMENT:
        this.logger.info('ADDING comment');
        break;
      case ACTION_NAMES.ADD_SPACE_TAG:
        this.logger.info('ADD SPACE TAG');
        break;
      case ACTION_NAMES.DELETE_SPACE_TAG:
        this.logger.info('Deleting space tag');
        break;
      case ACTION_NAMES.UPDATE_SPACE_TAG:
        this.logger.info('Updating space tag');
        break;
      case ACTION_NAMES.REMOVE_TAGS:
        this.logger.info('Removing tags');
        break;
      case ACTION_NAMES.DELETE_CONTACT:
        this.logger.info('Deleting contact');
        break;
      case ACTION_NAMES.FIND_CONTACT_CHANNELS:
        this.logger.info('Fetching all channels for contact');
        break;
      case ACTION_NAMES.FIND_CONTACT:
        this.logger.info('Fetching contact by identifier');
        break;
      case ACTION_NAMES.ADD_TAGS:
        this.logger.info('Adding tags to contact');
        break;
      case ACTION_NAMES.GET_MANY_CONTACTS:
        this.logger.info('Fetching many contacts');
        break;
      case ACTION_NAMES.UPDATE_CONTACT:
        this.logger.info('Updating contact');
        break;
      case ACTION_NAMES.CREATE_OR_UPDATE_CONTACT:
        this.logger.info('Creating or updating contact');
        break;
      case ACTION_NAMES.CREATE_CONTACT:
        this.logger.info('Creating contact');
        break;
      case ACTION_NAMES.GET_ALL_CUSTOM_FIELDS:
        this.logger.info('Fetching all custom fields');
        break;
      case ACTION_NAMES.FIND_CUSTOM_FIELD:
        this.logger.info('Fetching custom field by name');
        break;
      case ACTION_NAMES.CREATE_CUSTOM_FIELD:
        this.logger.info('Creating custom field');
        break;
      case ACTION_NAMES.ASSIGN_OR_UNASSIGNED_CONVERSATION:
        this.logger.info('Assigning or unassigning conversation');
        break;
      case ACTION_NAMES.OPEN_OR_CLOSE_CONVERSATION:
        this.logger.info('Opening or closing conversation');
        break;
      case ACTION_NAMES.REMOVE_CONTACT_LIFECYCLE:
        this.logger.info('Removing contact lifecycle');
        break;
      case ACTION_NAMES.UPDATE_CONTACT_LIFECYCLE:
        this.logger.info('Updating contact lifecycle');
        break;
      case ACTION_NAMES.FIND_MESSAGE:
        this.logger.info('Fetching message by identifier');
        break;
      case ACTION_NAMES.SEND_MESSAGE:
        this.logger.info('Sending message');
        break;
      case ACTION_NAMES.FIND_USER:
        this.logger.info('Fetching user by identifier');
        break;
      case ACTION_NAMES.GET_ALL_USERS:
        this.logger.info('Fetching all users');
        break;
    }

    return null
  }
}
