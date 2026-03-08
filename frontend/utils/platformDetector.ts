/**
 * Platform Detection Utility for NeymaryShop
 *
 * Detects user platform group for content prioritization:
 * - 'standard': Windows, Android, Linux (gaming focus)
 * - 'premium': macOS, iOS (Telegram/Apple focus)
 *
 * Commission rates: Standard +13%, Premium +15% from cost
 * Loyalty system discounts applied on top
 */

export type PlatformGroup = 'standard' | 'premium'

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface PlatformInfo {
  group: PlatformGroup
  platform: 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'unknown'
  userAgent: string
  isMobile: boolean
}

export interface LoyaltyInfo {
  tier: LoyaltyTier
  discount: number // Discount percentage (0-100)
  purchasesCount: number
  totalSpent: number
}

/**
 * Base commission rates by platform group (markup from cost)
 */
export const BASE_COMMISSION_RATES = {
  standard: {
    rate: 0.13, // +13% for Windows/Android/Linux
    description: 'Standard markup',
  },
  premium: {
    rate: 0.15, // +15% for macOS/iOS
    description: 'Premium markup (Apple/Telegram ecosystem)',
  },
}

/**
 * Loyalty system tiers and discounts
 */
export const LOYALTY_TIERS: Record<LoyaltyTier, { discount: number; minPurchases: number; minSpent: number }> = {
  bronze: {
    discount: 0,    // 0% discount
    minPurchases: 0,
    minSpent: 0,
  },
  silver: {
    discount: 3,    // 3% discount
    minPurchases: 3,
    minSpent: 3000,
  },
  gold: {
    discount: 5,    // 5% discount
    minPurchases: 7,
    minSpent: 10000,
  },
  platinum: {
    discount: 8,    // 8% discount
    minPurchases: 15,
    minSpent: 25000,
  },
}

/**
 * Get base commission rate for a platform group
 *
 * @param group - Platform group
 * @returns Commission rate as decimal (e.g., 0.13 = 13%)
 */
export function getBaseCommissionRate(group: PlatformGroup): number {
  return BASE_COMMISSION_RATES[group]?.rate || 0.13
}

/**
 * Get loyalty tier based on purchases count and total spent
 *
 * @param purchasesCount - Number of completed purchases
 * @param totalSpent - Total amount spent in rubles
 * @returns LoyaltyInfo with tier and discount
 */
export function getLoyaltyTier(purchasesCount: number, totalSpent: number): LoyaltyInfo {
  if (purchasesCount >= LOYALTY_TIERS.platinum.minPurchases || totalSpent >= LOYALTY_TIERS.platinum.minSpent) {
    return {
      tier: 'platinum',
      discount: LOYALTY_TIERS.platinum.discount,
      purchasesCount,
      totalSpent,
    }
  }
  
  if (purchasesCount >= LOYALTY_TIERS.gold.minPurchases || totalSpent >= LOYALTY_TIERS.gold.minSpent) {
    return {
      tier: 'gold',
      discount: LOYALTY_TIERS.gold.discount,
      purchasesCount,
      totalSpent,
    }
  }
  
  if (purchasesCount >= LOYALTY_TIERS.silver.minPurchases || totalSpent >= LOYALTY_TIERS.silver.minSpent) {
    return {
      tier: 'silver',
      discount: LOYALTY_TIERS.silver.discount,
      purchasesCount,
      totalSpent,
    }
  }
  
  return {
    tier: 'bronze',
    discount: LOYALTY_TIERS.bronze.discount,
    purchasesCount,
    totalSpent,
  }
}

/**
 * Calculate final price with platform commission and loyalty discount
 *
 * Formula: cost * (1 + platformRate) * (1 - loyaltyDiscount)
 *
 * @param cost - Base cost in rubles
 * @param group - Platform group
 * @param loyalty - Loyalty info
 * @returns Final price in rubles
 */
export function calculateFinalPrice(cost: number, group: PlatformGroup, loyalty: LoyaltyInfo): number {
  const baseRate = getBaseCommissionRate(group)
  const priceWithCommission = cost * (1 + baseRate)
  const finalPrice = priceWithCommission * (1 - loyalty.discount / 100)
  return Math.round(finalPrice * 100) / 100 // Round to 2 decimal places
}

/**
 * Calculate commission amount (without loyalty discount)
 *
 * @param cost - Base cost in rubles
 * @param group - Platform group
 * @returns Commission amount in rubles
 */
