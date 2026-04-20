import { IExecuteFunctions, INodeExecutionData, INodePropertyOptions, JsonObject, NodeApiError } from "n8n-workflow";
import { ACTION_NAMES } from "../../constants/actions/action_names";
import { fetchPaginatedOptions } from "../../utils";
import { Channel } from "../../types";

const ALLOWED_CHANNEL_ACTIONS = [
  ACTION_NAMES.GET_ALL_CHANNELS,
] as const;

type VALID_CHANNEL_ACTIONS = typeof ALLOWED_CHANNEL_ACTIONS[number];

const execute = async (action: VALID_CHANNEL_ACTIONS, executionContext: IExecuteFunctions) => {
  if (!ALLOWED_CHANNEL_ACTIONS.includes(action)) return []

  const results: INodeExecutionData[] = [];

  const limit = executionContext.getNodeParameter('limit', 0, 10) as number;

  try {
    const { raw } = await fetchPaginatedOptions<Channel, INodePropertyOptions>(
      executionContext,
      'respondIoApi',
      '/space/channel',
      undefined,
      {
        maxResults: limit,
        includeRaw: true,
        limit: 20,
        includeTransformed: false
      }
    )

    results.push(
      ...raw.map(d => ({
        json: d,
        pairedItem: { item: 0 },
      }))
    );
  } catch (error) {
    const apiError = new NodeApiError(
      executionContext.getNode(),
      error as JsonObject,
      {
        message: `Channels Action Error: ${error?.response?.data?.message || error?.message || 'An error occurred while executing the channel action.'}`,
        description: `An error occurred while executing the channel action. Please check the details for more information.`,
      }
    );
    results.push({ json: {}, pairedItem: { item: 0 }, error: apiError });
  }

  return [results];
}

export default { execute }
