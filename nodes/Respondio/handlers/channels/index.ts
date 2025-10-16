import { IExecuteFunctions, INodeExecutionData, INodePropertyOptions } from "n8n-workflow";
import { ACTION_NAMES } from "../../constants/actions/action_names";
import { fetchPaginatedOptions } from "../../utils";
import { Channel } from "../../types";

const ALLOWED_CHANNEL_ACTIONS = [
  ACTION_NAMES.GET_ALL_CHANNELS,
] as const;

type VALID_CHANNEL_ACTIONS = typeof ALLOWED_CHANNEL_ACTIONS[number];

const execute = async (action: VALID_CHANNEL_ACTIONS, executionContext: IExecuteFunctions) => {
  // we only care about GET_ALL_CHANNELS for the CHANNEL operation
  if (!ALLOWED_CHANNEL_ACTIONS.includes(action)) return []

  const items = executionContext.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const limit = executionContext.getNodeParameter('limit', i, 10) as number;

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
        pairedItem: { item: i },
      }))
    );
  }

  return [results];
}

export default { execute }
