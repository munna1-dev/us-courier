import type {
  Courier,
  DashboardSummary,
  Facility,
  Shipment,
  ShipmentFilters,
  TrackingEvent,
  TrackingResult,
  User,
} from "../types";

const API_BASE = "/api";

interface ApiError {
  message?: string;
  error?: string;
  detail?: string;
}

interface ApiEnvelope {
  data?: unknown;
  user?: unknown;
  shipment?: unknown;
  shipments?: unknown;
  events?: unknown;
  history?: unknown;
  couriers?: unknown;
  facilities?: unknown;
  dashboard?: unknown;
  users?: unknown;
  [key: string]: unknown;
}

export interface UserFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface CourierFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface FacilityFilters {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}

/* -------------------------------------------------------------------------- */
/* Generic request helpers                                                    */
/* -------------------------------------------------------------------------- */

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(
    options.headers
  );

  if (
    options.body &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }


  const response = await fetch(
    `${API_BASE}${path}`,
    {
      ...options,
      headers,
      credentials: "include",
    }
  );

  const text =
    await response.text();

  let payload: unknown = null;

  if (text) {
    try {
      payload =
        JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const error =
      isRecord(payload)
        ? (payload as ApiError)
        : {};

    throw new Error(
      error.message ??
        error.error ??
        error.detail ??
        `Request failed with status ${response.status}.`
    );
  }

  return payload as T;
}

export async function apiGet<T = unknown>(
  path: string
): Promise<T> {
  return request<T>(path);
}

export async function apiPost<T = unknown>(
  path: string,
  body?: unknown
): Promise<T> {
  return request<T>(
    path,
    {
      method: "POST",
      body:
        body === undefined
          ? undefined
          : JSON.stringify(body),
    }
  );
}

export async function apiPut<T = unknown>(
  path: string,
  body?: unknown
): Promise<T> {
  return request<T>(
    path,
    {
      method: "PUT",
      body:
        body === undefined
          ? undefined
          : JSON.stringify(body),
    }
  );
}

export async function apiDelete<T = unknown>(
  path: string
): Promise<T> {
  return request<T>(
    path,
    {
      method: "DELETE",
    }
  );
}

/* -------------------------------------------------------------------------- */
/* Runtime helpers                                                            */
/* -------------------------------------------------------------------------- */

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function getEnvelope(
  value: unknown
): ApiEnvelope {
  return isRecord(value)
    ? (value as ApiEnvelope)
    : {};
}

function unwrapData(
  value: unknown
): unknown {
  const source =
    getEnvelope(value);

  return source.data !== undefined
    ? source.data
    : value;
}

function stringValue(
  value: unknown,
  fallback = ""
): string {
  if (
    typeof value === "string"
  ) {
    return value;
  }

  if (value == null) {
    return fallback;
  }

  return String(value);
}

function nullableString(
  value: unknown
): string | null {
  return value == null
    ? null
    : stringValue(value);
}

function nullableNumber(
  value: unknown
): number | null {
  if (value == null) {
    return null;
  }

  const numberValue =
    typeof value === "number"
      ? value
      : Number(value);

  return Number.isFinite(
    numberValue
  )
    ? numberValue
    : null;
}

function buildQuery(
  params: Record<
    string,
    string | number | boolean | null | undefined
  >
): string {
  const searchParams =
    new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        searchParams.set(
          key,
          String(value)
        );
      }
    }
  );

  const query =
    searchParams.toString();

  return query
    ? `?${query}`
    : "";
}

/* -------------------------------------------------------------------------- */
/* Collection/object extraction                                               */
/* -------------------------------------------------------------------------- */

function extractArray(
  payload: unknown,
  keys: string[]
): unknown[] {
  const source =
    getEnvelope(payload);

  for (const key of keys) {
    if (
      Array.isArray(
        source[key]
      )
    ) {
      return source[key] as unknown[];
    }
  }

  const data =
    unwrapData(payload);

  if (Array.isArray(data)) {
    return data;
  }

  if (isRecord(data)) {
    for (const key of keys) {
      if (
        Array.isArray(
          data[key]
        )
      ) {
        return data[key] as unknown[];
      }
    }
  }

  return [];
}

function extractObject(
  payload: unknown,
  keys: string[]
): unknown {
  const source =
    getEnvelope(payload);

  for (const key of keys) {
    if (
      source[key] !== undefined
    ) {
      return source[key];
    }
  }

  const data =
    unwrapData(payload);

  if (isRecord(data)) {
    for (const key of keys) {
      if (
        data[key] !== undefined
      ) {
        return data[key];
      }
    }
  }

  return data;
}

/* -------------------------------------------------------------------------- */
/* User normalization                                                         */
/* -------------------------------------------------------------------------- */

