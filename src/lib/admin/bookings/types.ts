import type {
  BookingStatus,
  ConfirmationEmailStatus,
  DepositMethod,
  PaymentMethod,
  PaymentStatus,
  SecurityDepositStatus,
  VehicleUnitStatus,
} from "@/generated/prisma/index";

export type AdminBookingListFilters = {
  search?: string;
  status?: BookingStatus;
  vehicleId?: string;
  hotelPartnerId?: string;
  hotelCode?: string;
  month?: number;
  year?: number;
  pickupFrom?: string;
  pickupTo?: string;
  page?: number;
  pageSize?: number;
};

export type AdminBookingListItem = {
  id: string;
  bookingReference: string;
  customerFullName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleName: string;
  vehicleLicensePlate: string | null;
  pickupDateTime: string;
  returnDateTime: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  depositMethod: DepositMethod;
  depositAmount: number;
  totalDueOnline: number;
  totalDueLater: number;
  subtotal: number;
  hotelCode: string | null;
  hotelName: string | null;
  createdAt: string;
};

export type AdminBookingListResult = {
  items: AdminBookingListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AdminBookingStatusHistoryItem = {
  id: string;
  oldStatus: BookingStatus | null;
  newStatus: BookingStatus;
  note: string | null;
  changedByAdminName: string | null;
  createdAt: string;
};

export type AdminBookingDetail = {
  id: string;
  bookingReference: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  securityDepositStatus: SecurityDepositStatus;
  createdAt: string;
  updatedAt: string;

  customerFullName: string;
  customerPhone: string;
  customerEmail: string;
  customerNationality: string;
  customerDateOfBirth: string;
  customerLicenseCategory: string;
  customerSpecialNotes: string | null;
  customerLicenseUploadPath: string | null;
  customerPassportUploadPath: string | null;
  paymentProofUploadPath: string | null;
  customerWillPresentLicenseAtPickup: boolean;
  customerWillPresentIdAtPickup: boolean;

  vehicleId: string | null;
  vehicleUnitId: string | null;
  vehicleUnitStatus: VehicleUnitStatus | null;
  vehicleName: string;
  vehicleLicensePlate: string | null;
  vehicleColor: string | null;
  vehicleType: string;
  vehicleTypeSnapshot: string | null;

  pickupDateTime: string;
  returnDateTime: string;
  billableDays: number;
  actualDurationHours: number;
  pickupOption: string;
  pickupAddress: string | null;
  pickupLatitude: number | null;
  pickupLongitude: number | null;
  dropoffOption: string;
  dropoffAddress: string | null;
  dropoffLatitude: number | null;
  dropoffLongitude: number | null;

  cdwOption: string;
  cdwDailyRate: number;
  cdwTotal: number;
  helmetSize1: string | null;
  helmetSize2: string | null;
  storageBoxSelected: boolean;
  storageBoxCost: number;

  additionalDriverEnabled: boolean;
  additionalDriverFullName: string | null;
  additionalDriverPhone: string | null;
  additionalDriverEmail: string | null;
  additionalDriverNationality: string | null;
  additionalDriverDateOfBirth: string | null;
  additionalDriverLicenseCategory: string | null;
  additionalDriverLicenseUploadPath: string | null;
  additionalDriverPassportUploadPath: string | null;
  additionalDriverWillPresentLicenseAtPickup: boolean;
  additionalDriverWillPresentIdAtPickup: boolean;
  additionalDriverDailyRate: number;
  additionalDriverTotal: number;

  hotelCode: string | null;
  hotelName: string | null;
  hotelDiscountPercentSnapshot: number | null;
  hotelDiscountAmountSnapshot: number | null;
  subtotalAfterHotelDiscountSnapshot: number | null;

  baseDailyRateSnapshot: number | null;
  durationDiscountPercentSnapshot: number | null;
  appliedDailyRateSnapshot: number | null;
  rentalCost: number;
  deliveryFee: number;
  dropoffFee: number;
  deliveryTotal: number;
  subtotal: number;
  depositAmount: number;
  depositMethod: DepositMethod;
  totalDueOnline: number;
  totalDueLater: number;

  termsAccepted: boolean;
  termsAcceptedAt: string | null;
  termsVersion: string | null;
  consentSource: string | null;

  confirmationEmailStatus: ConfirmationEmailStatus;
  confirmationEmailSentAt: string | null;

  paymentReceivedAmount: number | null;
  paymentMethod: PaymentMethod | null;
  securityDepositCollectedAmount: number | null;
  handoverDateTime: string | null;
  handoverNotes: string | null;
  returnRecordedAt: string | null;
  returnNotes: string | null;
  depositRefundAmount: number | null;
  depositDeductionAmount: number | null;
  depositDeductionReason: string | null;
  completionNotes: string | null;

  statusHistory: AdminBookingStatusHistoryItem[];
};

export type AdminBookingVehicleOption = {
  id: string;
  name: string;
  licensePlate: string | null;
};
