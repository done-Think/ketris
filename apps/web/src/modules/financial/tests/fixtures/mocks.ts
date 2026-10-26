import { vi } from 'vitest'

export const financialServiceMock = {
  listCharges: vi.fn(),
  getCharge: vi.fn(),
  createCharge: vi.fn(),
  updateCharge: vi.fn(),
  deleteCharge: vi.fn(),
  cancelCharge: vi.fn(),
  reversePayment: vi.fn(),
  uploadReceipt: vi.fn(),
  registerPayment: vi.fn(),
  getHistory: vi.fn(),
  downloadReceipt: vi.fn(),
  exportCharges: vi.fn(),
  getSummary: vi.fn(),
}