function normalizeUser(
  value: unknown
): User | null {
  if (!isRecord(value)) {
    return null;
  }

  const role =
    value.role ??
    value.user_role ??
    value.userRole;

  const status =
    value.status ??
    value.account_status ??
    value.accountStatus;

  return {
    id: stringValue(
      value.id
    ),

    email: stringValue(
      value.email
    ),

    first_name:
      nullableString(
        value.first_name ??
          value.firstName
      ) ?? "",

    firstName:
      nullableString(
        value.firstName ??
          value.first_name
      ) ?? "",

    last_name:
      nullableString(
        value.last_name ??
          value.lastName
      ) ?? "",

    lastName:
      nullableString(
        value.lastName ??
          value.last_name
      ) ?? "",

    phone:
      nullableString(
        value.phone
      ),

    role:
      typeof role === "string"
        ? role.toLowerCase()
        : "customer",

    user_role:
      typeof role === "string"
        ? role.toLowerCase()
        : "customer",

    userRole:
      typeof role === "string"
        ? role.toLowerCase()
        : "customer",

    status:
      typeof status === "string"
        ? status.toLowerCase()
        : "active",

    account_status:
      typeof status === "string"
        ? status.toLowerCase()
        : "active",

    accountStatus:
      typeof status === "string"
        ? status.toLowerCase()
        : "active",

    avatar_url:
      nullableString(
        value.avatar_url ??
          value.avatarUrl
      ),

    avatarUrl:
      nullableString(
        value.avatarUrl ??
          value.avatar_url
      ),

    is_active:
      typeof value.is_active ===
      "boolean"
        ? value.is_active
        : typeof value.isActive ===
            "boolean"
          ? value.isActive
          : undefined,

    isActive:
      typeof value.isActive ===
      "boolean"
        ? value.isActive
        : typeof value.is_active ===
            "boolean"
          ? value.is_active
          : undefined,

    roles:
      Array.isArray(
        value.roles
      )
        ? value.roles.filter(
            (
              item
            ): item is string =>
              typeof item ===
              "string"
          )
        : undefined,

    created_at:
      nullableString(
        value.created_at ??
          value.createdAt
      ) ?? undefined,

    createdAt:
      nullableString(
        value.createdAt ??
          value.created_at
      ) ?? undefined,

    updated_at:
      nullableString(
        value.updated_at ??
          value.updatedAt
      ) ?? undefined,

    updatedAt:
      nullableString(
        value.updatedAt ??
          value.updated_at
      ) ?? undefined,
  };
}

/* -------------------------------------------------------------------------- */
/* Shipment normalization                                                     */
/* -------------------------------------------------------------------------- */

