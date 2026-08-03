import type { User } from '../../domain/user.entity'

// Port (contrato) — a camada de aplicação só conhece esta interface, nunca o Prisma diretamente (DIP).
export interface UserRepository {
  // TODO(TENANT_RESOLUTION): busca por e-mail globalmente, sem filtrar tenant — simplificação assumida
  // e documentada em ADR-0002, até a resolução de tenant por subdomínio (specs/002.../tasks.md, T022)
  // estar implementada.
  findByEmail(email: string): Promise<User | null>
}
