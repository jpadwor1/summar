export const PLANS = [
  {
    name: 'Free',
    slug: 'free',
    quota: 10,
    pagesPerPdf: 5,
    price: {
      amount: 0,
      priceIds: {
        test: '',
        production: '',
      },
    },
  },
  {
    name: 'Pro',
    slug: 'pro',
    quota: 40,
    pagesPerPdf: 225,
    price: {
      amount: 14.99,
      priceIds: {
        test: 'price_1OJpOPGa4QqaSZrhd5NB1Jnz',
        production: '',
      },
    },
  },
  {
    name: 'Military',
    slug: 'military',
    quota: 50,
    pagesPerPdf: 1025,
    price: {
      amount: 0,
      priceIds: {
        test: 'price_1OMG9LGa4QqaSZrhgBKPyaAa',
        production: '',
      },
    },
  },
];
