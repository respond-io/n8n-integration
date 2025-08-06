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
  ResourceMapperField,
  ResourceMapperFields,
} from 'n8n-workflow';

import ACTION_NAMES from './constants/actions/action_names'
import { ACTION_SETTINGS } from './constants';
import {
  Channel,
  ClosingNote,
  CustomField,
  CustomFieldDataTypes,
  GetContactResponse,
  SpaceUser,
  WhatsAppTemplate,
} from './types';
import handlers from './handlers';
import { callDeveloperApi, constructIdentifier, fetchPaginatedOptions } from './utils';

const abortControllers: Record<string, AbortController> = {};

const getWhatsappTemplates = async (context: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> => {
  const {
    transformed: allWhatsappTemplates,
    raw: rawWhatsappTemplates,
  } = await fetchPaginatedOptions<WhatsAppTemplate, INodePropertyOptions>(
    context,
    'respondIoApi',
    '/space/channel',
    (item) => ({
      name: `${item.name} (${item.languageCode})`,
      value: item.id,
      description: `Namespace: ${item.namespace}, Category: ${item.category}, Status: ${item.status}`,
    }),
    { limit: 20, logLabel: '[WhatsAppTemplate]', includeRaw: true }
  )

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
      inputs: [NodeConnectionType.Main],
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

        const identifier = constructIdentifier(this);

        try {
          const response = await callDeveloperApi<GetContactResponse>(this, {
            method: 'GET',
            path: `/contact/${identifier}`,
            abortSignal: toGenericAbortSignal(abortController.signal),
            useHttpRequestHelper: true
          })

          this.logger.info(`Response from API: [${nodeId}] ${JSON.stringify(response)}`);
          return response.tags.map((tag: any) => ({
            name: tag,
            value: tag,
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
        const { transformed: result } = await fetchPaginatedOptions<SpaceUser, INodePropertyOptions>(
          this,
          'respondIoApi',
          '/space/user',
          (item) => ({
            name: `${item.firstName} ${item.lastName} (${item.email})`,
            value: item.id,
          }),
          { limit: 20, logLabel: '[Space Users]' }
        )
        return result;
      },
      async getClosingNotes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const { transformed: allClosingNotes } = await fetchPaginatedOptions<ClosingNote, INodePropertyOptions>(
          this,
          'respondIoApi',
          '/space/closing_notes',
          (item) => ({
            name: item.category,
            value: item.category,
            description: item.description || item.content,
          }),
          { limit: 20, logLabel: '[Closing Notes]' }
        )
        return allClosingNotes;
      },
      async getSpaceChannels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const { transformed: allSpaceChannels } = await fetchPaginatedOptions<Channel, INodePropertyOptions>(
          this,
          'respondIoApi',
          '/space/channel',
          (item) => ({
            name: item.name,
            value: item.id,
            description: `${item.name} - ${item.source}`,
          }),
          { limit: 20, logLabel: '[Space Channel]' }
        )
        return allSpaceChannels;
      },
      async getWhatsappTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        this.logger.info('Fetching WhatsApp templates');
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
      },
    },
    resourceMapping: {
      async getCustomFields(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
        try {
          const { raw: customFields } = await fetchPaginatedOptions<CustomField, INodePropertyOptions>(
            this,
            'respondIoApi',
            '/space/custom_field',
            undefined,
            {
              includeRaw: true,
              includeTransformed: false,
              limit: 100,
            }
          );
          const typeMap: Record<CustomFieldDataTypes, ResourceMapperField['type']> = {
            [CustomFieldDataTypes.TEXT]: 'string',
            [CustomFieldDataTypes.URL]: 'string',
            [CustomFieldDataTypes.EMAIL]: 'string',
            [CustomFieldDataTypes.TIME]: 'string',
            [CustomFieldDataTypes.NUMBER]: 'number',
            [CustomFieldDataTypes.CHECKBOX]: 'boolean',
            [CustomFieldDataTypes.DATE]: 'dateTime',
            [CustomFieldDataTypes.LIST]: 'options',
          };

          // Convert API response to n8n ResourceMapperField format
          const fields: ResourceMapperField[] = customFields.map((field) => {
            const baseField: ResourceMapperField = {
              id: field.id.toString(),
              displayName: field.name,
              required: false,
              defaultMatch: false,
              display: true,
              type: typeMap[field.dataType] || 'string',
            };

            if (field.dataType === CustomFieldDataTypes.LIST) {
              baseField.options = field.allowedValues?.listValues?.map((value) => ({
                name: value,
                value,
              })) || []
            }

            return baseField
          });

          return { fields }
        } catch (error) {
          console.error('Error fetching custom fields:', error);
          return {
            fields: [],
          };
        }
      },
    },
  };

  // async async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> {
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> {
    const inputData = this.getInputData()
    this.logger.info(JSON.stringify(inputData, null, 2));

    const operation = this.getNodeParameter(Respondio.resourceTypeName, 0) as string;
    this.logger.info(`Operation: ${operation}`);
    const action = this.getNodeParameter('action', 0, ACTION_NAMES.GET_ALL_CHANNELS) as ACTION_NAMES;

    const handler = handlers[operation as keyof typeof handlers];

    if (!action) throw new Error('Action is required');
    if (!handler) throw new Error(`Operation [${operation}] not supported`)

    const results = await handler.execute(action, this)
    return results;
  }
}
