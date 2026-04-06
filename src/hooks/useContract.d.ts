import type { Contract } from 'ethers'
import type { Candidate } from '../types'

export const SEPOLIA_CHAIN_ID: number
export const SEPOLIA_CHAIN_HEX: string

export function isMetaMaskInstalled(): boolean
export function getConnectedAddress(): Promise<string | null>
export function connectWallet(): Promise<string>
export function isSepoliaNetwork(): Promise<boolean>
export function checkNetwork(): Promise<boolean>
export function getContract(): Promise<Contract>
export function getReadContract(): Contract
export function fetchCandidates(contract: Contract): Promise<Candidate[]>
export function parseContractError(error: unknown): string
