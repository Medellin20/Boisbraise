export type CheckoutCustomer = {
  firstName: string;
  lastName: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
};

export type OrderLine = {
  slug: string;
  name: string;
  lengthCm: number;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type OrderPayment =
  | { method: 'link'; url: string }
  | { method: 'rib'; accountHolder: string; bankName: string; iban: string; bic: string };

export type OrderConfirmation = {
  reference: string;
  customer: CheckoutCustomer;
  lines: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deposit: number;
  remaining: number;
  payment: OrderPayment;
};
