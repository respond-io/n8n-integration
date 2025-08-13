import {
  ApplicationError,
  INodeType,
  INodeTypeBaseDescription,
  type VersionedNodeType
} from 'n8n-workflow';

import { RespondioV1 } from './v1/RespondioV1.node';

export class Respondio implements VersionedNodeType {
  currentVersion: number = 1;
  nodeVersions: { [key: number]: INodeType; };
  description: INodeTypeBaseDescription;

  constructor() {
    const baseDescription: INodeTypeBaseDescription = {
      displayName: 'Respond.io',
      name: 'respondio',
      icon: 'file:respondio.svg',
      group: ['input'],
      description: 'Read, update, write and delete data from Respond.io',
      defaultVersion: 1,
    };

    this.nodeVersions = {
      1: new RespondioV1(baseDescription),
    };
    this.description = baseDescription
  }

  getLatestVersion(): number {
    return this.currentVersion;
  }

  getNodeType(version?: number): INodeType {
    if (version === undefined || version === 1) {
      return this.nodeVersions[this.currentVersion];
    }
    throw new ApplicationError(`Version ${version} not supported for Respondio node`);
  }
}
