import { IExecuteFunctions, ILoadOptionsFunctions, INodeExecutionData, INodeProperties, INodePropertyOptions, type INodeType, type INodeTypeDescription, NodeConnectionType, NodeExecutionWithMetadata } from 'n8n-workflow';

import { ACTION_SETTINGS } from './constants';

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

  // comment out first
  // for (const [resource, actions] of Object.entries(ACTION_SETTINGS)) {
  //   for (const action of Object.values(actions)) {
  //     if (action.params) {
  //       for (const param of action.params) {
  //         properties.push({
  //           ...param,
  //           displayOptions: {
  //             show: {
  //               resource: [resource],
  //               action: [action.value],
  //             },
  //           },
  //         });
  //       }
  //     }
  //   }
  // }

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
        this.logger.info(`actionsForResource: ${JSON.stringify(actionsForResource)}`);

        return Object.values(actionsForResource).map(action => ({
          name: action.name,
          value: action.value,
          description: action.description,
        }));
      },
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

