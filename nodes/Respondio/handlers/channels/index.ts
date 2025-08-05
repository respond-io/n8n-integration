import { IExecuteFunctions } from "n8n-workflow";
import { ACTION_NAMES } from "../../constants/actions/action_names";
import { PLATFORM_API_URLS } from "../../constants";

// @ts-ignore
const execute = async (action: ACTION_NAMES, executionContext: IExecuteFunctions) => {
  // we only care about GET_ALL_CHANNELS for the CHANNEL operation
  if (action !== ACTION_NAMES.GET_ALL_CHANNELS) return

  const credentials = await executionContext.getCredentials('respondIoApi');
  const executionEnv = credentials?.environment as 'production' | 'staging' || 'staging';
  // @ts-ignore
  const platformUrl = PLATFORM_API_URLS[executionEnv];
}

export default { execute }
