import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import {
  API_CONTRACT_HEADER,
  API_CONTRACT_VERSION,
  requiresApiContract,
} from '@shared/config/api-contract'

import { registerAgencyDashboardOpenApi } from '@server/agency-dashboard/openapi'
import { registerAgendaOpenApi } from '@server/agenda/openapi'
import { registerAuthOpenApi } from '@server/auth/openapi'
import { registerContractsOpenApi } from '@server/contracts/openapi'
import { registerCrmOpenApi } from '@server/crm/openapi'
import { registerDashboardOpenApi } from '@server/dashboard/openapi'
import { registerFinancialOpenApi } from '@server/financial/openapi'
import { registerMaintenanceOpenApi } from '@server/maintenance/openapi'
import { registerMarketplaceOpenApi } from '@server/marketplace/openapi'
import { registerPlatformOpenApi } from '@server/platform/openapi'
import { registerPropertiesOpenApi } from '@server/properties/openapi'
import { registerRegistrationOpenApi } from '@server/registration/openapi'
import { registerTeamOpenApi } from '@server/team/openapi'
import { registerFaceCheckOpenApi } from '@server/face_check/openapi'
import './zod-extend'
import { registerContractComponents } from './contract-components'

export const registry = new OpenAPIRegistry()

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
})

registerAuthOpenApi(registry)
registerPlatformOpenApi(registry)
registerMarketplaceOpenApi(registry)
registerPropertiesOpenApi(registry)
registerCrmOpenApi(registry)
registerRegistrationOpenApi(registry)
registerAgendaOpenApi(registry)
registerContractsOpenApi(registry)
registerFinancialOpenApi(registry)
registerMaintenanceOpenApi(registry)
registerAgencyDashboardOpenApi(registry)
registerDashboardOpenApi(registry)
registerTeamOpenApi(registry)
registerFaceCheckOpenApi(registry)
registerContractComponents(registry)

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions)

  const document = generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Ketris BFF API',
      version: API_CONTRACT_VERSION + '.0.0',
      description:
        'API interna do BFF do Ketris (Next.js Route Handlers). Ver docs/adr/0001-bff-banco-orm.md e ' +
        'docs/adr/0002-arquitetura-interna-bff.md.',
    },
    servers: [{ url: '/api' }],
  })
  for (const [pathname, item] of Object.entries(document.paths)) {
    if (!item || !requiresApiContract(`/api${pathname}`)) continue
    for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
      const operation = item[method]
      if (!operation) continue
      operation.parameters = [
        ...(operation.parameters ?? []),
        {
          in: 'header',
          name: API_CONTRACT_HEADER,
          required: true,
          schema: { type: 'string', enum: [API_CONTRACT_VERSION] },
          description:
            'Versão do contrato em inglês. Clientes anteriores devem recarregar antes de repetir a operação.',
        },
      ]
      operation.responses = {
        ...operation.responses,
        '409': operation.responses?.['409'] ?? {
          description: 'CLIENT_UPDATE_REQUIRED: recarregar a aplicação para usar o contrato atual.',
        },
      }
    }
  }
  return document
}
