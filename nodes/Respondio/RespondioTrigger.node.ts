import {
  ApplicationError,
  INodeType,
  INodeTypeBaseDescription,
  type VersionedNodeType
} from 'n8n-workflow';

import { RespondioTriggerV1 } from './v1/RespondioTriggerV1.node';

export class RespondioTrigger implements VersionedNodeType {
  currentVersion: number = 1;
  nodeVersions: { [key: number]: INodeType; };
  description: INodeTypeBaseDescription;

  constructor() {
    const baseDescription: INodeTypeBaseDescription = {
      displayName: 'Respond.io Trigger',
      name: 'respondioTrigger',
      icon: 'file:respondio.svg',
      group: ['trigger'],
      defaultVersion: 1,
      description: 'Trigger workflow via Respond.io webhook',
    };

    this.nodeVersions = {
      1: new RespondioTriggerV1(baseDescription),
    };
    this.description = baseDescription
  }

  getLatestVersion(): number {
    return this.currentVersion;
  }

  getNodeType(version: number = 1): INodeType {
    if (version === undefined || version === 1) {
      return this.nodeVersions[version];
    }
    throw new ApplicationError(`Version ${version} not supported for Respondio node`);
  }
}
