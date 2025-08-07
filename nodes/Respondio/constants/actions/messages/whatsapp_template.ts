import { INodeProperties } from "n8n-workflow";

export default {
  generateFields: (): INodeProperties[] => [
    {
      displayName: 'WhatsApp Template Name',
      required: true,
      name: 'templateId',
      type: 'options',
      description: 'The name of the approved WhatsApp template.',
      default: '',
      typeOptions: {
        loadOptionsMethod: 'getWhatsappTemplates',
        loadOptionsDependsOn: ['channelId']
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
      type: 'options',
      required: true,
      default: '',
      description: 'The language code of the approved WhatsApp template.',
      typeOptions: {
        loadOptionsMethod: 'getWhatsappTemplateLanguageCodes',
        loadOptionsDependsOn: ['templateId']
      },
      displayOptions: {
        show: {
          messageType: ['whatsapp_template'],
          templateId: [{ _cnd: { exists: true } }]
        }
      },
    },
    {
      displayName: 'WhatsApp Template Component Fields',
      name: 'whatsappTemplateComponentFields',
      type: 'resourceMapper',
      default: {
        mappingMode: 'defineBelow',
        value: null,
      },
      noDataExpression: true,
      required: true,
      typeOptions: {
        resourceMapper: {
          resourceMapperMethod: 'getWhatsappTemplateComponentFields',
          mode: 'add',
          addAllFields: true,
          multiKeyMatch: true,
          supportAutoMap: false,
        },
        loadOptionsDependsOn: ['templateId']
      },
      displayOptions: {
        show: {
          messageType: ['whatsapp_template'],
          templateId: [{ _cnd: { exists: true } }],
        }
      }
    }
  ]
}
