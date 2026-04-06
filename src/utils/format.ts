export function shortenAddress(address: string, head = 6, tail = 4): string {
  if (address.length <= head + tail) {
    return address
  }

  return `${address.slice(0, head)}...${address.slice(-tail)}`
}

export function shortenHash(hash: string, head = 10, tail = 8): string {
  if (hash.length <= head + tail) {
    return hash
  }

  return `${hash.slice(0, head)}...${hash.slice(-tail)}`
}

export function formatAmount(value: number, decimals = 4): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value)
}
