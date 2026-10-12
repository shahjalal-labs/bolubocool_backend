import { Request } from 'express';
import https from 'https';
import axios from 'axios';
import { calculateTopshipCharges } from '../../helpers/topship.service';
import prisma from '../../utils/prisma';

const createPaymentIntent = (req: Request): Promise<any> => {
  const { email, amount } = req.body;

  const params = JSON.stringify({
    email,
    amount: amount * 100,
    callback_url: 'https://admin.barakadish.com/',
  });

  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: '/transaction/initialize',
    method: 'POST',
    headers: {
      Authorization: `Bearer sk_test_a6c7ec575520726e8d247f2ec1a66a4bbf233e95`,
      'Content-Type': 'application/json',
    },
  };

  return new Promise((resolve, reject) => {
    const paystackReq = https.request(options, (paystackRes: any) => {
      let data = '';

      paystackRes.on('data', (chunk: Buffer | string) => {
        data += chunk.toString();
      });

      paystackRes.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (err) {
          reject(new Error('Invalid response from Paystack.'));
        }
      });
    });

    paystackReq.on('error', (error: Error) => {
      reject(error);
    });

    paystackReq.write(params);
    paystackReq.end();
  });
};

const createSubAccount = (req: Request): Promise<any> => {
  const { vendor } = req.body;

  const params = JSON.stringify({
    business_name: vendor.business_name,
    bank_code: vendor.bank_code,
    account_number: vendor.account_number,
    percentage_charge: 90,
    primary_contact_email: vendor.email,
    primary_contact_name: vendor.name,
    settlement_bank: vendor.bank_name,
    metadata: {
      vendor_id: vendor.id,
    },
  });

  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: '/subaccount',
    method: 'POST',
    headers: {
      Authorization: 'Bearer sk_test_a6c7ec575520726e8d247f2ec1a66a4bbf233e95',
      'Content-Type': 'application/json',
    },
  };

  return new Promise((resolve, reject) => {
    const reqs = https.request(options, (res: any) => {
      let data = '';

      res.on('data', (chunk: Buffer | string) => {
        data += chunk.toString();
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (err) {
          reject(new Error('Failed to parse Paystack response'));
        }
      });
    });

    reqs.on('error', error => {
      reject(error);
    });

    reqs.write(params);
    reqs.end();
  });
};

const initializeSplitPayment = (req: Request): Promise<any> => {
  const { customerEmail, amount, subaccountCode } = req.body;

  const params = JSON.stringify({
    email: customerEmail,
    amount: amount * 100,
    subaccount: subaccountCode,
    transaction_charge: amount * 10,
    callback_url: 'https://admin.barakadish.com/',
  });

  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: '/transaction/initialize',
    method: 'POST',
    headers: {
      Authorization: 'Bearer sk_test_a6c7ec575520726e8d247f2ec1a66a4bbf233e95',
      'Content-Type': 'application/json',
    },
  };

  return new Promise((resolve, reject) => {
    const reqs = https.request(options, (res: any) => {
      let data = '';

      res.on('data', (chunk: Buffer | string) => {
        data += chunk.toString();
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (error) {
          reject(new Error('Failed to parse Paystack response'));
        }
      });
    });

    reqs.on('error', error => {
      reject(error);
    });

    reqs.write(params);
    reqs.end();
  });
};

export const initializeSplitPaymentHelper = (
  customerEmail: string,
  amount: number,
  subaccountCode: string,
): Promise<any> => {
  const params = JSON.stringify({
    email: customerEmail,
    amount: Math.round(amount * 100),
    subaccount: subaccountCode,
    transaction_charge: Math.round(amount * 0.1 * 100),
    callback_url:
      'https://bolubocool-ecommerce-server.vercel.app/payment/success',
  });

  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: '/transaction/initialize',
    method: 'POST',
    headers: {
      Authorization: `Bearer sk_test_a6c7ec575520726e8d247f2ec1a66a4bbf233e95`,
      'Content-Type': 'application/json',
    },
  };

  return new Promise((resolve, reject) => {
    const reqs = https.request(options, (res: any) => {
      let data = '';

      res.on('data', (chunk: Buffer | string) => {
        data += chunk.toString();
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed); // contains authorization_url + reference
        } catch (error) {
          reject(new Error('Failed to parse Paystack response'));
        }
      });
    });

    reqs.on('error', error => {
      reject(error);
    });

    reqs.write(params);
    reqs.end();
  });
};