function normalizeShipment(
  value: unknown
): Shipment | null {
  if (!isRecord(value)) {
    return null;
  }

  const trackingNumber =
    stringValue(
      value.tracking_number ??
        value.trackingNumber
    );

  const status =
    stringValue(
      value.status,
      "pending"
    );

  return {
    id: stringValue(
      value.id
    ),

    tracking_number:
      trackingNumber,

    trackingNumber:
      trackingNumber,

    reference_number:
      nullableString(
        value.reference_number ??
          value.referenceNumber
      ),

    referenceNumber:
      nullableString(
        value.referenceNumber ??
          value.reference_number
      ),

    customer_id:
      nullableString(
        value.customer_id ??
          value.customerId
      ),

    customerId:
      nullableString(
        value.customerId ??
          value.customer_id
      ),

    sender_name:
      nullableString(
        value.sender_name ??
          value.senderName
      ),

    senderName:
      nullableString(
        value.senderName ??
          value.sender_name
      ),

    sender_email:
      nullableString(
        value.sender_email ??
          value.senderEmail
      ),

    senderEmail:
      nullableString(
        value.senderEmail ??
          value.sender_email
      ),

    sender_phone:
      nullableString(
        value.sender_phone ??
          value.senderPhone
      ),

    senderPhone:
      nullableString(
        value.senderPhone ??
          value.sender_phone
      ),

    recipient_name:
      nullableString(
        value.recipient_name ??
          value.recipientName ??
          value.receiver_name ??
          value.receiverName
      ),

    recipientName:
      nullableString(
        value.recipientName ??
          value.recipient_name ??
          value.receiver_name ??
          value.receiverName
      ),

    receiver_name:
      nullableString(
        value.receiver_name ??
          value.receiverName ??
          value.recipient_name ??
          value.recipientName
      ),

    receiverName:
      nullableString(
        value.receiverName ??
          value.receiver_name ??
          value.recipient_name ??
          value.recipientName
      ),

    recipient_email:
      nullableString(
        value.recipient_email ??
          value.recipientEmail ??
          value.receiver_email ??
          value.receiverEmail
      ),

    recipientEmail:
      nullableString(
        value.recipientEmail ??
          value.recipient_email ??
          value.receiver_email ??
          value.receiverEmail
      ),

    receiver_email:
      nullableString(
        value.receiver_email ??
          value.receiverEmail ??
          value.recipient_email ??
          value.recipientEmail
      ),

    receiverEmail:
      nullableString(
        value.receiverEmail ??
          value.receiver_email ??
          value.recipient_email ??
          value.recipientEmail
      ),

    recipient_phone:
      nullableString(
        value.recipient_phone ??
          value.recipientPhone ??
          value.receiver_phone ??
          value.receiverPhone
      ),

    recipientPhone:
      nullableString(
        value.recipientPhone ??
          value.recipient_phone ??
          value.receiver_phone ??
          value.receiverPhone
      ),

    receiver_phone:
      nullableString(
        value.receiver_phone ??
          value.receiverPhone ??
          value.recipient_phone ??
          value.recipientPhone
      ),

    receiverPhone:
      nullableString(
        value.receiverPhone ??
          value.receiver_phone ??
          value.recipient_phone ??
          value.recipientPhone
      ),

    sender_address_id:
      nullableString(
        value.sender_address_id ??
          value.senderAddressId
      ),

    senderAddressId:
      nullableString(
        value.senderAddressId ??
          value.sender_address_id
      ),

    recipient_address_id:
      nullableString(
        value.recipient_address_id ??
          value.recipientAddressId
      ),

    recipientAddressId:
      nullableString(
        value.recipientAddressId ??
          value.recipient_address_id
      ),

    origin_facility_id:
      nullableString(
        value.origin_facility_id ??
          value.originFacilityId
      ),

    originFacilityId:
      nullableString(
        value.originFacilityId ??
          value.origin_facility_id
      ),

    destination_facility_id:
      nullableString(
        value.destination_facility_id ??
          value.destinationFacilityId
      ),

    destinationFacilityId:
      nullableString(
        value.destinationFacilityId ??
          value.destination_facility_id
      ),

    current_facility_id:
      nullableString(
        value.current_facility_id ??
          value.currentFacilityId
      ),

    currentFacilityId:
      nullableString(
        value.currentFacilityId ??
          value.current_facility_id
      ),

    assigned_courier_id:
      nullableString(
        value.assigned_courier_id ??
          value.assignedCourierId
      ),

    assignedCourierId:
      nullableString(
        value.assignedCourierId ??
          value.assigned_courier_id
      ),

    service_type:
      nullableString(
        value.service_type ??
          value.serviceType
      ),

    serviceType:
      nullableString(
        value.serviceType ??
          value.service_type
      ),

    package_type:
      nullableString(
        value.package_type ??
          value.packageType
      ),

    packageType:
      nullableString(
        value.packageType ??
          value.package_type
      ),

    package_description:
      nullableString(
        value.package_description ??
          value.packageDescription ??
          value.description
      ),

    packageDescription:
      nullableString(
        value.packageDescription ??
          value.package_description
      ),

    description:
      nullableString(
        value.description ??
          value.package_description
      ),

    weight:
      nullableNumber(
        value.weight
      ),

    weight_unit:
      nullableString(
        value.weight_unit ??
          value.weightUnit
      ),

    weightUnit:
      nullableString(
        value.weightUnit ??
          value.weight_unit
      ),

    status,

    origin:
      nullableString(
        value.origin ??
          value.origin_facility_name ??
          value.originFacilityName
      ),

    destination:
      nullableString(
        value.destination ??
          value.destination_facility_name ??
          value.destinationFacilityName
      ),

    estimated_delivery_date:
      nullableString(
        value.estimated_delivery_date ??
          value.estimatedDeliveryDate ??
          value.estimated_delivery ??
          value.estimatedDelivery
      ),

    estimatedDeliveryDate:
      nullableString(
        value.estimatedDeliveryDate ??
          value.estimated_delivery_date ??
          value.estimated_delivery ??
          value.estimatedDelivery
      ),

    estimated_delivery:
      nullableString(
        value.estimated_delivery ??
          value.estimatedDelivery ??
          value.estimated_delivery_date
      ),

    estimatedDelivery:
      nullableString(
        value.estimatedDelivery ??
          value.estimated_delivery ??
          value.estimated_delivery_date
      ),

    actual_delivery:
      nullableString(
        value.actual_delivery ??
          value.actualDelivery ??
          value.actual_delivery_date ??
          value.actualDeliveryDate
      ),

    actualDelivery:
      nullableString(
        value.actualDelivery ??
          value.actual_delivery ??
          value.actual_delivery_date ??
          value.actualDeliveryDate
      ),

    actual_delivery_date:
      nullableString(
        value.actual_delivery_date ??
          value.actualDeliveryDate ??
          value.actual_delivery ??
          value.actualDelivery
      ),

    actualDeliveryDate:
      nullableString(
        value.actualDeliveryDate ??
          value.actual_delivery_date ??
          value.actual_delivery ??
          value.actualDelivery
      ),

    delivered_at:
      nullableString(
        value.delivered_at ??
          value.deliveredAt
      ),

    deliveredAt:
      nullableString(
        value.deliveredAt ??
          value.delivered_at
      ),

    delivery_notes:
      nullableString(
        value.delivery_notes ??
          value.deliveryNotes
      ),

    deliveryNotes:
      nullableString(
        value.deliveryNotes ??
          value.delivery_notes
      ),

    current_location:
      nullableString(
        value.current_location ??
          value.currentLocation
      ),

    currentLocation:
      nullableString(
        value.currentLocation ??
          value.current_location
      ),

    created_at:
      nullableString(
        value.created_at ??
          value.createdAt
      ) ?? undefined,

    createdAt:
      nullableString(
        value.createdAt ??
          value.created_at
      ) ?? undefined,

    updated_at:
      nullableString(
        value.updated_at ??
          value.updatedAt
      ) ?? undefined,

    updatedAt:
      nullableString(
        value.updatedAt ??
          value.updated_at
      ) ?? undefined,
  };
}

