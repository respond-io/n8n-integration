import { IExecuteFunctions, INodePropertyOptions } from "n8n-workflow";
import { ACTION_NAMES } from "../../constants/actions/action_names";
import { fetchPaginatedOptions } from "../../utils";
import { ClosingNote } from "../../types";

const execute = async (action: ACTION_NAMES, executionContext: IExecuteFunctions) => {
  // we only care about GET_ALL_CLOSING_NOTES for the CLOSING_NOTES operation
  if (action !== ACTION_NAMES.GET_ALL_CLOSING_NOTES) return []

  const limit = executionContext.getNodeParameter('limit', 10) as number;
  const { raw } = await fetchPaginatedOptions<ClosingNote, INodePropertyOptions>(
    executionContext,
    'respondIoApi',
    '/space/closing_notes',
    undefined,
    {
      maxResults: limit,
      logLabel: '[Action - Closing Notes]',
      includeRaw: true,
      limit: 20,
      includeTransformed: false
    }
  )

  // Map raw items into n8n output format
  const returnData = raw.map((item) => ({ json: item }));
  return [returnData]
}

export default { execute }
