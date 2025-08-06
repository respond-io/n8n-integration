import { ILoadOptionsFunctions, INodePropertyOptions, ResourceMapperField, ResourceMapperFields } from "n8n-workflow";
import { fetchPaginatedOptions } from "../utils";
import { CustomField, CustomFieldDataTypes } from "../types";

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
