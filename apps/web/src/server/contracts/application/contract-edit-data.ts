import type { EditContractRequestDTO } from '../types/dto'
import type { ContractEditData } from '../types/workflow'

export function contractEditData(body: EditContractRequestDTO): ContractEditData {
  return {
    type: body.type,
    amount: body.amount,
    dueDay: body.dueDay,
    startDate: body.startDate,
    endDate: body.endDate,
    adjustmentIndex: body.adjustmentIndex,
    guaranteeType: body.guaranteeType,
    notes: body.notes ?? null,
    parties: [
      { ...body.owner, role: 'LANDLORD', phone: body.owner.phone ?? null },
      { ...body.tenant, role: 'RENTER', phone: body.tenant.phone ?? null },
      ...(body.guarantor
        ? [{ ...body.guarantor, role: 'GUARANTOR' as const, phone: body.guarantor.phone ?? null }]
        : []),
    ],
  }
}
