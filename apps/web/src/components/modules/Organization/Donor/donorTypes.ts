export type DonorCardModel = {
  id: string;
  name: string;
  bloodGroup: string;
  phone: string;
  district: string;
  available: boolean;
  accountStatus: string;
  lastDonationDate?: string;
};
