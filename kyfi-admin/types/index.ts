export type FarmerStatus = "GREEN" | "YELLOW" | "RED";
export type DealerStatus = "Pending" | "Approved" | "Rejected" | "Suspended";
export type Priority = "Low" | "Medium" | "High" | "Critical";

export type Farmer = {
  statusId?: number;
  id: string;
  farmerType?: "OLD" | "NEW";
  dealerCount?: number;
  dealerStatuses?: Array<{
    statusId: number;
    dealerId: number;
    dealerName: string;
    dealerMobile: string;
    dealerShopName?: string;
    status: FarmerStatus;
    addedAt: string;
  }>;
  name: string;
  district: string;
  mandal: string;
  village: string;
  crop: string;
  phone: string;
  aadhaarMasked: string;
  panMasked?: string;
  rationCard?: string;
  address?: string;
  status: FarmerStatus;
  remarks: string;
  voteCount: number;
  reports: number;
  dateAdded: string;
  lastVerified: string;
  history: string[];
};

export type Dealer = {
  id: string;
  name: string;
  ownerName: string;
  mobile: string;
  district: string;
  mandal: string;
  village: string;
  licenseId: string;
  aadhaarOrGst: string;
  status: DealerStatus;
  subscriptionStatus?: "active" | "inactive";
  subscriptionPlanName?: string | null;
  subscriptionYearlyPrice?: number | null;
  subscriptionStartedAt?: string | null;
  subscriptionExpiresAt?: string | null;
  farmersLinked: number;
  joined: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  time: string;
  read: boolean;
};
