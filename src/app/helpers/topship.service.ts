// import axios from 'axios';
// import dotenv from 'dotenv';
// import config from '../../config';

// dotenv.config();

// const topship = axios.create({
//   baseURL: config.topship.topShipBase,
//   headers: {
//     Authorization: `Bearer ${config.topship.topshipAPiKey}`,
//     'Content-Type': 'application/json',
//   },
// });

// export const createShipment = async (data: any) => {
//   const response = await topship.post('/shipments', data);
//   return response.data;
// };

// export const trackShipment = async (trackingNumber: string) => {
//   const response = await topship.get(`/track/${trackingNumber}`);
//   return response.data;
// };
import axios from 'axios';

const topship = axios.create({
  baseURL: 'https://topship-staging.africa/api',
  headers: {
    Authorization:
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImJ1bm1pb2x1ZGUwMUBnbWFpbC5jb20iLCJzdWIiOiJiYjI5ODFlOC1jZWI2LTRiMWEtOTc2Yy0xZWFlMjU1ZDEyNjMiLCJmdWxsTmFtZSI6IkJSQU5ETk9WQSBPTkxJTkUgTFREIiwiaWF0IjoxNzU5MTAzNDMwLCJleHAiOjQ5MTI3MDM0MzB9.XyPL_b3WyJ5BpoW_2mvClhkDuitA-nrf0Fz8su2_FM8',
    'Content-Type': 'application/json',
  },
});

interface AddressDetail {
  addressLine1: string;
  addressLine2?: string;
  cityName: string;
  city?: string;
  state?: string;
  country?: string;
  countryCode: string;
}

interface ParcelDetail {
  totalWeight: number;
  category?: string;
  description?: string;
  quantity?: number;
}

interface ShipmentRateResult {
  shipmentCharge: number;
  valueAddedTaxCharge: number;
  insuranceCharge: number;
  discount: number;
  pricingTier: string;
}

interface PickupRateResult {
  pickupCharge: number;
  pickupPartner: string;
  pickupDate?: string;
}

const sanitizeForShipment = ({
  addressLine1,
  addressLine2,
  cityName,
  countryCode,
}: AddressDetail) => ({
  addressLine1,
  addressLine2,
  cityName,
  countryCode,
});

const sanitizeForPickup = (
  {
    addressLine1,
    addressLine2,
    cityName,
    state,
    country,
    countryCode,
  }: AddressDetail,
  pickupDate: string,
) => ({
  senderDetail: {
    addressLine1,
    addressLine2: addressLine2 || '',
    city: cityName,
    state: state || '',
    country: country || 'Nigeria',
    countryCode,
  },
  pickupDate,
});

export const calculateTopshipCharges = async ({
  senderDetail,
  receiverDetail,
  parcelDetail,
  itemCollectionMode = 'PickUp',
  pickupDate = new Date().toISOString(),
}: {
  senderDetail: AddressDetail;
  receiverDetail: AddressDetail;
  parcelDetail: ParcelDetail;
  itemCollectionMode?: 'PickUp' | 'DropOff';
  pickupDate?: string;
}) => {
  try {
    const shipmentRes = await topship.get('/get-shipment-rate', {
      params: {
        shipmentDetail: JSON.stringify({
          senderDetails: sanitizeForShipment(senderDetail),
          receiverDetails: sanitizeForShipment(receiverDetail),
          totalWeight: parcelDetail.totalWeight,
        }),
      },
    });

    const shipmentData = shipmentRes.data?.[0];
    if (!shipmentData) throw new Error('No shipment rates found.');

    const shipmentRate: ShipmentRateResult = {
      shipmentCharge: shipmentData.cost || 0,
      valueAddedTaxCharge: shipmentData.cost * 0.075,
      insuranceCharge: shipmentData.insuranceFee || 0,
      discount: shipmentData.discount || 0,
      pricingTier: shipmentData.pricingTier || 'Budget',
    };

    let pickupRate: PickupRateResult = {
      pickupCharge: 0,
      pickupPartner: '',
      pickupDate: undefined,
    };

    if (itemCollectionMode === 'PickUp') {
      const pickupPayload = sanitizeForPickup(senderDetail, pickupDate);

      const pickupRes = await topship.get('/get-pickup-rates', {
        params: {
          input: JSON.stringify(pickupPayload),
        },
      });

      const pickupData = pickupRes.data?.[0];
      if (pickupData) {  

        pickupRate = {
          pickupCharge: pickupData.pickupCharge || 0,
          pickupPartner: pickupData.partner || '',
          pickupDate,
        };
      }
    }

    const totalCost =
      shipmentRate.shipmentCharge +
      shipmentRate.valueAddedTaxCharge +
      shipmentRate.insuranceCharge -
      shipmentRate.discount +
      pickupRate.pickupCharge;

    return {
      itemCollectionMode,
      ...shipmentRate,
      ...pickupRate,
      totalEstimatedCost: totalCost,
    };
  } catch (error: any) {
    console.error(
      'Topship rate fetch failed:',
      error?.response?.data || error.message,
    );
    throw new Error('Failed to fetch Topship rates');
  }
};
