import OPERATION_NAMES from "../constants/actions/operation_names";
import channelHandler from './channels'
import closingNotesHandler from './closing_notes'
import commentsHandler from './comments'
import contactFieldsHandler from './contact_fields'
import contactsHandler from './contacts'
import conversationsHandler from './conversations'
import lifecycleHandler from './lifecycles'

export default {
  [OPERATION_NAMES.CHANNELS]: channelHandler,
  [OPERATION_NAMES.CLOSING_NOTES]: closingNotesHandler,
  [OPERATION_NAMES.COMMENTS]: commentsHandler,
  [OPERATION_NAMES.CONTACT_FIELDS]: contactFieldsHandler,
  [OPERATION_NAMES.CONTACTS]: contactsHandler,
  [OPERATION_NAMES.CONVERSATIONS]: conversationsHandler,
  [OPERATION_NAMES.LIFECYCLE]: lifecycleHandler,
}
