const CURRENCY_CODE = "INR";
const LOCALE = "en-IN";

export const CURRENCY_SYMBOL = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY_CODE,
})
  .formatToParts(0)
  .find((part) => part.type === "currency").value;

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY_CODE,
    maximumFractionDigits: 2,
  }).format(amount);
};
