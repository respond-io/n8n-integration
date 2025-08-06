import { ILoadOptionsFunctions, INodePropertyOptions } from "n8n-workflow";
import { ACTION_SETTINGS } from "../constants";
import { callDeveloperApi, constructIdentifier, fetchPaginatedOptions } from "../utils";
import { Channel, ClosingNote, GetContactResponse, SpaceUser, WhatsAppTemplate } from "../types";

const abortControllers: Record<string, AbortController> = {};

function toGenericAbortSignal(signal: AbortSignal) {
  return {
    aborted: signal.aborted,
    onabort: signal.onabort,
    addEventListener: signal.addEventListener.bind(signal),
    removeEventListener: signal.removeEventListener.bind(signal),
  };
}

const getWhatsappTemplatesFunction = async (context: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> => {
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

export async function getActionsForResource(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
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
}
export async function getTagsForContact(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
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
}

export async function getSpaceUsers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
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
}

export async function getClosingNotes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
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
}

export async function getSpaceChannels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
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
}

export async function getWhatsappTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  return getWhatsappTemplatesFunction(this);
}

export async function getWhatsappTemplateLanguageCodes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const globalData = this.getWorkflowStaticData('global')

  if (!globalData.whatsappTemplates) {
    await getWhatsappTemplatesFunction(this);
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
