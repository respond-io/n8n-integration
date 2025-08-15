import { ILoadOptionsFunctions, INodePropertyOptions } from "n8n-workflow";
import { callDeveloperApi, capitalizeFirstLetter, constructIdentifier, fetchPaginatedOptions, getWhatsappTemplatesFunction } from "../utils";
import {
  Channel,
  ClosingNote,
  CustomField,
  FetchWhatsappTemplateResponse,
  GetContactResponse,
  SpaceUser,
} from "../types";
import { TRIGGER_SETTINGS, TRIGGER_SETTINGS_EVENT_SOURCES } from "../constants";

const abortControllers: Record<string, AbortController> = {};

function toGenericAbortSignal(signal: AbortSignal) {
  return {
    aborted: signal.aborted,
    onabort: signal.onabort,
    addEventListener: signal.addEventListener.bind(signal),
    removeEventListener: signal.removeEventListener.bind(signal),
  };
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
    { limit: 20 }
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
    { limit: 20 }
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
    { limit: 20 }
  )
  return allSpaceChannels;
}

export async function getWhatsappTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  return getWhatsappTemplatesFunction(this);
}

export async function getWhatsappTemplateLanguageCodes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const templateId = this.getNodeParameter('templateId', 0) as string;

  if (!templateId) throw new Error('Template Id not provided');

  const template = await callDeveloperApi<FetchWhatsappTemplateResponse>(this, {
    method: 'GET',
    path: `/space/mtm/${templateId}`,
  })

  return [{ name: template.data.languageCode, value: template.data.languageCode }];
}

export async function getTemplatePreviewOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const templateId = this.getNodeParameter('templateId', 0) as number;

  if (!templateId) return [];

  const response = await callDeveloperApi<FetchWhatsappTemplateResponse>(this, {
    method: 'GET',
    path: `/space/mtm/${templateId}`,
  });

  if (!response?.data?.id) return [];

  const { data: template } = response;
  const options: INodePropertyOptions[] = [];
  const templateComponents = (typeof template?.components === 'string' ?
    JSON.parse(template.components) :
    template?.components) || [];

  for (const comp of templateComponents) {
    if (typeof comp === 'object' && comp.text && ['header', 'body', 'footer'].includes(comp.type)) {
      options.push({
        name: `${capitalizeFirstLetter(comp.type)}: ${comp.text}`,
        value: comp.type,
      });
    }
  }

  if (template.catalogProducts && template.catalogProducts.length > 0) {
    template.catalogProducts.forEach((product) => {
      options.push({
        name: `Product: ${product.name} (${product.currency}${product.price} - ${product.availability})`,
        value: product.id,
        description: `Description: ${product.description}`
      })
    })
  }

  return options;
}

export async function getContactFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const fieldType = this.getNodeParameter('contactFieldType', 'standardField') as 'standardField' | 'customField';

  if (fieldType === 'standardField') {
    const standardFields = {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      lang: 'Language',
      profilePic: 'Profile Picture',
      countryCode: 'Country Code',
    }
    return Object.entries(standardFields).map(([value, name]) => ({
      name,
      value
    }))
  }

  const { transformed: results } = await fetchPaginatedOptions<CustomField, INodePropertyOptions>(
    this,
    'respondIoApi',
    '/space/custom_field',
    (item) => ({
      name: item.name,
      value: item.id,
      description: item.description || '',
    }),
    {
      includeRaw: false,
      limit: 100,
      includeTransformed: true
    }
  )

  return results;
}

export async function getEventSources(this: ILoadOptionsFunctions) {
  const eventType = this.getNodeParameter(
    'triggerEventType',
    TRIGGER_SETTINGS.NEW_INCOMING_MESSAGE.value,
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
}
