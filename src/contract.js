import ABI from './VotingSystem.json'

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS
export const CONTRACT_ABI = ABI.abi ?? ABI
