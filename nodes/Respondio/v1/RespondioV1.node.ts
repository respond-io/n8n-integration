import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
  type INodeType,
  INodeTypeBaseDescription,
  type INodeTypeDescription,
  NodeConnectionType,
  NodeExecutionWithMetadata,
} from 'n8n-workflow';

import ACTION_NAMES from './../constants/actions/action_names'
import { ACTION_SETTINGS } from '../constants';
import handlers from '../handlers';
import { loadOptions, resourceMapping } from '../classMethods';
import { GenericActionHandler } from '../types';

function buildDynamicProperties(resourceTypeName: string, resourceTypeDefault: string): INodeProperties[] {
  const properties: INodeProperties[] = [];

  // 🔹 Resource selector
  properties.push({
    displayName: 'Resource',
    name: resourceTypeName,
    type: 'options',
    noDataExpression: true,
    options: Object.keys(ACTION_SETTINGS).map((resource) => {
      const resourceName = resource
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

      return {
        name: resourceName,
        value: resource,
      }
    }),
    default: resourceTypeDefault,
    required: true,
  });


  for (const [resource, actions] of Object.entries(ACTION_SETTINGS)) {
    properties.push({
      displayName: 'Operations',
      name: 'operation',
      type: 'options',
      noDataExpression: true,
      displayOptions: { show: { resource: [resource] } },
      options: Object.values(actions).map(action => ({
        name: action.name,
        value: action.value,
        description: action.description,
        action: action.name,
      })),
      default: Object.values(actions)[0]?.value || '',
      required: true,
    });
  }

  // Add parameter properties for each resource/operation combination
  for (const [resource, actions] of Object.entries(ACTION_SETTINGS)) {
    for (const action of Object.values(actions)) {
      if (action.params) {
        for (const param of action.params) {
          const mergedDisplayOptions = param.displayOptions
            ? {
              show: {
                ...param.displayOptions.show,
                resource: [resource],
                operation: [action.value],
              },
            }
            : {
              show: {
                resource: [resource],
                operation: [action.value],
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

export class RespondioV1 implements INodeType {
  description: INodeTypeDescription;
  static resourceTypeName = 'resource'
  static resourceTypeDefault = Object.keys(ACTION_SETTINGS)[0] || 'CHANNELS'

  constructor(baseDescription: INodeTypeBaseDescription) {
    this.description = {
      ...baseDescription,
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
      properties: buildDynamicProperties(RespondioV1.resourceTypeName, RespondioV1.resourceTypeDefault),
      version: 1,
      usableAsTool: true
    };
  }

  methods = { loadOptions, resourceMapping }

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> {
    const operation = this.getNodeParameter(RespondioV1.resourceTypeName, 0) as string;
    const action = this.getNodeParameter('operation', 0, ACTION_NAMES.GET_ALL_CHANNELS) as ACTION_NAMES;

    const handler = handlers[operation as keyof typeof handlers];

    if (!action) throw new Error('Action is required');
    if (!handler) throw new Error(`Operation [${operation}] not supported`)

    const results = await (handler as GenericActionHandler).execute(action, this);
    return results;
  }
}
