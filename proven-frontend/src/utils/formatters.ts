/**
 * Formatting utilities for consistent display across the app
 */

/**
 * Format currency amount with proper decimal places
 * @param amount - The amount to format
 * @param currency - Currency code (SOL, USDC, or USD)
 * @param options - Additional formatting options
 */
export const formatCurrency = (
  amount: number,
  currency: 'SOL' | 'USDC' | 'USD' = 'SOL',
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string => {
  // For crypto currencies (SOL, USDC), use custom formatting
  if (currency === 'SOL' || currency === 'USDC') {
    const decimals = options?.maximumFractionDigits ?? (currency === 'SOL' ? 4 : 2);
    return `${amount.toFixed(decimals)} ${currency}`;
  }

  // For fiat currencies (USD), use Intl.NumberFormat
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(amount);
};

/**
 * Format amount without currency symbol
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 */
export const formatAmount = (amount: number, decimals: number = 2): string => {
  return amount.toFixed(decimals);
};

/**
 * Format token amount based on token type
 * @param amount - The amount to format
 * @param tokenType - Type of token (SOL or USDC)
 */
export const formatTokenAmount = (
  amount: number,
  tokenType: 'SOL' | 'USDC' = 'SOL'
): string => {
  const decimals = tokenType === 'SOL' ? 4 : 2;
  return `${amount.toFixed(decimals)} ${tokenType}`;
};

/**
 * Format date to readable string
 * @param date - Date to format
 * @param format - Format type
 */
export const formatDate = (
  date: Date | string,
  format: 'short' | 'long' | 'iso' = 'short'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    case 'long':
      return dateObj.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    case 'iso':
      return dateObj.toISOString().split('T')[0] || '';
    default:
      return dateObj.toLocaleDateString();
  }
};

/**
 * Truncate address for display (e.g., wallet addresses)
 * @param address - Address to truncate
 * @param startChars - Number of characters to show at start
 * @param endChars - Number of characters to show at end
 */
export const truncateAddress = (
  address: string,
  startChars: number = 4,
  endChars: number = 4
): string => {
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};
