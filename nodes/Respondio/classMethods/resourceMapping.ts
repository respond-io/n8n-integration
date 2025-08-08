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

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getTemplateParametersLabel(inputPlaceHolder: string): string {
  let labelName = '';
  ['image', 'document', 'video'].forEach(v => {
    if (inputPlaceHolder.includes(v)) {
      labelName = `Header ${v} link`;
    }
  });

  ['longitude', 'latitude', 'name', 'address'].forEach((v) => {
    if (inputPlaceHolder.includes(v)) {
      const parts = inputPlaceHolder.split('_');
      labelName = `${capitalizeFirstLetter(parts[1])} ${capitalizeFirstLetter(parts[2])}`;
    }
  });

  if (labelName) return labelName;
  if (inputPlaceHolder.includes('buttons')) return 'Buttons url';
  if (inputPlaceHolder.includes('products')) return 'Products';

  const parts = inputPlaceHolder.split('_');
  if (parts.length !== 3) return inputPlaceHolder;
  return `${capitalizeFirstLetter(parts[1])} {{${parts[2]}}}`;
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

  const components = _.cloneDeep(template?.components || []) || [];

  for (const item of components) {
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

          if (button.type === 'mpm') {
            fields.push({
              id: `${INPUT_IDENTIFIER}_catalog_products`,
              displayName: 'Catalog Products',
              required: true,
              display: true,
              type: 'string',
              defaultMatch: false,
            });
          }

          if (button.type === 'catalog') {
            fields.push({
              id: `${HIDDEN_INPUT_IDENTIFIER}_catalog_products`,
              displayName: '',
              required: true,
              display: false,
              type: 'string',
              defaultMatch: false,
            });
          }
        }
        break;

      case 'footer':
        fields.push(...createEmptyResourceMapper(item.text, 'footer'));
        break;
    }
  }

  return { fields };
}

export async function getWhatsappTemplateComponentFields(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
  this.logger.info('getting whatsapp template component fields...');
  const templateId = this.getNodeParameter('templateId', 0) as number;

  const response = await callDeveloperApi<FetchWhatsappTemplateResponse>(this, {
    method: 'GET',
    path: `/space/mtm/${templateId}`,
  })

  if (!response?.data?.id) return { fields: [] };

  const { data: template } = response;

  let { fields } = createTemplateParameters(template)
  this.logger.info(`Template ${templateId} has ${JSON.stringify(fields)} components.`);

  fields = fields.map((field) => {
    // Add product choices if catalog products
    if (field.id.includes('catalog_products') && !field.id.includes(HIDDEN_INPUT_IDENTIFIER)) {
      return {
        ...field,
        type: 'options',
        options: template.catalogProducts?.map((product: any) => ({
          name: product.name,
          value: JSON.stringify(product),
        })) || [],
      };
    }

    if (field.id.includes(HIDDEN_INPUT_IDENTIFIER)) {
      return {
        ...field,
        display: false,
        required: true,
      };
    }

    return field;
  });

  // Step 3: Optional "copy/help" preview fields
  const bodyTexts: Record<string, string> = {};
  for (const comp of template.components) {
    if (comp.text && ['header', 'body'].includes(comp.type)) {
      bodyTexts[capitalizeFirstLetter(comp.type)] = comp.text;
    }
  }

  if (fields.length) {
    const extraFields: ResourceMapperField[] = [
      {
        id: 'helpText',
        displayName: 'WhatsApp template required fields',
        required: true,
        display: true,
        type: 'string',
        defaultMatch: false,
      },
    ];

    if (bodyTexts.Header) {
      extraFields.push({
        id: 'templateComponentsHeader',
        displayName: `Header ${bodyTexts.Header}`,
        required: true,
        display: true,
        type: 'string',
        defaultMatch: false,
      });
    }

    if (bodyTexts.Body) {
      extraFields.push({
        id: 'templateComponentsBody',
        displayName: `Body ${bodyTexts.Body}`,
        required: true,
        display: true,
        type: 'string',
        defaultMatch: false,
      });
    }

    fields = [...extraFields, ...fields];


    return { fields }
  }

  return { fields: [] }
}