export function calculateCommission(cost: number, group: PlatformGroup): number {
  const rate = getBaseCommissionRate(group)
  return Math.round(cost * rate * 100) / 100
}

/**
 * Calculate loyalty discount amount
 *
 * @param priceWithCommission - Price after platform commission
 * @param loyalty - Loyalty info
 * @returns Discount amount in rubles
 */
export function calculateLoyaltyDiscount(priceWithCommission: number, loyalty: LoyaltyInfo): number {
  const discount = priceWithCommission * (loyalty.discount / 100)
  return Math.round(discount * 100) / 100
}

/**
 * Get loyalty tier badge emoji
 *
 * @param tier - Loyalty tier
 * @returns Emoji string
 */
export function getLoyaltyBadge(tier: LoyaltyTier): string {
  const badges: Record<LoyaltyTier, string> = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎',
  }
  return badges[tier] || '🥉'
}

/**
 * Get loyalty tier display name
 *
 * @param tier - Loyalty tier
 * @returns Localized name
 */
export function getLoyaltyDisplayName(tier: LoyaltyTier): string {
  const names: Record<LoyaltyTier, string> = {
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
  }
  return names[tier] || tier
}

/**
 * Detects platform group from User-Agent
 * 
 * @returns PlatformInfo with group, platform, and metadata
 */
export function detectPlatformGroup(): PlatformInfo {
  // Check if running in browser
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      group: 'standard',
      platform: 'unknown',
      userAgent: '',
      isMobile: false,
    }
  }

  const userAgent = navigator.userAgent.toLowerCase()
  
  // Detect mobile
  const isMobile = /android|iphone|ipad|ipod/i.test(userAgent)
  
  // Detect platform
  let platform: PlatformInfo['platform'] = 'unknown'
  let group: PlatformGroup = 'standard'

  // iOS devices (premium)
  if (/iphone|ipad|ipod/i.test(userAgent)) {
    platform = 'ios'
    group = 'premium'
  }
  // Android (standard)
  else if (/android/i.test(userAgent)) {
    platform = 'android'
    group = 'standard'
  }
  // macOS (premium)
  else if (/mac os x|macintosh/i.test(userAgent)) {
    platform = 'macos'
    group = 'premium'
  }
  // Windows (standard)
  else if (/windows nt/i.test(userAgent)) {
    platform = 'windows'
    group = 'standard'
  }
  // Linux (standard)
  else if (/linux/i.test(userAgent)) {
    platform = 'linux'
    group = 'standard'
  }

  return {
    group,
    platform,
    userAgent,
    isMobile,
  }
}

/**
 * Gets platform-specific category priority
 * 
 * @param platformGroup - 'standard' or 'premium'
 * @returns Array of category slugs in priority order
 */
export function getCategoryPriority(platformGroup: PlatformGroup): string[] {
  if (platformGroup === 'premium') {
    // macOS/iOS: Telegram, Apple, Premium services first
    return [
      'telegram',
      'telegram-premium',
      'telegram-stars',
      'apple',
      'ios-apps',
      'streaming',
      'subscriptions',
      'software',
    ]
  }
  
  // Windows/Android/Linux: Gaming, Discord, Steam first
  return [
    'steam',
    'epic-games',
    'discord',
    'discord-nitro',
    'gaming',
    'game-keys',
    'subscriptions',
    'software',
  ]
}

/**
 * Gets platform display name for badges
 * 
 * @param platform - Platform name
 * @returns Localized platform name
 */
export function getPlatformDisplayName(platform: string): string {
  const displayNames: Record<string, string> = {
    windows: 'Windows',
    macos: 'macOS',
    linux: 'Linux',
    android: 'Android',
    ios: 'iOS',
  }
  
  return displayNames[platform] || platform
}

/**
 * Saves platform preference to localStorage
 * 
 * @param group - Platform group to save
 */
export function savePlatformPreference(group: PlatformGroup): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('platform_group_preference', group)
  }
}

/**
 * Gets saved platform preference or detects automatically
 * 
 * @returns PlatformInfo with saved or detected preference
 */
export function getPlatformWithOverride(): PlatformInfo {
  const detected = detectPlatformGroup()
  
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('platform_group_preference') as PlatformGroup | null
    if (saved && (saved === 'standard' || saved === 'premium')) {
      return {
        ...detected,
        group: saved,
      }
    }
  }
  
  return detected
}

/**
 * Clears saved platform preference
 */
export function clearPlatformOverride(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('platform_group_preference')
  }
}
