import type { Cobranca, ComprovanteCobranca, Contrato, Imovel, ParteContrato } from '@prisma/client'

export type CobrancaWithRelations = Cobranca & {
  comprovanteAtual: Pick<
    ComprovanteCobranca,
    'id' | 'nomeArquivo' | 'tipoConteudo' | 'tamanhoBytes' | 'createdAt'
  > | null
  contrato:
    | (Contrato & {
        imovel: Pick<Imovel, 'id' | 'titulo'> & {
          endereco: { logradouro: string; bairro: string; cidade: string } | null
        }
        partes: Pick<ParteContrato, 'nome' | 'email'>[]
      })
    | null
}