function normalizeShipmentList(
  value: unknown
): Shipment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeShipment)
    .filter(
      (
        shipment
      ): shipment is Shipment =>
        shipment !== null
    );
}

/* -------------------------------------------------------------------------- */
/* Tracking events                                                            */
/* -------------------------------------------------------------------------- */

function normalizeEvent(
  value: unknown
): TrackingEvent | null {
  if (!isRecord(value)) {
    return null;
  }

  const status =
    stringValue(
      value.status,
      "pending"
    );

  const shipmentId =
    nullableString(
      value.shipment_id ??
        value.shipmentId
    );

  const eventTime =
    nullableString(
      value.event_time ??
        value.eventTime ??
        value.created_at ??
        value.createdAt
    );

  return {
    id: stringValue(
      value.id
    ),

    shipment_id:
      shipmentId ?? undefined,

    shipmentId:
      shipmentId ?? undefined,

    status,

    title:
      nullableString(
        value.title
      ) ?? "Shipment update",

    description:
      nullableString(
        value.description
      ),

    location:
      nullableString(
        value.location
      ),

    facility_id:
      nullableString(
        value.facility_id ??
          value.facilityId
      ),

    facilityId:
      nullableString(
        value.facilityId ??
          value.facility_id
      ),

    courier_id:
      nullableString(
        value.courier_id ??
          value.courierId
      ),

    courierId:
      nullableString(
        value.courierId ??
          value.courier_id
      ),

    event_time:
      eventTime ?? undefined,

    eventTime:
      eventTime ?? undefined,

    created_at:
      nullableString(
        value.created_at ??
          value.createdAt
      ) ?? undefined,

    createdAt:
      nullableString(
        value.createdAt ??
          value.created_at
      ) ?? undefined,
  };
}

function normalizeEventList(
  value: unknown
): TrackingEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeEvent)
    .filter(
      (
        event
      ): event is TrackingEvent =>
        event !== null
    );
}

/* -------------------------------------------------------------------------- */
/* Courier normalization                                                      */
/* -------------------------------------------------------------------------- */

function normalizeCourier(
  value: unknown
): Courier | null {
  if (!isRecord(value)) {
    return null;
  }

  const id =
    stringValue(value.id);

  if (!id) {
    return null;
  }

  const firstName =
    nullableString(
      value.first_name ??
        value.firstName
    );

  const lastName =
    nullableString(
      value.last_name ??
        value.lastName
    );

  const name =
    nullableString(
      value.name
    ) ??
    `${firstName ?? ""} ${lastName ?? ""}`.trim();

  return {
    id,

    name,

    user_id:
      nullableString(
        value.user_id ??
          value.userId
      ),

    userId:
      nullableString(
        value.userId ??
          value.user_id
      ),

    employee_number:
      nullableString(
        value.employee_number ??
          value.employeeNumber
      ),

    employeeNumber:
      nullableString(
        value.employeeNumber ??
          value.employee_number
      ),

    first_name:
      firstName,

    firstName:
      firstName,

    last_name:
      lastName,

    lastName:
      lastName,

    email:
      nullableString(
        value.email
      ),

    phone:
      nullableString(
        value.phone
      ),

    status:
      nullableString(
        value.status
      ),

    vehicle_number:
      nullableString(
        value.vehicle_number ??
          value.vehicleNumber
      ),

    vehicleNumber:
      nullableString(
        value.vehicleNumber ??
          value.vehicle_number
      ),

    license_number:
      nullableString(
        value.license_number ??
          value.licenseNumber
      ),

    licenseNumber:
      nullableString(
        value.licenseNumber ??
          value.license_number
      ),

    current_facility_id:
      nullableString(
        value.current_facility_id ??
          value.currentFacilityId
      ),

    currentFacilityId:
      nullableString(
        value.currentFacilityId ??
          value.current_facility_id
      ),

    active:
      typeof value.active ===
      "boolean"
        ? value.active
        : undefined,

    is_active:
      typeof value.is_active ===
      "boolean"
        ? value.is_active
        : undefined,

    isActive:
      typeof value.isActive ===
      "boolean"
        ? value.isActive
        : undefined,

    created_at:
      nullableString(
        value.created_at ??
          value.createdAt
      ) ?? undefined,

    createdAt:
      nullableString(
        value.createdAt ??
          value.created_at
      ) ?? undefined,

    updated_at:
      nullableString(
        value.updated_at ??
          value.updatedAt
      ) ?? undefined,

    updatedAt:
      nullableString(
        value.updatedAt ??
          value.updated_at
      ) ?? undefined,
  };
}

/* -------------------------------------------------------------------------- */
/* Facility normalization                                                     */
/* -------------------------------------------------------------------------- */

