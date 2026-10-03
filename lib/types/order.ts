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

type BankPayment = { accountHolder: string; bankName: string; iban: string; bic: string };
type PaymentLink = { url: string };

export type OrderPayment =
  | { method: 'link'; link: PaymentLink; rib?: BankPayment }
  | { method: 'rib'; rib: BankPayment; link?: PaymentLink };

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
