import OPERATION_NAMES from "../constants/actions/operation_names";
import channelHandler from './channels'
import closingNotesHandler from './closing_notes'

export default {
  [OPERATION_NAMES.CHANNELS]: channelHandler,
  [OPERATION_NAMES.CLOSING_NOTES]: closingNotesHandler,
}