function normalizeFacility(
  value: unknown
): Facility | null {
  if (!isRecord(value)) {
    return null;
  }

  const id =
    stringValue(value.id);

  const name =
    stringValue(
      value.name ??
        value.facility_name
    );

  if (!id || !name) {
    return null;
  }

  const code =
    nullableString(
      value.code ??
        value.facility_code
    );

  const type =
    nullableString(
      value.facility_type ??
        value.facilityType ??
        value.type ??
        value.category
    );

  return {
    id,

    name,

    facility_name:
      nullableString(
        value.facility_name ??
          value.name
      ),

    code,

    facility_code:
      code,

    facility_type:
      type,

    facilityType:
      type,

    type,

    category:
      nullableString(
        value.category ??
          value.type ??
          value.facility_type
      ),

    address:
      nullableString(
        value.address ??
          value.location
      ),

    location:
      nullableString(
        value.location ??
          value.address
      ),

    city:
      nullableString(
        value.city
      ),

    state:
      nullableString(
        value.state
      ),

    postal_code:
      nullableString(
        value.postal_code ??
          value.postalCode
      ),

    postalCode:
      nullableString(
        value.postalCode ??
          value.postal_code
      ),

    country:
      nullableString(
        value.country
      ),

    phone:
      nullableString(
        value.phone
      ),

    email:
      nullableString(
        value.email
      ),

    latitude:
      nullableNumber(
        value.latitude
      ),

    longitude:
      nullableNumber(
        value.longitude
      ),

    active:
      typeof value.active ===
      "boolean"
        ? value.active
        : typeof value.is_active ===
            "boolean"
          ? value.is_active
          : typeof value.isActive ===
              "boolean"
            ? value.isActive
            : typeof value.status ===
                "string"
              ? value.status.toLowerCase() ===
                "active"
              : true,

    is_active:
      typeof value.is_active ===
      "boolean"
        ? value.is_active
        : undefined,

    isActive:
      typeof value.isActive ===
      "boolean"
        ? value.isActive
        : undefined,

    status:
      nullableString(
        value.status
      ),

    created_at:
      nullableString(
        value.created_at ??
          value.createdAt
      ) ?? undefined,

    createdAt:
      nullableString(
        value.createdAt ??
          value.created_at
      ) ?? undefined,

    updated_at:
      nullableString(
        value.updated_at ??
          value.updatedAt
      ) ?? undefined,

    updatedAt:
      nullableString(
        value.updatedAt ??
          value.updated_at
      ) ?? undefined,
  };
}

/* -------------------------------------------------------------------------- */
/* Health                                                                     */
/* -------------------------------------------------------------------------- */

export async function getHealth() {
  return apiGet<{
    status: string;
    service: string;
    environment: string;
    timestamp: string;
  }>("/health");
}

/* -------------------------------------------------------------------------- */
/* Tracking                                                                   */
/* -------------------------------------------------------------------------- */

export async function getTracking(
  trackingNumber: string
): Promise<TrackingResult | null> {
  const normalized =
    trackingNumber.trim();

  if (!normalized) {
    return null;
  }

  const payload =
    await apiGet<unknown>(
      `/tracking/${encodeURIComponent(
        normalized
      )}`
    );

  const shipment =
    normalizeShipment(
      extractObject(
        payload,
        ["shipment"]
      )
    );

  if (!shipment) {
    return null;
  }

  const events =
    normalizeEventList(
      extractArray(
        payload,
        [
          "events",
          "history",
        ]
      )
    );

  return {
    shipment,
    events,
  };
}

export async function trackShipment(
  trackingNumber: string
): Promise<TrackingResult | null> {
  return getTracking(
    trackingNumber
  );
}

/* -------------------------------------------------------------------------- */
/* Authentication                                                             */
/* -------------------------------------------------------------------------- */

