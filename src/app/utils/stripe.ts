import { User } from '@prisma/client';
import Stripe from 'stripe';

async function findOrCreateCustomer(user: User, stripe: Stripe) {
  // Search for existing customer by email
  const customers = await stripe.customers.list({
    email: user.email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    // Customer exists
    return customers.data[0];
  } else {
    // Customer does not exist, create a new one
    return await stripe.customers.create({
      name: user.name,
      email: user.email,
    });
  }
}

export const stripeUtils = {
  findOrCreateCustomer,
};
