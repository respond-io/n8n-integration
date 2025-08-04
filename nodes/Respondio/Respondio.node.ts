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

import { ACTION_SETTINGS, PLATFORM_API_URLS } from './constants';

const abortControllers: Record<string, AbortController> = {};

type getContactResponse = {
  id: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  language: string | null;
  profilePic: string;
  locale: string | null;
  countryCode: string | null;
  status: 'open' | 'closed' | 'done' | 'snoozed' | 'unsnoozed' | null;
  isBlocked: boolean;
  custom_fields: Array<{ name: string; value: string | null }>;
  tags: Array<{ id: string; name: string }>;
  assignee: {
    id: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
  lifecycle: string | null;
  created_at: number | null;
}

type SpaceUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'agent' | 'admin' | 'owner';
  team: string | null;
  restrictions: string[];
}

// @ts-ignore
type GetSpaceUsersResponse = {
  items: SpaceUser[];
  pagination: {
    next?: string;
    previous?: string;
  };
}

type ClosingNote = {
  timestamp: number;
  category: string;
  content: string;
  description: string | null;
}

type GetClosingNotesResponse = {
  items: Array<ClosingNote>;
  pagination: {
    next?: string;
    previous?: string;
  };
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
            url: `${platformUrl}/n8n/contact/${identifierType}:${identifierValue.toString().trim()}`,
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
          const urlObject = new URL(`${platformUrl}/n8n/space/users`);
          urlObject.searchParams.set('limit', limit.toString());
          if (cursor) urlObject.searchParams.set('cursor', cursor);

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
          const urlObject = new URL(`${platformUrl}/space/closing_notes`);
          urlObject.searchParams.set('limit', limit.toString());
          if (cursor) urlObject.searchParams.set('cursor', cursor);

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
        this.logger.info(`Total space users fetched: ${allClosingNotes.length}`);
        return allClosingNotes;
      }
    },
  };

  // async async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> {
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> {
    this.logger.info('Testing')
    const temp = buildDynamicProperties(Respondio.resourceTypeName, Respondio.resourceTypeDefault);
    this.logger.info(JSON.stringify(temp, null, 2));

    return null
  }
}