export async function getCurrentUser(): Promise<User | null> {
  try {
    const payload =
      await apiGet<unknown>(
        "/auth/me"
      );

    return normalizeUser(
      extractObject(
        payload,
        ["user"]
      )
    );
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<User | null> {
  return getCurrentUser();
}

export function getUserRole(
  user?: User | null
): User["role"] | null {
  return (
    user?.role ??
    user?.user_role ??
    user?.userRole ??
    null
  );
}

export async function signIn(
  email: string,
  password: string
): Promise<User> {
  const payload =
    await apiPost<unknown>(
      "/auth/signin",
      {
        email:
          email.trim(),
        password,
      }
    );

  const user =
    normalizeUser(
      extractObject(
        payload,
        ["user"]
      )
    );

  if (!user) {
    throw new Error(
      "Sign in succeeded but no user profile was returned."
    );
  }

  return user;
}

export async function signUp(
  inputOrFirstName:
    | {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
      }
    | string,
  lastName?: string,
  email?: string,
  password?: string
): Promise<User | null> {
  const input =
    typeof inputOrFirstName ===
    "string"
      ? {
          firstName:
            inputOrFirstName,
          lastName:
            lastName ?? "",
          email:
            email ?? "",
          password:
            password ?? "",
        }
      : inputOrFirstName;

  const payload =
    await apiPost<unknown>(
      "/auth/signup",
      {
        firstName:
          input.firstName.trim(),
        lastName:
          input.lastName.trim(),
        email:
          input.email.trim(),
        password:
          input.password,
      }
    );

  return normalizeUser(
    extractObject(
      payload,
      ["user"]
    )
  );
}

export async function signOut(): Promise<void> {
  await apiPost(
    "/auth/signout"
  );
}

export async function getProfile(): Promise<User | null> {
  const payload =
    await apiGet<unknown>(
      "/auth/profile"
    );

  return normalizeUser(
    extractObject(
      payload,
      ["user"]
    )
  );
}

/* -------------------------------------------------------------------------- */
/* Customer                                                                   */
/* -------------------------------------------------------------------------- */

export async function getCustomerDashboard(): Promise<DashboardSummary> {
  const payload =
    await apiGet<unknown>(
      "/customer/dashboard"
    );

  return normalizeDashboardSummary(
    extractObject(
      payload,
      ["dashboard"]
    )
  );
}

export async function getCustomerShipments(
  filters: ShipmentFilters = {}
): Promise<Shipment[]> {
  const payload =
    await apiGet<unknown>(
      `/customer/shipments${buildQuery(
        {
          search:
            filters.search,
          status:
            filters.status,
          page:
            filters.page,
          limit:
            filters.limit,
        }
      )}`
    );

  return normalizeShipmentList(
    extractArray(
      payload,
      [
        "shipments",
        "items",
        "results",
      ]
    )
  );
}

export async function getCustomerShipment(
  shipmentId: string
): Promise<{
  shipment: Shipment;
  events: TrackingEvent[];
}> {
  const payload =
    await apiGet<unknown>(
      `/customer/shipments/${encodeURIComponent(
        shipmentId
      )}`
    );

  const shipment =
    normalizeShipment(
      extractObject(
        payload,
        ["shipment"]
      )
    );

  if (!shipment) {
    throw new Error(
      "Shipment not found."
    );
  }

  return {
    shipment,
    events:
      normalizeEventList(
        extractArray(
          payload,
          [
            "events",
            "history",
          ]
        )
      ),
  };
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

function normalizeDashboardSummary(
  value: unknown
): DashboardSummary {
  if (!isRecord(value)) {
    return {};
  }

  const numberValue = (
    ...keys: string[]
  ): number | undefined => {
    for (const key of keys) {
      const candidate =
        value[key];

      if (
        typeof candidate ===
        "number"
      ) {
        return candidate;
      }

      if (
        typeof candidate ===
          "string" &&
        candidate.trim() !== ""
      ) {
        const parsed =
          Number(candidate);

        if (
          Number.isFinite(
            parsed
          )
        ) {
          return parsed;
        }
      }
    }

    return undefined;
  };

  return {
    total:
      numberValue(
        "total",
        "total_shipments"
      ),

    totalShipments:
      numberValue(
        "totalShipments",
        "total_shipments",
        "total"
      ),

    total_shipments:
      numberValue(
        "total_shipments",
        "totalShipments",
        "total"
      ),

    pending:
      numberValue(
        "pending",
        "pending_shipments"
      ),

    pendingShipments:
      numberValue(
        "pendingShipments",
        "pending_shipments",
        "pending"
      ),

    pending_shipments:
      numberValue(
        "pending_shipments",
        "pendingShipments",
        "pending"
      ),

    picked_up:
      numberValue(
        "picked_up",
        "pickedUp"
      ),

    pickedUp:
      numberValue(
        "pickedUp",
        "picked_up"
      ),

    in_transit:
      numberValue(
        "in_transit",
        "inTransit"
      ),

    inTransit:
      numberValue(
        "inTransit",
        "in_transit"
      ),

    delivered:
      numberValue(
        "delivered",
        "delivered_shipments"
      ),

    deliveredShipments:
      numberValue(
        "deliveredShipments",
        "delivered_shipments",
        "delivered"
      ),

    delivered_shipments:
      numberValue(
        "delivered_shipments",
        "deliveredShipments",
        "delivered"
      ),

    exception:
      numberValue(
        "exception",
        "exception_shipments"
      ),

    exceptionShipments:
      numberValue(
        "exceptionShipments",
        "exception_shipments",
        "exception"
      ),

    exception_shipments:
      numberValue(
        "exception_shipments",
        "exceptionShipments",
        "exception"
      ),

    cancelled:
      numberValue(
        "cancelled"
      ),

    activeCouriers:
      numberValue(
        "activeCouriers",
        "active_couriers"
      ),

    active_couriers:
      numberValue(
        "active_couriers",
        "activeCouriers"
      ),

    totalCustomers:
      numberValue(
        "totalCustomers",
        "total_customers"
      ),

    total_customers:
      numberValue(
        "total_customers",
        "totalCustomers"
      ),

    totalFacilities:
      numberValue(
        "totalFacilities",
        "total_facilities"
      ),

    total_facilities:
      numberValue(
        "total_facilities",
        "totalFacilities"
      ),

    totalUsers:
      numberValue(
        "totalUsers",
        "total_users"
      ),

    total_users:
      numberValue(
        "total_users",
        "totalUsers"
      ),

    shipments:
      normalizeShipmentList(
        value.shipments
      ),

    recent_activity:
      normalizeEventList(
        value.recent_activity ??
          value.recentActivity
      ),

    recentActivity:
      normalizeEventList(
        value.recentActivity ??
          value.recent_activity
      ),
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return getCustomerDashboard();
}

/* -------------------------------------------------------------------------- */
/* Admin dashboard                                                            */
/* -------------------------------------------------------------------------- */

export async function getAdminMe(): Promise<User | null> {
  const payload =
    await apiGet<unknown>(
      "/admin/me"
    );

  return normalizeUser(
    extractObject(
      payload,
      ["user"]
    )
  );
}

export async function getAdminDashboard(): Promise<DashboardSummary> {
  const payload =
    await apiGet<unknown>(
      "/admin/dashboard"
    );

  return normalizeDashboardSummary(
    extractObject(
      payload,
      ["dashboard"]
    )
  );
}

export async function getAdminSummary(): Promise<DashboardSummary> {
  return getAdminDashboard();
}

/* -------------------------------------------------------------------------- */
/* Users                                                                      */
/* -------------------------------------------------------------------------- */

export async function getAdminUsers(
  filters: UserFilters = {}
): Promise<User[]> {
  const payload =
    await apiGet<unknown>(
      `/admin/users${buildQuery(
        {
          search:
            filters.search,
          page:
            filters.page,
          limit:
            filters.limit,
        }
      )}`
    );

  return extractArray(
    payload,
    [
      "users",
      "items",
      "results",
    ]
  )
    .map(normalizeUser)
    .filter(
      (
        user
      ): user is User =>
        user !== null
    );
}

export async function getUsers(
  filters: UserFilters = {}
): Promise<User[]> {
  return getAdminUsers(
    filters
  );
}

export async function getAdminUser(
  userId: string
): Promise<User> {
  const payload =
    await apiGet<unknown>(
      `/admin/users/${encodeURIComponent(
        userId
      )}`
    );

  const user =
    normalizeUser(
      extractObject(
        payload,
        ["user"]
      )
    );

  if (!user) {
    throw new Error(
      "User not found."
    );
  }

  return user;
}

export async function updateAdminUser(
  userId: string,
  input: Record<
    string,
    unknown
  >
): Promise<User> {
  const payload =
    await apiPut<unknown>(
      `/admin/users/${encodeURIComponent(
        userId
      )}`,
      input
    );

  const user =
    normalizeUser(
      extractObject(
        payload,
        ["user"]
      )
    );

  if (!user) {
    throw new Error(
      "The server did not return the updated user."
    );
  }

  return user;
}

export async function deleteAdminUser(
  userId: string
): Promise<void> {
  await apiDelete(
    `/admin/users/${encodeURIComponent(
      userId
    )}`
  );
}

/* -------------------------------------------------------------------------- */
/* Couriers                                                                   */
/* -------------------------------------------------------------------------- */

export async function getAdminCouriers(
  filters: CourierFilters = {}
): Promise<Courier[]> {
  const payload =
    await apiGet<unknown>(
      `/admin/couriers${buildQuery(
        {
          search:
            filters.search,
          status:
            filters.status,
          page:
            filters.page,
          limit:
            filters.limit,
        }
      )}`
    );

  return extractArray(
    payload,
    [
      "couriers",
      "items",
      "results",
    ]
  )
    .map(normalizeCourier)
    .filter(
      (
        courier
      ): courier is Courier =>
        courier !== null
    );
}

export async function getCouriers(
  filters: CourierFilters = {}
): Promise<Courier[]> {
  return getAdminCouriers(
    filters
  );
}

export async function createAdminCourier(
  input: Record<
    string,
    unknown
  >
): Promise<Courier> {
  const payload =
    await apiPost<unknown>(
      "/admin/couriers",
      input
    );

  const courier =
    normalizeCourier(
      extractObject(
        payload,
        ["courier"]
      )
    );

  if (!courier) {
    throw new Error(
      "The server did not return the created courier."
    );
  }

  return courier;
}

export async function deleteAdminCourier(
  courierId: string
): Promise<void> {
  await apiDelete(
    `/admin/couriers/${encodeURIComponent(
      courierId
    )}`
  );
}

/* -------------------------------------------------------------------------- */
/* Facilities                                                                 */
/* -------------------------------------------------------------------------- */

export async function getAdminFacilities(
  filters: FacilityFilters = {}
): Promise<Facility[]> {
  const payload =
    await apiGet<unknown>(
      `/admin/facilities${buildQuery(
        {
          search:
            filters.search,
          type:
            filters.type,
          status:
            filters.status,
          page:
            filters.page,
          limit:
            filters.limit,
        }
      )}`
    );

  return extractArray(
    payload,
    [
      "facilities",
      "items",
      "results",
    ]
  )
    .map(normalizeFacility)
    .filter(
      (
        facility
      ): facility is Facility =>
        facility !== null
    );
}

export async function getFacilities(
  filters: FacilityFilters = {}
): Promise<Facility[]> {
  return getAdminFacilities(
    filters
  );
}

export async function createAdminFacility(
  input: Record<
    string,
    unknown
  >
): Promise<Facility> {
  const payload =
    await apiPost<unknown>(
      "/admin/facilities",
      input
    );

  const facility =
    normalizeFacility(
      extractObject(
        payload,
        ["facility"]
      )
    );

  if (!facility) {
    throw new Error(
      "The server did not return the created facility."
    );
  }

  return facility;
}

export async function deleteAdminFacility(
  facilityId: string
): Promise<void> {
  await apiDelete(
    `/admin/facilities/${encodeURIComponent(
      facilityId
    )}`
  );
}

/* -------------------------------------------------------------------------- */
/* Shipments                                                                  */
/* -------------------------------------------------------------------------- */

export async function getAdminShipments(
  filters: ShipmentFilters = {}
): Promise<Shipment[]> {
  const payload =
    await apiGet<unknown>(
      `/admin/shipments${buildQuery(
        {
          search:
            filters.search,
          status:
            filters.status,
          customer_id:
            filters.customer_id ??
            filters.customerId,
          courier_id:
            filters.courier_id ??
            filters.courierId,
          facility_id:
            filters.facility_id ??
            filters.facilityId,
          page:
            filters.page,
          limit:
            filters.limit,
        }
      )}`
    );

  return normalizeShipmentList(
    extractArray(
      payload,
      [
        "shipments",
        "items",
        "results",
      ]
    )
  );
}

export async function getShipments(
  filters: ShipmentFilters = {}
): Promise<Shipment[]> {
  return getAdminShipments(
    filters
  );
}

export async function getAdminShipment(
  shipmentId: string
): Promise<Shipment> {
  const payload =
    await apiGet<unknown>(
      `/admin/shipments/${encodeURIComponent(
        shipmentId
      )}`
    );

  const shipment =
    normalizeShipment(
      extractObject(
        payload,
        ["shipment"]
      )
    );

  if (!shipment) {
    throw new Error(
      "Shipment not found."
    );
  }

  return shipment;
}

export async function getShipment(
  shipmentId: string
): Promise<Shipment> {
  return getAdminShipment(
    shipmentId
  );
}

export async function createAdminShipment(
  input: Record<
    string,
    unknown
  >
): Promise<Shipment> {
  const payload =
    await apiPost<unknown>(
      "/admin/shipments",
      input
    );

  const shipment =
    normalizeShipment(
      extractObject(
        payload,
        ["shipment"]
      )
    );

  if (!shipment) {
    throw new Error(
      "The server did not return the created shipment."
    );
  }

  return shipment;
}

export async function createShipment(
  input: Record<
    string,
    unknown
  >
): Promise<Shipment> {
  return createAdminShipment(
    input
  );
}

export async function updateAdminShipment(
  shipmentId: string,
  input: Record<
    string,
    unknown
  >
): Promise<Shipment> {
  const payload =
    await apiPut<unknown>(
      `/admin/shipments/${encodeURIComponent(
        shipmentId
      )}`,
      input
    );

  const shipment =
    normalizeShipment(
      extractObject(
        payload,
        ["shipment"]
      )
    );

  if (!shipment) {
    throw new Error(
      "The server did not return the updated shipment."
    );
  }

  return shipment;
}

export async function updateShipment(
  shipmentId: string,
  input: Record<
    string,
    unknown
  >
): Promise<Shipment> {
  return updateAdminShipment(
    shipmentId,
    input
  );
}

export async function deleteAdminShipment(
  shipmentId: string
): Promise<void> {
  await apiDelete(
    `/admin/shipments/${encodeURIComponent(
      shipmentId
    )}`
  );
}

export async function deleteShipment(
  shipmentId: string
): Promise<void> {
  return deleteAdminShipment(
    shipmentId
  );
}

/* -------------------------------------------------------------------------- */
/* Dispatch                                                                   */
/* -------------------------------------------------------------------------- */

export async function dispatchShipment(
  shipmentId: string,
  input:
    | Record<string, unknown>
    | string
    | undefined = undefined
): Promise<Shipment> {
  const body =
    typeof input === "string"
      ? {
          assigned_courier_id:
            input,
        }
      : input ?? {};

  const payload =
    await apiPost<unknown>(
      `/admin/shipments/${encodeURIComponent(
        shipmentId
      )}/dispatch`,
      body
    );

  const shipment =
    normalizeShipment(
      extractObject(
        payload,
        ["shipment"]
      )
    );

  if (!shipment) {
    throw new Error(
      "The server did not return the dispatched shipment."
    );
  }

  return shipment;
}

/* -------------------------------------------------------------------------- */
/* Shipment history                                                           */
/* -------------------------------------------------------------------------- */

export async function getAdminShipmentHistory(
  shipmentId: string
): Promise<TrackingEvent[]> {
  const payload =
    await apiGet<unknown>(
      `/admin/shipments/${encodeURIComponent(
        shipmentId
      )}/history`
    );

  return normalizeEventList(
    extractArray(
      payload,
      [
        "events",
        "history",
        "items",
        "results",
      ]
    )
  );
}

export async function addAdminShipmentEvent(
  shipmentId: string,
  input: Record<
    string,
    unknown
  >
): Promise<TrackingEvent> {
  const payload =
    await apiPost<unknown>(
      `/admin/shipments/${encodeURIComponent(
        shipmentId
      )}/events`,
      input
    );

  const event =
    normalizeEvent(
      extractObject(
        payload,
        ["event"]
      )
    );

  if (!event) {
    throw new Error(
      "The server did not return the created tracking event."
    );
  }

  return event;
}