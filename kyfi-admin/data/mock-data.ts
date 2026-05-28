import type { Dealer, Farmer, NotificationItem } from "@/types";

export const analytics = [
  { label: "Total Farmers", value: 24892, change: "68% GREEN", tone: "success" },
  { label: "Registered Dealers", value: 842, change: "118 pending", tone: "primary" },
  { label: "Status Votes", value: 6318, change: "+7 days", tone: "warning" },
  { label: "Blacklist Entries", value: 76, change: "+9 cases", tone: "danger" },
];

export const monthlyActivity = [
  { month: "Jan", farmers: 1900, reports: 220, approvals: 148 },
  { month: "Feb", farmers: 2300, reports: 260, approvals: 188 },
  { month: "Mar", farmers: 2600, reports: 190, approvals: 232 },
  { month: "Apr", farmers: 3100, reports: 310, approvals: 280 },
  { month: "May", farmers: 3600, reports: 275, approvals: 322 },
  { month: "Jun", farmers: 4100, reports: 340, approvals: 390 },
  { month: "Jul", farmers: 4550, reports: 300, approvals: 430 },
];

export const statusDistribution = [
  { name: "Green", value: 68, color: "#16A34A" },
  { name: "Yellow", value: 19, color: "#F59E0B" },
  { name: "Red", value: 13, color: "#DC2626" },
];

export const farmers: Farmer[] = [
  { id: "KYF-AP-1024", name: "Ananya Reddy", district: "Guntur", mandal: "Tenali", village: "Kollipara", crop: "Chilli", phone: "+91 98765 41024", aadhaarMasked: "XXXX-XXXX-1024", panMasked: "ABCDE1024F", rationCard: "AP-RC-41024", address: "Kollipara, Tenali Mandal", status: "GREEN", blacklisted: true, blacklistReason: "Unpaid seasonal pesticide credit", remarks: "Good repayment record with most dealers; one confirmed unpaid dispute remains open.", voteCount: 18, reports: 6, dateAdded: "18 Apr 2026", lastVerified: "26 May 2026", history: ["Status added as GREEN by reporting dealer", "6 dealers confirmed similar record", "Blacklist warning attached on 26 May 2026"] },
  { id: "KYF-TS-1031", name: "Ramesh Naik", district: "Warangal", mandal: "Nekkonda", village: "Appalaraopet", crop: "Cotton", phone: "+91 98765 41031", aadhaarMasked: "XXXX-XXXX-1031", address: "Appalaraopet, Nekkonda Mandal", status: "GREEN", blacklisted: false, remarks: "No complaints reported. Dealer votes indicate timely repayment.", voteCount: 24, reports: 0, dateAdded: "10 Apr 2026", lastVerified: "24 May 2026", history: ["Status added as GREEN", "24 dealer votes recorded"] },
  { id: "KYF-AP-1042", name: "Meera Devi", district: "Krishna", mandal: "Gudivada", village: "Moturu", crop: "Paddy", phone: "+91 98765 41042", aadhaarMasked: "XXXX-XXXX-1042", panMasked: "ABCDE1042K", address: "Moturu, Gudivada Mandal", status: "YELLOW", blacklisted: false, remarks: "Delayed payment reported by two dealers. Proceed with caution.", voteCount: 9, reports: 2, dateAdded: "02 May 2026", lastVerified: "21 May 2026", history: ["Status added as YELLOW", "2 delay reports reviewed"] },
  { id: "KYF-TS-1098", name: "Vikram Goud", district: "Nizamabad", mandal: "Bodhan", village: "Achampalle", crop: "Turmeric", phone: "+91 98765 41098", aadhaarMasked: "XXXX-XXXX-1098", address: "Achampalle, Bodhan Mandal", status: "RED", blacklisted: true, blacklistReason: "Confirmed non-payment after repeated follow-up", remarks: "Multiple complaints on record. Cash transactions only.", voteCount: 31, reports: 11, dateAdded: "17 Feb 2026", lastVerified: "18 May 2026", history: ["Status added as RED", "11 dealer reports linked", "Blacklist entry confirmed"] },
  { id: "KYF-AP-1120", name: "Farida Begum", district: "Kurnool", mandal: "Adoni", village: "Isvi", crop: "Groundnut", phone: "+91 98765 41120", aadhaarMasked: "XXXX-XXXX-1120", address: "Isvi, Adoni Mandal", status: "GREEN", blacklisted: false, remarks: "No disputed entries found.", voteCount: 12, reports: 1, dateAdded: "29 Apr 2026", lastVerified: "16 May 2026", history: ["Status added as GREEN", "One old remark closed after review"] },
  { id: "KYF-TS-1191", name: "Ishaan Kumar", district: "Khammam", mandal: "Madhira", village: "Dendukuru", crop: "Maize", phone: "+91 98765 41191", aadhaarMasked: "XXXX-XXXX-1191", address: "Dendukuru, Madhira Mandal", status: "YELLOW", blacklisted: false, remarks: "Minor complaints and delayed payment pattern.", voteCount: 7, reports: 3, dateAdded: "04 May 2026", lastVerified: "12 May 2026", history: ["Status added as YELLOW", "3 dealer votes recorded"] },
];

