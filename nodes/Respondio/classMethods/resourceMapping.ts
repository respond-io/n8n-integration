import { ILoadOptionsFunctions, INodePropertyOptions, ResourceMapperField, ResourceMapperFields } from "n8n-workflow";
import { callDeveloperApi, fetchPaginatedOptions } from "../utils";
import { CustomField, CustomFieldDataTypes, FetchWhatsappTemplateResponse } from "../types";
import _ from 'lodash';
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
    console.error('Error fetching custom fields:', error);
    return {
      fields: [],
    };
  }
}

const emptyParameter = (itemType: string, parameter = 1): ResourceMapperField => ({
  id: `${INPUT_IDENTIFIER}_${itemType}_${parameter}`,
  display: true,
  required: true,
  displayName: `Param {{${parameter}}}`,
  type: 'string',
  defaultMatch: false
});

const createEmptyResourceMapper = (text: string = '', itemType: string = '') => {
  const parameters: ResourceMapperField[] = [];
  const params = text.match(/\{\{.*?\}}|.+?(?=\{{|$)/g) || [];

  /* Ensure params found are unique */
  let paramCount = 1;
  _.uniq(params).forEach((param) => {
    const match = param.match(/{{.*}}/);
    if (match) {
      parameters.push(emptyParameter(itemType, paramCount));
      paramCount = paramCount + 1;
    }
  });
  return parameters;
}

const createTemplateParameters = (template: FetchWhatsappTemplateResponse['data']): ResourceMapperFields => {
  const fields: ResourceMapperField[] = [];

  const templateComponents = typeof template?.components === 'string' ?
    JSON.parse(template.components) :
    template?.components;
  const components = _.cloneDeep(templateComponents || []) || [];

  for (const item of components) {
    if (typeof item === 'object') {
      switch (item.type) {
        case 'body':
          fields.push(...createEmptyResourceMapper(item.text, 'body'));
          break;

        case 'header':
          if (item.format === 'text') {
            fields.push(...createEmptyResourceMapper(item.text, 'header'));
          }

          if (['image', 'document', 'video'].includes(item.format)) {
            fields.push({
              id: `${INPUT_IDENTIFIER}_${item.format}`,
              displayName: `Header ${item.format} link`,
              required: true,
              display: true,
              type: 'string',
              defaultMatch: false,
            });
          }

          if (item.format === 'location') {
            ['latitude', 'longitude', 'name', 'address'].forEach((field) => {
              fields.push({
                id: `${INPUT_IDENTIFIER}_location_${field}`,
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
              fields.push(...createEmptyResourceMapper(button.url, 'buttons'));
            }

            // mpm and catalog types can be handled later in the `catalogProducts` in `getWhatsappTemplateComponentFields`
            // if (button.type === 'mpm') {
            //   fields.push({
            //     id: `${INPUT_IDENTIFIER}_catalog_products`,
            //     displayName: 'Catalog Products',
            //     required: true,
            //     display: true,
            //     type: 'string',
            //     defaultMatch: false,
            //   });
            // }
            // if (button.type === 'catalog') {
            //   fields.push({
            //     id: `${HIDDEN_INPUT_IDENTIFIER}_catalog_products`,
            //     displayName: button.text,
            //     required: true,
            //     display: true,
            //     type: 'string',
            //     defaultMatch: false,
            //   });
            // }
          }
          break;

        case 'footer':
          fields.push(...createEmptyResourceMapper(item.text, 'footer'));
          break;
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