const topship = axios.create({
  baseURL: 'https://topship-staging.africa/api',
  headers: {
    Authorization:
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImJ1bm1pb2x1ZGUwMUBnbWFpbC5jb20iLCJzdWIiOiJiYjI5ODFlOC1jZWI2LTRiMWEtOTc2Yy0xZWFlMjU1ZDEyNjMiLCJmdWxsTmFtZSI6IkJSQU5ETk9WQSBPTkxJTkUgTFREIiwiaWF0IjoxNzU5MTAzNDMwLCJleHAiOjQ5MTI3MDM0MzB9.XyPL_b3WyJ5BpoW_2mvClhkDuitA-nrf0Fz8su2_FM8',
    'Content-Type': 'application/json',
  },
});

const getRates = async (payload: any) => {
  const response = await topship.get('/get-shipment-rate', {
    params: {
      shipmentDetail: JSON.stringify(payload.shipmentDetail),
    },
  });

  const exchangeRate = 1600;
  const koboToNaira = 100;

  const converted = response.data
    .filter((rate: any) => rate.pricingTier === 'Express')
    .map((rate: any) => {
      const naira = rate.cost / koboToNaira;
      const usd = +(naira / exchangeRate).toFixed(2);
      return { ...rate, cost: usd, currency: 'USD' };
    });

  return converted;
};
export const bookShipmentAsDraft = async (payload: any) => {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: payload.productId },
  });
  const seller = await prisma.user.findUniqueOrThrow({
    where: { id: product.ownerId },
  });
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: payload.userId },
  });

  const vat = payload.shipmentCharge + payload.pickupCharge

  const shipmentPayload = {
    shipment: {
      items: [
        {
          description: 'Cotton t-shirt for domestic delivery.',
          category: 'ClothingAndTextile',
          quantity: 1,
          weight: 0.3,
          value: payload.totalEstimatedCost,
        },
      ],
      itemCollectionMode: 'PickUp',
      pricingTier: payload.pricingTier,
      insuranceType: 'None',
      shipmentRoute: 'Domestic',
      shipmentCharge: payload.shipmentCharge,
      pickupCharge: payload.pickupCharge,     
      valueAddedTaxCharge: Math.ceil(vat * 0.075),
      deliveryLocation: 'Lagos',
      pickupPartner: payload.pickupPartner,
      senderDetail: {
        name: seller.name,
        email: seller.email,
        phoneNumber: seller.phone,
        addressLine1: seller.address,
        city: seller.city,
        state: seller.address,
        country: seller.country,
        countryCode: '+234',
        postalCode: '100001',
      },
      receiverDetail: {
        name: user.name,
        email: user.email,
        phoneNumber: user.phone,
        addressLine1: payload.address,
        city: user.city,
        state: user.state,
        country: user.country,
        countryCode: '+234',
        postalCode: '100001',
      },
    },
  };

  try {
    const response = await topship.post('/save-shipment', shipmentPayload);
   
    return {
      id: response.data[0].id,
      trackingId: response.data[0].trackingId,
    };
  } catch (error: any) {
    console.error(
      '❌ Error creating draft shipment:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const payForShipment = async (shipmentId: string) => {
  try {
    const response = await topship.post('/pay-from-wallet', {
      detail: { shipmentId },
    });

    return response.data;
  } catch (error: any) {
    console.error(
      '❌ Error paying for shipment:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

const createShipmentIntoDB = async (shipmentData: any) => {
  const response = await topship.post('/create-shipment', shipmentData);
  return response.data;
};

const getShippingCost = async (payload: any) => {
  const seller = await prisma.user.findUniqueOrThrow({
    where: { id: payload.sellerId },
  });
 
  const charges = await calculateTopshipCharges({
    senderDetail: {
      addressLine1: seller.address as string,
      cityName: seller.city as string,
      state: seller.state as string,
      country: seller.country as string,
      countryCode: '+234',
    },
    receiverDetail: {
      addressLine1: payload.address,
      cityName: payload.city,
      countryCode: '+234',
    },
    parcelDetail: {
      totalWeight: 0.3,
      category: 'ClothingAndTextile',
    },
    itemCollectionMode: 'PickUp',
  });
  return charges;
};
const trackShipmentInfo = async (id: string) => {
  try {
    const response = await topship.get(`/track-shipment`, {
      params: { trackingId: id },
    });

    return response.data;
  } catch (error: any) {
    console.error(
      'Error tracking shipment:',
      error.response?.data || error.message,
    );
    throw error.response?.data || { message: 'Failed to track shipment' };
  }
};

export const cancelShipment = async (id: string) => {
  const response = await topship.post('/cancel-shipment', { id });
  return response.data;
};

export const paystackServices = {
  createPaymentIntent,
  bookShipmentAsDraft,
  createSubAccount,
  initializeSplitPayment,
  createShipmentIntoDB,
  payForShipment,
  trackShipmentInfo,
  getShippingCost,
  getRates,
};
