export const usePrice = () => {
  const formatPrice = (priceInCents: number): string => {
    const euros = priceInCents / 100;
    return `${euros.toFixed(2).replace('.', ',')}€`;
  };

  return {
    formatPrice
  };
};
