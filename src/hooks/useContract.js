import { ethers } from 'ethers'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../contract.js'

export const SEPOLIA_CHAIN_ID = 11155111
export const SEPOLIA_CHAIN_HEX = '0xaa36a7'

const FALLBACK_SEPOLIA_RPC_URL =
  import.meta.env.VITE_SEPOLIA_RPC_URL ?? 'https://ethereum-sepolia-rpc.publicnode.com'

function requireContractConfig() {
  if (!CONTRACT_ADDRESS) {
    throw new Error('VITE_CONTRACT_ADDRESS nu este setat in .env')
  }

  if (!CONTRACT_ABI) {
    throw new Error('ABI-ul contractului nu poate fi incarcat')
  }
}

function getEthereum() {
  if (typeof window === 'undefined') {
    return undefined
  }

  return window.ethereum
}

export function isMetaMaskInstalled() {
  return Boolean(getEthereum())
}

export async function getConnectedAddress() {
  if (!isMetaMaskInstalled()) {
    return null
  }

  const accounts = await getEthereum().request({ method: 'eth_accounts' })
  return accounts?.[0] ?? null
}

export async function connectWallet() {
  if (!isMetaMaskInstalled()) {
    throw new Error('Please install MetaMask')
  }

  const provider = new ethers.BrowserProvider(getEthereum())
  const accounts = await provider.send('eth_requestAccounts', [])

  const address = accounts?.[0]
  if (!address) {
    throw new Error('Nu s-a putut obtine adresa wallet-ului.')
  }

  return address
}

export async function isSepoliaNetwork() {
  if (!isMetaMaskInstalled()) {
    return false
  }

  const provider = new ethers.BrowserProvider(getEthereum())
  const network = await provider.getNetwork()
  return network.chainId === BigInt(SEPOLIA_CHAIN_ID)
}

export async function checkNetwork() {
  if (!isMetaMaskInstalled()) {
    throw new Error('Please install MetaMask')
  }

  const provider = new ethers.BrowserProvider(getEthereum())
  const network = await provider.getNetwork()

  if (network.chainId === BigInt(SEPOLIA_CHAIN_ID)) {
    return true
  }

  try {
    await getEthereum().request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_CHAIN_HEX }],
    })
  } catch (error) {
    if (error?.code === 4902) {
      await getEthereum().request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: SEPOLIA_CHAIN_HEX,
            chainName: 'Sepolia',
            nativeCurrency: {
              name: 'Sepolia Ether',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: [FALLBACK_SEPOLIA_RPC_URL],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          },
        ],
      })
    } else {
      throw error
    }
  }

  const updatedNetwork = await provider.getNetwork()
  return updatedNetwork.chainId === BigInt(SEPOLIA_CHAIN_ID)
}

export async function getContract() {
  requireContractConfig()

  if (!isMetaMaskInstalled()) {
    throw new Error('Please install MetaMask')
  }

  const provider = new ethers.BrowserProvider(getEthereum())
  const signer = await provider.getSigner()

  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
}

export function getReadContract() {
  requireContractConfig()

  const provider = new ethers.JsonRpcProvider(FALLBACK_SEPOLIA_RPC_URL)
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
}

export async function fetchCandidates(contract) {
  const countRaw = await contract.candidatesCount()
  const count = Number(countRaw)
  const candidates = []

  for (let index = 1; index <= count; index += 1) {
    const candidateResult = await contract.getCandidate(index)

    const name = Array.isArray(candidateResult)
      ? candidateResult[0]
      : candidateResult.name

    const voteCountRaw = Array.isArray(candidateResult)
      ? candidateResult[1]
      : candidateResult.voteCount

    candidates.push({
      id: index,
      name: String(name),
      voteCount: Number(voteCountRaw),
    })
  }

  return candidates
}

export function parseContractError(error) {
  if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
    return 'Tranzactia a fost anulata in MetaMask.'
  }

  const rawMessage =
    error?.reason ??
    error?.shortMessage ??
    error?.data?.message ??
    error?.message ??
    'A aparut o eroare necunoscuta.'

  const cleanedMessage = String(rawMessage)

  const knownErrors = [
    ['Ai votat deja', 'Ai votat deja.'],
    ['Nu esti inregistrat ca votant', 'Nu esti inregistrat ca votant.'],
    ['Votarea nu este deschisa', 'Votarea nu este deschisa.'],
    ['Candidat invalid', 'Candidatul selectat este invalid.'],
    ['Candidat inexistent', 'Candidatul selectat nu exista.'],
    ['Doar owner-ul poate face asta', 'Doar owner-ul poate efectua aceasta actiune.'],
    ['Adresa invalida', 'Adresa introdusa nu este valida.'],
    ['Votantul e deja inregistrat', 'Votantul este deja inregistrat.'],
    ['Nu poti adauga candidati in timpul votului', 'Nu poti adauga candidati in timpul votului.'],
    ['Nu exista candidati', 'Nu exista candidati inregistrati.'],
    ['user rejected', 'Tranzactia a fost anulata in MetaMask.'],
    ['User denied', 'Tranzactia a fost anulata in MetaMask.'],
    ['insufficient funds', 'Fonduri insuficiente pentru taxa de tranzactie.'],
  ]

  for (const [needle, message] of knownErrors) {
    if (cleanedMessage.toLowerCase().includes(needle.toLowerCase())) {
      return message
    }
  }

  const revertMatch = cleanedMessage.match(/execution reverted(?: with reason string)?[:\s]*"?([^"\n]+)"?/i)
  if (revertMatch?.[1]) {
    return revertMatch[1]
  }

  return cleanedMessage
}
