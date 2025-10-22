import { IExecuteFunctions, INodeExecutionData, INodePropertyOptions } from "n8n-workflow";
import { ACTION_NAMES } from "../../constants/actions/action_names";
import { fetchPaginatedOptions } from "../../utils";
import { ClosingNote } from "../../types";

const ALLOWED_CLOSING_NOTE_ACTIONS = [
  ACTION_NAMES.GET_ALL_CLOSING_NOTES,
] as const;

type VALID_CLOSING_NOTES_ACTIONS = typeof ALLOWED_CLOSING_NOTE_ACTIONS[number];

const execute = async (action: VALID_CLOSING_NOTES_ACTIONS, executionContext: IExecuteFunctions) => {
  if (!ALLOWED_CLOSING_NOTE_ACTIONS.includes(action)) return []
  const results: INodeExecutionData[] = [];

  const limit = executionContext.getNodeParameter('limit', 0, 10) as number;

  const { raw } = await fetchPaginatedOptions<ClosingNote, INodePropertyOptions>(
    executionContext,
    'respondIoApi',
    '/space/closing_notes',
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

  return [results];
}

export default { execute }
