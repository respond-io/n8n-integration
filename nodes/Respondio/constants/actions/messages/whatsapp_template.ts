import { INodeProperties } from "n8n-workflow";

export default {
  generateFields: (): INodeProperties[] => [
    {
      displayName: 'WhatsApp Template Name',
      required: true,
      name: 'templateName',
      type: 'string',
      description: 'The name of the approved WhatsApp template.',
      default: '',
      typeOptions: {
        loadOptionsMethod: 'getWhatsappTemplates',
      },
      displayOptions: {
        show: {
          messageType: ['whatsapp_template']
        }
      }
    },
    {
      displayName: 'WhatsApp Template Language Code',
      name: 'templateLanguageCode',
      type: 'string',
      required: true,
      default: '',
      description: 'The language code of the approved WhatsApp template.',
      typeOptions: {
        loadOptionsMethod: 'getWhatsappTemplateLanguageCodes',
      },
      displayOptions: {
        show: {
          messageType: ['whatsapp_template']
        }
      }
    },
  ]
}
