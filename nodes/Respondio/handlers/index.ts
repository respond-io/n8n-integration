import OPERATION_NAMES from "../constants/actions/operation_names";
import channelHandler from './channels'
import closingNotesHandler from './closing_notes'
import commentsHandler from './comments'
import contactFieldsHandler from './contact_fields'

export default {
  [OPERATION_NAMES.CHANNELS]: channelHandler,
  [OPERATION_NAMES.CLOSING_NOTES]: closingNotesHandler,
  [OPERATION_NAMES.COMMENTS]: commentsHandler,
  [OPERATION_NAMES.CONTACT_FIELDS]: contactFieldsHandler
}
