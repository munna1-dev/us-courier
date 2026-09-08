export type ShipmentStatus =
  | "pending"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception"
  | "cancelled";

export type UserRole =
  | "customer"
  | "super_admin"
  | "admin"
  | "manager"
  | "courier"
  | "support"
  | "viewer";

export type AccountStatus =
  | "active"
  | "inactive"
  | "suspended";

export interface User {
  id: string;

  first_name?: string | null;
  firstName?: string | null;

  last_name?: string | null;
  lastName?: string | null;

  email: string;
  phone?: string | null;

  role?: UserRole | string | null;
  user_role?: UserRole | string | null;
  userRole?: UserRole | string | null;

  roles?: string[] | null;

  status?: AccountStatus | string | null;
  account_status?: AccountStatus | string | null;
  accountStatus?: AccountStatus | string | null;

  avatar_url?: string | null;
  avatarUrl?: string | null;

  is_active?: boolean | null;
  isActive?: boolean | null;

  created_at?: string | null;
  updated_at?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Facility {
  id: string;

  name?: string | null;
  facility_name?: string | null;

  code?: string | null;
  facility_code?: string | null;

  facility_type?: string | null;
  facilityType?: string | null;

  type?: string | null;
  category?: string | null;

  address?: string | null;
  location?: string | null;

  city?: string | null;
  state?: string | null;

  postal_code?: string | null;
  postalCode?: string | null;

  country?: string | null;

  phone?: string | null;
  email?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  active?: boolean | null;
  is_active?: boolean | null;
  isActive?: boolean | null;

  status?: string | null;

  created_at?: string | null;
  updated_at?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Courier {
  id: string;

  user_id?: string | null;
  userId?: string | null;

  employee_number?: string | null;
  employeeNumber?: string | null;

  first_name?: string | null;
  firstName?: string | null;

  last_name?: string | null;
  lastName?: string | null;

  name?: string | null;

  email?: string | null;
  phone?: string | null;

  status?: string | null;

  active?: boolean | null;
  is_active?: boolean | null;
  isActive?: boolean | null;

  vehicle_number?: string | null;
  vehicleNumber?: string | null;

  license_number?: string | null;
  licenseNumber?: string | null;

  current_facility_id?: string | null;
  currentFacilityId?: string | null;

  created_at?: string | null;
  updated_at?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Shipment {
  id: string;

  tracking_number: string;
  trackingNumber?: string | null;

  reference_number?: string | null;
  referenceNumber?: string | null;

  customer_id?: string | null;
  customerId?: string | null;

  sender_name?: string | null;
  senderName?: string | null;

  sender_email?: string | null;
  senderEmail?: string | null;

  sender_phone?: string | null;
  senderPhone?: string | null;

  receiver_name?: string | null;
  receiverName?: string | null;

  recipient_name?: string | null;
  recipientName?: string | null;

  receiver_email?: string | null;
  receiverEmail?: string | null;

  recipient_email?: string | null;
  recipientEmail?: string | null;

  receiver_phone?: string | null;
  receiverPhone?: string | null;

  recipient_phone?: string | null;
  recipientPhone?: string | null;

  sender_address_id?: string | null;
  senderAddressId?: string | null;

  recipient_address_id?: string | null;
  recipientAddressId?: string | null;

  origin_facility_id?: string | null;
  originFacilityId?: string | null;

  destination_facility_id?: string | null;
  destinationFacilityId?: string | null;

  current_facility_id?: string | null;
  currentFacilityId?: string | null;

  assigned_courier_id?: string | null;
  assignedCourierId?: string | null;

  origin?: string | null;
  origin_address?: string | null;
  originAddress?: string | null;

  destination?: string | null;
  destination_address?: string | null;
  destinationAddress?: string | null;

  service_type?: string | null;
  serviceType?: string | null;

  package_type?: string | null;
  packageType?: string | null;

  package_description?: string | null;
  packageDescription?: string | null;

  description?: string | null;

  weight?: number | null;

  weight_unit?: string | null;
  weightUnit?: string | null;

  status: ShipmentStatus | string;

  estimated_delivery?: string | null;
  estimatedDelivery?: string | null;

  estimated_delivery_date?: string | null;
  estimatedDeliveryDate?: string | null;

  actual_delivery?: string | null;
  actualDelivery?: string | null;

  actual_delivery_date?: string | null;
  actualDeliveryDate?: string | null;

  delivered_at?: string | null;
  deliveredAt?: string | null;

  delivery_notes?: string | null;
  deliveryNotes?: string | null;

  current_location?: string | null;
  currentLocation?: string | null;

  created_at?: string | null;
  updated_at?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TrackingEvent {
  id: string;

  shipment_id?: string | null;
  shipmentId?: string | null;

  status: ShipmentStatus | string;

  title?: string | null;
  description?: string | null;

  location?: string | null;

  facility_id?: string | null;
  facilityId?: string | null;

  courier_id?: string | null;
  courierId?: string | null;

  event_time?: string | null;
  eventTime?: string | null;

  created_at?: string | null;
  createdAt?: string | null;
}

export interface ShipmentSummary {
  id: string;

  tracking_number: string;
  trackingNumber?: string | null;

  reference_number?: string | null;
  referenceNumber?: string | null;

  status: ShipmentStatus | string;

  sender_name?: string | null;
  senderName?: string | null;

  receiver_name?: string | null;
  receiverName?: string | null;

  recipient_name?: string | null;
  recipientName?: string | null;

  origin?: string | null;
  destination?: string | null;

  current_location?: string | null;
  currentLocation?: string | null;

  estimated_delivery?: string | null;
  estimatedDelivery?: string | null;

  delivered_at?: string | null;
  deliveredAt?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
}

export interface TrackingResult {
  shipment: Shipment | null;
  events: TrackingEvent[];
}

export interface ShipmentFilters {
  search?: string;

  status?: ShipmentStatus | string;

  customerId?: string;
  customer_id?: string;

  courierId?: string;
  courier_id?: string;

  facilityId?: string;
  facility_id?: string;

  page?: number;
  limit?: number;
}

export interface CreateShipmentInput
  extends Record<string, unknown> {
  tracking_number?: string;
  trackingNumber?: string;

  reference_number?: string;
  referenceNumber?: string;

  customer_id?: string;
  customerId?: string;

  sender_name?: string;
  senderName?: string;

  sender_email?: string;
  senderEmail?: string;

  sender_phone?: string;
  senderPhone?: string;

  receiver_name?: string;
  receiverName?: string;

  recipient_name?: string;
  recipientName?: string;

  receiver_email?: string;
  receiverEmail?: string;

  recipient_email?: string;
  recipientEmail?: string;

  receiver_phone?: string;
  receiverPhone?: string;

  recipient_phone?: string;
  recipientPhone?: string;

  origin?: string;
  destination?: string;

  origin_address?: string;
  originAddress?: string;

  destination_address?: string;
  destinationAddress?: string;

  origin_facility_id?: string;
  originFacilityId?: string;

  destination_facility_id?: string;
  destinationFacilityId?: string;

  service_type?: string;
  serviceType?: string;

  package_type?: string;
  packageType?: string;

  package_description?: string;
  packageDescription?: string;

  description?: string;

  weight?: number;

  weight_unit?: string;
  weightUnit?: string;

  status?: ShipmentStatus | string;

  estimated_delivery?: string;
  estimatedDelivery?: string;

  estimated_delivery_date?: string;
  estimatedDeliveryDate?: string;

  delivery_notes?: string;
  deliveryNotes?: string;
}

export interface UpdateShipmentInput
  extends Partial<CreateShipmentInput> {
  current_facility_id?: string;
  currentFacilityId?: string;

  assigned_courier_id?: string;
  assignedCourierId?: string;

  current_location?: string;
  currentLocation?: string;

  delivered_at?: string;
  deliveredAt?: string;

  actual_delivery?: string;
  actualDelivery?: string;

  actual_delivery_date?: string;
  actualDeliveryDate?: string;
}

export interface DashboardSummary {
  totalShipments?: number;
  total_shipments?: number;

  pendingShipments?: number;
  pending_shipments?: number;

  inTransitShipments?: number;
  in_transit_shipments?: number;

  deliveredShipments?: number;
  delivered_shipments?: number;

  exceptionShipments?: number;
  exception_shipments?: number;

  activeCouriers?: number;
  active_couriers?: number;

  totalCustomers?: number;
  total_customers?: number;

  totalFacilities?: number;
  total_facilities?: number;

  totalUsers?: number;
  total_users?: number;

  totalCouriers?: number;
  total_couriers?: number;

  recent_activity?: TrackingEvent[] | null;
  recentActivity?: TrackingEvent[] | null;

  [key: string]:
    | number
    | string
    | boolean
    | null
    | undefined
    | TrackingEvent[]
    | Record<string, unknown>;
}

export interface AdminSummary
  extends DashboardSummary {}

export type AdminDashboardSummary =
  AdminSummary;

export interface Notification {
  id: string;

  user_id?: string | null;
  userId?: string | null;

  title?: string | null;
  message?: string | null;
  body?: string | null;

  type?: string | null;
  status?: string | null;

  is_read?: boolean | null;
  isRead?: boolean | null;

  read?: boolean | null;

  created_at?: string | null;
  createdAt?: string | null;

  updated_at?: string | null;
  updatedAt?: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;

  totalPages?: number;
  total_pages?: number;
}

export interface AuthSession {
  access_token?: string | null;
  accessToken?: string | null;

  refresh_token?: string | null;
  refreshToken?: string | null;

  expires_at?: number | null;
  expiresAt?: number | null;
}

export interface AuthResult {
  user: User;
  session?: AuthSession | null;
}

export interface ApiListResponse<T> {
  data?: T[];
  items?: T[];
  results?: T[];

  total?: number;
  count?: number;

  page?: number;
  limit?: number;

  pagination?: Pagination;
}

export interface UserFilters {
  search?: string;
  query?: string;

  role?: UserRole | string;
  status?: AccountStatus | string;

  page?: number;
  limit?: number;
}

export function getUserFullName(
  user?: User | null
): string {
  if (!user) {
    return "";
  }

  const first =
    user.first_name ??
    user.firstName ??
    "";

  const last =
    user.last_name ??
    user.lastName ??
    "";

  return `${first} ${last}`.trim();
}

export function getCourierFullName(
  courier?: Courier | null
): string {
  if (!courier) {
    return "";
  }

  if (courier.name) {
    return courier.name;
  }

  const first =
    courier.first_name ??
    courier.firstName ??
    "";

  const last =
    courier.last_name ??
    courier.lastName ??
    "";

  return `${first} ${last}`.trim();
}

export function getShipmentStatusLabel(
  status?: string | null
): string {
  if (!status) {
    return "Unknown";
  }

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}