import axios from 'axios'

export function isPropertyNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404
}