export const dealers: Dealer[] = [
  { id: "DLR-AP-5001", name: "Coastal Agri Traders", ownerName: "Suresh Reddy", mobile: "+91 98765 45001", district: "Guntur", mandal: "Tenali", village: "Kollipara", licenseId: "AP-AGR-8841", aadhaarOrGst: "GST-8841", status: "Pending", farmersLinked: 42, joined: "20 May 2026" },
  { id: "DLR-TS-5018", name: "Telangana Crop Connect", ownerName: "Mahesh Naik", mobile: "+91 98765 45018", district: "Warangal", mandal: "Nekkonda", village: "Appalaraopet", licenseId: "TS-AGR-8912", aadhaarOrGst: "GST-8912", status: "Approved", farmersLinked: 118, joined: "11 Apr 2026" },
  { id: "DLR-AP-5066", name: "Krishna Produce Hub", ownerName: "Lakshmi Devi", mobile: "+91 98765 45066", district: "Krishna", mandal: "Gudivada", village: "Moturu", licenseId: "AP-AGR-9008", aadhaarOrGst: "GST-9008", status: "Suspended", farmersLinked: 31, joined: "04 Mar 2026" },
  { id: "DLR-TS-5110", name: "Deccan Farm Exchange", ownerName: "Imran Hussain", mobile: "+91 98765 45110", district: "Nizamabad", mandal: "Bodhan", village: "Achampalle", licenseId: "TS-AGR-9099", aadhaarOrGst: "GST-9099", status: "Rejected", farmersLinked: 9, joined: "17 Feb 2026" },
];

export const notifications: NotificationItem[] = [
  { id: "N-01", title: "Blacklist alert", description: "Ananya Reddy was added to blacklist while retaining GREEN verification.", priority: "Critical", time: "8 min ago", read: false },
  { id: "N-02", title: "Dealer approval pending", description: "Coastal Agri Traders requires admin review.", priority: "High", time: "24 min ago", read: false },
  { id: "N-03", title: "District report generated", description: "Guntur monthly performance report is ready.", priority: "Medium", time: "2 hr ago", read: true },
  { id: "N-04", title: "SMS notification queued", description: "Dealer approval notices are ready for delivery.", priority: "Low", time: "Yesterday", read: true },
];

export const districtPerformance = [
  { district: "Guntur", farmers: 4820, reports: 44, score: 92 },
  { district: "Warangal", farmers: 3940, reports: 36, score: 89 },
  { district: "Krishna", farmers: 2880, reports: 29, score: 81 },
  { district: "Nizamabad", farmers: 2520, reports: 33, score: 76 },
  { district: "Kurnool", farmers: 2180, reports: 21, score: 84 },
];

export const recentActivity = [
  "Dealer Telangana Crop Connect approved for Warangal district",
  "High-risk farmer report escalated from Nizamabad",
  "Monthly activity export generated by Admin",
  "Blacklist review completed for 6 farmer records",
];
