import type { INodeTypeBaseDescription, IVersionedNodeType } from 'n8n-workflow';
import { VersionedNodeType } from 'n8n-workflow';

import { RespondioV1 } from './v1/RespondioV1.node';

export class Respondio extends VersionedNodeType {
	constructor() {
		const baseDescription: INodeTypeBaseDescription = {
			displayName: 'Respond.io',
			name: 'respondio',
			icon: 'file:respondio.svg',
			group: ['input'],
			description: 'Read, update, write and delete data from Respond.io',
			defaultVersion: 1.0,
		};

		const nodeVersions: IVersionedNodeType['nodeVersions'] = {
			1: new RespondioV1(),
		};

		super(nodeVersions, baseDescription);
	}
}

