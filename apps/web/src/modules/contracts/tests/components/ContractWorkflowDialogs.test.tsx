import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ContractManualSignatureDialog } from '../../components/contract-detail/ContractManualSignatureDialog'
import { ContractTransitionDialog } from '../../components/contract-detail/ContractTransitionDialog'
import { ContractEditDialog } from '../../components/contract-detail/ContractEditDialog'
import { ContractDocumentsPanel } from '../../components/contract-detail/ContractDocumentsPanel'
import { ContractDocumentUpload } from '../../components/contract-detail/ContractDocumentUpload'
import { ContractHistoryPanel } from '../../components/contract-detail/ContractHistoryPanel'
import { contractsService } from '../../services/contracts-service'
import { contractDocumentsService } from '../../services/contract-documents-service'
import { apiContractFixture } from '../fixtures/contract'
import type { ApiContractDocument } from '../../types/service'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { tenantId: 'agency', user: { id: 'manager' }, role: 'OWNER' } }),
}))
afterEach(() => vi.restoreAllMocks())
const document: ApiContractDocument = {
  id: 'document',
  name: 'Contrato final.pdf',
  url: null,
  createdAt: '2031-01-01T00:00:00Z',
  updatedAt: null,
  sha256: 'd'.repeat(64),
  size: 512,
  uploadedBy: null,
  contractRevision: 2,
  canDownload: true,
}
function show(element: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={client}>{element}</QueryClientProvider>)
}

describe('confirmações reais de Contracts', () => {
  it('exige um PDF da revisão atual e não oferece os legados ou desatualizados para assinatura', async () => {
    const confirm = vi.fn()
    show(
      <ContractManualSignatureDialog
        party={apiContractFixture().parties[0]}
        dataRevision={2}
        documents={[
          document,
          { ...document, id: 'old', name: 'Antigo.pdf', contractRevision: 1 },
          { ...document, id: 'legacy', name: 'Legado.pdf', canDownload: false },
        ]}
        pending={false}
        error={null}
        onClose={vi.fn()}
        onConfirm={confirm}
      />,
    )
    expect(screen.getByText(/Este é um registro manual/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar registro manual' }))
    expect(await screen.findByText('Selecione um PDF da revisão atual.')).toBeInTheDocument()
    expect(confirm).not.toHaveBeenCalled()
    fireEvent.mouseDown(screen.getByRole('combobox'))
    expect(screen.queryByRole('option', { name: 'Antigo.pdf' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Legado.pdf' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('option', { name: 'Contrato final.pdf' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar registro manual' }))
    await waitFor(() => expect(confirm).toHaveBeenCalledWith('document'))
  })

  it('bloqueia registro manual sem documento e enquanto a gravação está pendente', () => {
    show(
      <ContractManualSignatureDialog
        party={apiContractFixture().parties[0]}
        documents={[]}
        dataRevision={2}
        pending
        error={null}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Confirmar registro manual' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeDisabled()
  })

  it('exige motivo antes de confirmar cancelamento ou encerramento', async () => {
    const confirm = vi.fn()
    show(
      <ContractTransitionDialog
        action="close"
        pending={false}
        error={null}
        onClose={vi.fn()}
        onConfirm={confirm}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(await screen.findByText('Informe o motivo.')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: 'Motivo' }), {
      target: { value: '  Fim da locação  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => expect(confirm).toHaveBeenCalledWith('Fim da locação'))
  })

  it('edita partes e condições sem enviar proposta ou imóvel no payload', async () => {
    const contract = apiContractFixture()
    const edit = vi.spyOn(contractsService, 'edit').mockResolvedValue(contract)
    const close = vi.fn()
    show(<ContractEditDialog contract={contract} tenantId="agency" onClose={close} />)
    const value = screen.getByRole('spinbutton', { name: /Valor/ })
    fireEvent.change(value, { target: { value: '1800.25' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    await waitFor(() => expect(edit).toHaveBeenCalledOnce())
    const payload = edit.mock.calls[0][1]
    expect(payload.amount).toBe(1800.25)
    expect(payload).not.toHaveProperty('opportunityId')
    expect(payload).not.toHaveProperty('propertyId')
    expect(close).toHaveBeenCalledOnce()
  })
})

describe('documentos e histórico no detalhe', () => {
  it('mantém documentos antigos visíveis e impede baixar legados sem arquivo privado', () => {
    show(
      <ContractDocumentsPanel
        contractId="contract"
        dataRevision={3}
        documents={[
          document,
          { ...document, id: 'legacy', name: 'Legado.pdf', canDownload: false },
        ]}
      />,
    )
    expect(screen.getByRole('button', { name: 'Baixar Contrato final.pdf' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Baixar Legado.pdf' })).toBeDisabled()
    expect(screen.getAllByText(/Versão anterior/)).toHaveLength(2)
  })

  it('valida formato do arquivo antes de iniciar o envio e mantém a falha visível', async () => {
    const upload = vi
      .spyOn(contractDocumentsService, 'upload')
      .mockRejectedValue(new Error('Storage indisponível'))
    const busy = vi.fn()
    show(<ContractDocumentUpload contractId="contract" tenantId="agency" onBusyChange={busy} />)
    const input = screen.getByLabelText('PDF comprobatório')
    fireEvent.change(input, {
      target: { files: [new File(['texto'], 'arquivo.txt', { type: 'text/plain' })] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar PDF' }))
    expect(await screen.findByText('Selecione um arquivo no formato PDF.')).toBeInTheDocument()
    expect(upload).not.toHaveBeenCalled()
    const file = new File(['%PDF-1.7'], 'contrato.pdf', { type: 'application/pdf' })
    fireEvent.change(input, { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar PDF' }))
    expect(
      await screen.findByText('Não foi possível concluir a operação. Tente novamente.'),
    ).toBeInTheDocument()
    expect(upload).toHaveBeenCalledWith('contract', file, expect.any(Function))
    expect(busy.mock.calls.map(([value]) => value)).toEqual([true, false])
  })

  it('carrega as páginas do histórico real e preserva a indicação de autor desconhecido', async () => {
    const history = vi.spyOn(contractsService, 'history').mockImplementation(async (_id, page) => ({
      page,
      pageSize: 10,
      totalCount: 11,
      items: [
        {
          id: 'event-' + page,
          action: page === 1 ? 'CREATED' : 'UPDATED',
          actor: page === 1 ? { id: 'manager', name: 'Gestora' } : null,
          actorType: 'USER',
          changedFields: [],
          fromStatus: null,
          toStatus: null,
          reason: null,
          documentId: null,
          createdAt: '2031-01-01T12:00:00Z',
        },
      ],
    }))
    show(<ContractHistoryPanel contractId="contract" tenantId="agency" />)
    expect(await screen.findByText('Contrato criado')).toBeInTheDocument()
    expect(screen.getByText('Gestora')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ir para a página 2' }))
    expect(await screen.findByText('Contrato atualizado')).toBeInTheDocument()
    expect(screen.getByText('Autoria indisponível')).toBeInTheDocument()
    expect(history).toHaveBeenLastCalledWith('contract', 2)
  })
})
