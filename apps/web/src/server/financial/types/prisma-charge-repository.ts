import type { Cobranca, Contrato, Imovel, ParteContrato } from '@prisma/client'

export type CobrancaWithRelations = Cobranca & {
  contrato:
    | (Contrato & {
        imovel: Pick<Imovel, 'id' | 'titulo'> & {
          endereco: { logradouro: string; bairro: string; cidade: string } | null
        }
        partes: Pick<ParteContrato, 'nome' | 'email'>[]
      })
    | null
}
