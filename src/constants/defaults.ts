import { ETHEREUM_NULL_ADDRESS } from '../types/ethereum'

export const defaultAdminAddress = () => {
  return process.env.DEFAULT_ADMIN_ADDRESS?.toLowerCase() || ETHEREUM_NULL_ADDRESS
}
