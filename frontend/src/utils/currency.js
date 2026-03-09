// Currency formatter for Indian Rupees
export const formatCurrency = (amount) => {
  return `₹${parseFloat(amount).toFixed(2)}`;
};

// Format with Indian numbering system (lakhs, crores)
export const formatIndianCurrency = (amount) => {
  const numStr = parseFloat(amount).toFixed(2);
  const [integer, decimal] = numStr.split('.');
  
  // Indian numbering: last 3 digits, then groups of 2
  const lastThree = integer.slice(-3);
  const otherDigits = integer.slice(0, -3);
  const formatted = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + (otherDigits ? ',' : '') + lastThree;
  
  return `₹${formatted}.${decimal}`;
};
