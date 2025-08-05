import { IExecuteFunctions, INodeExecutionData, INodePropertyOptions, NodeExecutionWithMetadata } from "n8n-workflow";
import { ACTION_NAMES } from "../../constants/actions/action_names";
import { callDeveloperApi, fetchPaginatedOptions } from "../../utils";
import { CustomField } from "../../types";

const execute = async (
  action: ACTION_NAMES,
  executionContext: IExecuteFunctions,
): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> => {
  // we only care about GET_ALL_CUSTOM_FIELDS, FIND_CUSTOM_FIELD, CREATE_CUSTOM_FIELD for the CUSTOM_FIELDS operation
  const allowedActions = [
    ACTION_NAMES.GET_ALL_CUSTOM_FIELDS,
    ACTION_NAMES.FIND_CUSTOM_FIELD,
    ACTION_NAMES.CREATE_CUSTOM_FIELD,
  ]
  if (!allowedActions.includes(action)) return []

  if (action === ACTION_NAMES.GET_ALL_CUSTOM_FIELDS) {
    const limit = executionContext.getNodeParameter('limit', 0, 10) as number;

    const { raw } = await fetchPaginatedOptions<CustomField, INodePropertyOptions>(
      executionContext,
      'respondIoApi',
      '/space/custom_field',
      undefined,
      {
        maxResults: limit,
        logLabel: '[Action - Custom Field]',
        includeRaw: true,
        limit: 20,
        includeTransformed: false
      }
    )

    const returnData = raw.map((item) => ({ json: item }));
    return [returnData]
  }

  if (action === ACTION_NAMES.FIND_CUSTOM_FIELD) {
    const customFieldId = executionContext.getNodeParameter('customFieldId', 0, undefined) as number;

    const response = await callDeveloperApi<CustomField>(executionContext, {
      method: 'GET',
      path: `/space/custom_field/${customFieldId}`,
    })

    return [[{ json: response }]];
  }

  const name = executionContext.getNodeParameter('name', 0, '') as string;
  const description = executionContext.getNodeParameter('description', 0, '') as string;
  const slug = executionContext.getNodeParameter('slug', 0, '') as string;
  const dataType = executionContext.getNodeParameter('dataType', 0, 'text') as string;
  const allowedValues = executionContext.getNodeParameter('allowedValues', 0, []) as string[];

  const payload = {
    name,
    description,
    dataType,
    allowedValues,
    slug
  }
  executionContext.logger.info(`Payload used: ${JSON.stringify(payload)}`)

  const response = await callDeveloperApi<CustomField>(executionContext, {
    method: 'POST',
    path: `/space/custom_field`,
    body: payload
  })

  return [[{ json: response }]]
}

export default { execute }
