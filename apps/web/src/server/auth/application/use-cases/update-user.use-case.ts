import type { UpdateUserOutput } from '../../types/use-case-outputs'
import type { UpdateUserInput } from '../../types/use-case-inputs'
import { assertAvatarScope } from '../../domain/avatar-policy'
import { AccountDeactivatedError } from '../../domain/errors'
import { isAgencyManager } from '../../domain/roles'
import { ForbiddenError } from '@server/shared/errors'
import { splitDocument } from '@shared/schemas/document-schema'

import { EmailConfirmationRequiredError, UserNotFoundError } from '../../domain/errors'
import { toAuthenticatedUser } from '../authenticated-user'
import type { UserRepository } from '../ports/user-repository.port'

export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: UpdateUserInput): Promise<UpdateUserOutput> {
    const isSelfUpdate = input.actorId === input.userId

    if (!isSelfUpdate && !isAgencyManager(input.actorRole)) {
      throw new ForbiddenError('Apenas a gestão da imobiliária pode editar usuários.')
    }

    const target = await this.userRepository.findById(input.userId)

    if (!target || target.tenantId !== input.actorTenantId) {
      throw new UserNotFoundError()
    }

    if (input.avatarUrl !== undefined) {
      if (!isSelfUpdate)
        throw new ForbiddenError('O avatar só pode ser alterado pelo próprio usuário.')
      if (!target.active) throw new AccountDeactivatedError()
      assertAvatarScope(
        input.avatarUrl,
        input.actorTenantId,
        input.actorId,
        target.avatarUrl ?? null,
      )
    }

    if (isSelfUpdate && input.role !== undefined) {
      throw new ForbiddenError('O próprio usuário não pode alterar seu papel.')
    }

    if (input.cnpj !== undefined) {
      const ownsCompany =
        isSelfUpdate && target.role === 'OWNER' && target.tenantAccountType === 'AGENCY'
      if (!ownsCompany)
        throw new ForbiddenError('Só o responsável por uma conta de empresa altera o CNPJ.')
    }

    if (input.email && input.email.trim().toLowerCase() !== target.email.toLowerCase()) {
      throw new EmailConfirmationRequiredError()
    }

    const personal = input.document ? splitDocument(input.document) : null

    const updated = await this.userRepository.update(input.userId, {
      name: input.name,
      tenantId: input.actorTenantId,
      auditActor: { kind: 'USER', id: input.actorId },
      phone: input.phone,
      creci: input.creci,
      cpf: personal ? personal.cpf : input.cpf,
      personalCnpj: personal?.cnpj,
      cnpj: input.cnpj,
      avatarUrl: input.avatarUrl,
      role: input.role,
    })

    return toAuthenticatedUser(updated)
  }
}
