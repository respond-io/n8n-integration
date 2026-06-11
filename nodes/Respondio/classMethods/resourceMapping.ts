import { ILoadOptionsFunctions, INodePropertyOptions, ResourceMapperField, ResourceMapperFields } from "n8n-workflow";
import { callDeveloperApi, capitalizeFirstLetter, fetchPaginatedOptions } from "../utils";
import { CustomField, CustomFieldDataTypes, FetchWhatsappTemplateResponse } from "../types";

import { HIDDEN_INPUT_IDENTIFIER, INPUT_IDENTIFIER } from "../constants";

export async function getCustomFields(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
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
        id: field?.slug?.toString() || field?.id?.toString(),
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
    return {
      fields: [],
    };
  }
}

const emptyParameter = (itemType: string, parameter = 1): ResourceMapperField => ({
  id: `${INPUT_IDENTIFIER}_${itemType}_${parameter}`,
  display: true,
  required: true,
  displayName: `${capitalizeFirstLetter(itemType)} Param {{${parameter}}}`,
  type: 'string',
  defaultMatch: false
});

const createEmptyResourceMapper = (text: string = '', itemType: string = '') => {
  const parameters: ResourceMapperField[] = [];
  const params = text.match(/\{\{.*?\}}|.+?(?=\{{|$)/g) || [];

  /* Ensure params found are unique */
  let paramCount = 1;
  [...new Set(params)].forEach((param) => {
    const match = param.match(/{{.*}}/);
    if (match) {
      parameters.push(emptyParameter(itemType, paramCount));
      paramCount = paramCount + 1;
    }
  });
  return parameters;
}

const processComponentFields = (
  item: Record<string, any>,
  options: { useImageHeaderExamples?: boolean },
  fieldPrefix?: string,
): ResourceMapperField[] => {
  const fields: ResourceMapperField[] = [];
  const prefix = fieldPrefix ? `${fieldPrefix}_` : '';

  switch (item.type) {
    case 'body':
      fields.push(...createEmptyResourceMapper(item.text, `${prefix}body`));
      break;

    case 'header':
      if (item.format === 'text') {
        fields.push(...createEmptyResourceMapper(item.text, `${prefix}header`));
      }

      if (['image', 'document', 'video'].includes(item.format?.toLowerCase())) {
        const normalizedFormat = item.format.toLowerCase();
        const imageFromExamples = item.examples && item.examples.find((example: any) => example.type === 'image')
        const exampleImageLink = imageFromExamples?.image?.link
          || (Array.isArray(item.example?.header_handle) ? item.example.header_handle[0] : undefined);
        const textExample = item.examples && item.examples.find((example: any) => example.type === 'text')
        const hasParameterizedText = !!item.text && /\{\{\d+\}\}/.test(item.text);

        if (options.useImageHeaderExamples && normalizedFormat === 'image') {
          if (exampleImageLink) {
            fields.push({
              id: `${HIDDEN_INPUT_IDENTIFIER}_${prefix}header_image_details`,
              type: 'options',
              displayName: 'Hidden Header Image',
              display: false,
              required: false,
              defaultMatch: false,
              options: [{ name: 'Value', value: exampleImageLink }],
            });
          }

          if (textExample?.text) {
            fields.push({
              id: `${HIDDEN_INPUT_IDENTIFIER}_${prefix}header_text_details`,
              type: 'options',
              displayName: 'Hidden Header Text',
              display: false,
              required: false,
              defaultMatch: false,
              options: [{ name: 'Value', value: textExample.text }],
            });
          }

          if (hasParameterizedText) {
            fields.push(...createEmptyResourceMapper(item.text, `${prefix}header`));
          }
        } else if (imageFromExamples) {
          fields.push(...createEmptyResourceMapper(item.text, `${prefix}header`))
        } else {
          fields.push({
            id: `${INPUT_IDENTIFIER}_${prefix}${normalizedFormat}`,
            displayName: `${prefix ? `Card ${prefix.replace('carousel_card_', '').replace('_', '')} ` : ''}Header ${normalizedFormat} link`,
            required: true,
            display: true,
            type: 'string',
            defaultMatch: false,
          });
        }
      }

      if (item.format === 'location') {
        ['latitude', 'longitude', 'name', 'address'].forEach((field) => {
          fields.push({
            id: `${INPUT_IDENTIFIER}_${prefix}location_${field}`,
            displayName: `Location (${field})`,
            required: true,
            display: true,
            type: 'string',
            defaultMatch: false,
          })
        })
      }
      break;

    case 'buttons':
      for (const button of item.buttons ?? []) {
        if (button.type === 'url') {
          fields.push(...createEmptyResourceMapper(button.url, `${prefix}buttons`));
        }
      }
      break;

    case 'footer':
      fields.push(...createEmptyResourceMapper(item.text, `${prefix}footer`));
      break;
  }

  return fields;
};

const createTemplateParameters = (
  template: FetchWhatsappTemplateResponse['data'],
  options: { useImageHeaderExamples?: boolean } = {},
): ResourceMapperFields => {
  const fields: ResourceMapperField[] = [];

  const templateComponents = typeof template?.components === 'string' ?
    JSON.parse(template.components) :
    template?.components;
  const components = JSON.parse(JSON.stringify(templateComponents || [])) || [];

  for (const item of components) {
    if (typeof item === 'object') {
      if (item.type === 'carousel' && Array.isArray(item.cards)) {
        for (let cardIndex = 0; cardIndex < item.cards.length; cardIndex++) {
          const card = item.cards[cardIndex];
          for (const cardComponent of card.components || []) {
            fields.push(...processComponentFields(
              cardComponent,
              options,
              `carousel_card_${cardIndex}`,
            ));
          }
        }
      } else {
        fields.push(...processComponentFields(item, options));
      }
    }
  }

  return { fields };
}

export async function getWhatsappTemplateComponentFields(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
  const templateId = this.getNodeParameter('templateId', 0) as number;

  const response = await callDeveloperApi<FetchWhatsappTemplateResponse>(this, {
    method: 'GET',
    path: `/space/mtm/${templateId}`,
  })

  if (!response?.data?.id) return { fields: [] };

  const { data: template } = response;

  const { fields } = createTemplateParameters(template)

  const hasCatalogProducts = template?.catalogProducts?.length > 0;

  if (hasCatalogProducts) {
    for (const [index, product] of template.catalogProducts.entries()) {
      fields.push({
        id: `${HIDDEN_INPUT_IDENTIFIER}_catalog_products_${index}`,
        type: 'boolean',
        displayName: `Include Product (${product.name} - ${product.currency}${product.price})`,
        display: true,
        required: false,
        defaultMatch: false,
      })

      fields.push({
        id: `${HIDDEN_INPUT_IDENTIFIER}_catalog_products_${index}_details`,
        type: 'options',
        displayName: `Hidden Product Details (${product.name})`,
        display: false,
        required: false,
        defaultMatch: false,
        options: [
          { name: 'Value', value: JSON.stringify(product) }
        ]
      })
    }
  }

  return { fields }
}

export async function getMessengerTemplateComponentFields(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
  const templateId = this.getNodeParameter('templateId', 0) as number;

  const response = await callDeveloperApi<FetchWhatsappTemplateResponse>(this, {
    method: 'GET',
    path: `/space/mtm/${templateId}`,
  })

  if (!response?.data?.id) return { fields: [] };

  const { data: template } = response;

  const { fields } = createTemplateParameters(template, { useImageHeaderExamples: true })
  const hasCatalogProducts = template?.catalogProducts?.length > 0;

  if (hasCatalogProducts) {
    for (const [index, product] of template.catalogProducts.entries()) {
      fields.push({
        id: `${HIDDEN_INPUT_IDENTIFIER}_catalog_products_${index}`,
        type: 'boolean',
        displayName: `Include Product (${product.name} - ${product.currency}${product.price})`,
        display: true,
        required: false,
        defaultMatch: false,
      })

      fields.push({
        id: `${HIDDEN_INPUT_IDENTIFIER}_catalog_products_${index}_details`,
        type: 'options',
        displayName: `Hidden Product Details (${product.name})`,
        display: false,
        required: false,
        defaultMatch: false,
        options: [
          { name: 'Value', value: JSON.stringify(product) }
        ]
      })
    }
  }

  return { fields }
}
