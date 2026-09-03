export const CATEGORIES = {
  "Billing Services": [
    "Auto Renewal Issue", "Balance Missing", "Bundle Related Issue", "Top Up Issue",
    "MNP", "Fraud Usage", "Tariff Plan Issue", "Clarification / Queries", "Others"
  ],
  "BSS Services": [
    "POS Issue", "DSM Related Issue", "Reporting Related Issue", "Retailer Commission Issue",
    "Payment Gateway Issue", "Feature Not Working", "Website Related Issue", "MNP Related Issue",
    "SIM Swap Issue", "mPOS Issue", "Application Issue", "Others"
  ],
  "Data Service": [
    "APN Related Issue", "Data Not Working", "Data Speed Issue", "Roaming Data Issue",
    "VoLTE Issue", "WiFi Calling Issue", "Others"
  ],
  "Network Services": [
    "Activation Issue", "Caller ID Issue", "Coverage Issue", "Toll Free Number Issue",
    "MO/MT Call Issue", "No Network", "Latching Issue", "eSIM Issue", "Others"
  ],
  "SMS Services": [
    "Incorrect Sender ID", "MO SMS Issue", "MT SMS Issue", "Roaming MO/MT SMS Issue",
    "Roaming Notification Issue", "Bulk SMS Issue", "SMS Fraud", "Bank OTP Issue", "Others"
  ],
  "Supplementary Services": [
    "IVR Issue", "MCA Issue", "USSD Code Not Working", "USSD Top-Up Issue",
    "SMS Top Up Issue", "SMS Code Not Working", "VMS Service Issue", "Others"
  ],
  "Voice Services": [
    "Call Conference Issue", "Complete Voice Service Issue", "Coverage Issue", "MO Call Issue",
    "MT Call Issue", "On Hold Issue", "Poor Audio Quality", "Roaming MO/MT Call Issue", "Others"
  ],
  "Hotspot Related": [
    "Retailer Incentive Query", "Missing KB Payment", "Change Retailer Incentive Category",
    "Retailer Special Request", "Schedule Route Issue", "Change Incentive Payment Mode",
    "Pending Bank Payments", "New Requirements", "Updates for CPOS", "Pending Retailer Edit Request",
    "Pending New Retailer Approvals", "Re-activate Closed Retailer ID", "Others"
  ],
  "CS Related": [
    "Tax Code Update", "SIM Request", "Ownership Change", "Balance Refund Request", "Others"
  ]
};

export const CATEGORY_LIST = Object.keys(CATEGORIES);

export const IMPACT_OPTIONS = ["Telecom/POS/Activations/TopUps/MNP", "Any Other Service", "No Service impact"];
export const URGENCY_OPTIONS = ["Few Customers", "Many Customers", "No Customer Impact", "Single customers"];
export const STATUS_OPTIONS = ["Open", "In Progress", "Pending", "Completed"];

export const MOBILE_NETWORK_CATEGORIES = [
  "Data Service",
  "Network Services",
  "SMS Services",
  "Voice Services",
  "Supplementary Services"
];

export const ADMIN_ROLES = ["HS-ADMIN", "PM-ADMIN", "CS-ADMIN"];
export const STANDARD_ROLES = ["ASM", "FSE"];