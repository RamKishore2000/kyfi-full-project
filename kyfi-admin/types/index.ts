export type FarmerStatus = "GREEN" | "YELLOW" | "RED";
export type DealerStatus = "Pending" | "Approved" | "Rejected" | "Suspended";
export type Priority = "Low" | "Medium" | "High" | "Critical";

export type Farmer = {
  id: string;
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
