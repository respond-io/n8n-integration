import { IExecuteFunctions, INodeExecutionData, INodePropertyOptions, NodeExecutionWithMetadata } from "n8n-workflow";
import { ACTION_NAMES } from "../../constants/actions/action_names";
import { callDeveloperApi, fetchPaginatedOptions } from "../../utils";
import { CustomField } from "../../types";

const actionHandlers = {
  [ACTION_NAMES.GET_ALL_CUSTOM_FIELDS]: async (executionContext: IExecuteFunctions, itemIndex: number) => {
    const limit = executionContext.getNodeParameter('limit', itemIndex, 10) as number;

    const { raw } = await fetchPaginatedOptions<CustomField, INodePropertyOptions>(
      executionContext,
      'respondIoApi',
      '/space/custom_field',
      undefined,
      {
        maxResults: limit,
        includeRaw: true,
        limit: 20,
        includeTransformed: false
      }
    )

    return raw;
  },
  [ACTION_NAMES.FIND_CUSTOM_FIELD]: async (executionContext: IExecuteFunctions, itemIndex: number) => {
    const customFieldId = executionContext.getNodeParameter('customFieldId', itemIndex, undefined) as number;

    return callDeveloperApi<CustomField>(executionContext, {
      method: 'GET',
      path: `/space/custom_field/${customFieldId}`,
    })
  },
  [ACTION_NAMES.CREATE_CUSTOM_FIELD]: async (executionContext: IExecuteFunctions, itemIndex: number) => {
    const name = executionContext.getNodeParameter('name', itemIndex, '') as string;
    const description = executionContext.getNodeParameter('description', itemIndex, '') as string;
    const slug = executionContext.getNodeParameter('slug', itemIndex, '') as string;
    const dataType = executionContext.getNodeParameter('dataType', itemIndex, 'text') as string;
    const allowedValues = executionContext.getNodeParameter('allowedValues', itemIndex, []) as string[];

    const payload = {
      name,
      description,
      dataType,
      allowedValues,
      slug
    }

    return callDeveloperApi<CustomField>(executionContext, {
      method: 'POST',
      path: `/space/custom_field`,
      body: payload
    })
  },
}

const ALLOWED_CONTACT_FIELD_ACTIONS = [
  ACTION_NAMES.GET_ALL_CUSTOM_FIELDS,
  ACTION_NAMES.FIND_CUSTOM_FIELD,
  ACTION_NAMES.CREATE_CUSTOM_FIELD,
] as const;

type VALID_CONTACT_FIELD_ACTIONS = typeof ALLOWED_CONTACT_FIELD_ACTIONS[number];

const execute = async (
  action: VALID_CONTACT_FIELD_ACTIONS,
  executionContext: IExecuteFunctions,
): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> => {
  if (!ALLOWED_CONTACT_FIELD_ACTIONS.includes(action)) return []
  const items = executionContext.getInputData();
  const results: INodeExecutionData[] = [];
  const handler = actionHandlers[action];

  if (!handler) return [[{ json: { message: 'No action executed' }, pairedItem: 0 }]];

  const isSingularAction = [
    ACTION_NAMES.GET_ALL_CUSTOM_FIELDS,
    ACTION_NAMES.CREATE_CUSTOM_FIELD,
  ].includes(action);
  for (let i = 0; i < items.length; i++) {
    if (isSingularAction && i > 0) continue;
    const data = await handler(executionContext, i);

    if (Array.isArray(data)) {
      results.push(
        ...data.map(d => ({
          json: d,
          pairedItem: { item: i },
        }))
      );
    } else {
      results.push({ json: data, pairedItem: { item: i } });
    }
  }

  return [results];
}

export default { execute }
