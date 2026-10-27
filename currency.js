/**
 * Convert major currency units (e.g. 19.99) to integer minor units (e.g. 1999 paise/cents)
 */
export const toMinorUnits = (amountMajor) => {
  if (typeof amountMajor !== 'number' || isNaN(amountMajor)) {
    return 0;
  }
  return Math.round(amountMajor * 100);
};

/**
 * Convert integer minor units (e.g. 1999) to major currency units (e.g. 19.99)
 */
export const toMajorUnits = (amountMinor) => {
  if (typeof amountMinor !== 'number' || isNaN(amountMinor)) {
    return 0;
  }
  return amountMinor / 100;
};

/**
 * Format minor units into localized currency string
 */
export const formatCurrency = (amountMinor, currency = 'USD', locale = 'en-US') => {
  const major = toMajorUnits(amountMinor);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'USD',
    }).format(major);
  } catch (err) {
    return `${currency} ${major.toFixed(2)}`;
  }
};
