import { Generated, ColumnType } from 'kysely';

export type BoardingStatus = 
  | 'NOT_CHECKED_IN' 
  | 'CHECKED_IN' 
  | 'BOARDED' 
  | 'DENIED_BOARDING' 
  | 'OVERRIDDEN_BOARDING';

export type BookingStatus = 
  | 'DRAFT' 
  | 'SEAT_HELD' 
  | 'PENDING_PAYMENT' 
  | 'PAYMENT_SUBMITTED' 
  | 'PAYMENT_VERIFICATION' 
  | 'CONFIRMED' 
  | 'CHECKED_IN' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'EXPIRED' 
  | 'REFUNDED';

export type PaymentStatus = 
  | 'INITIATED' 
  | 'AWAITING_CUSTOMER_ACTION' 
  | 'SUBMITTED' 
  | 'SUCCESS' 
  | 'FAILED' 
  | 'EXPIRED' 
  | 'REQUIRES_MANUAL_REVIEW' 
  | 'REVERSED';

export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'OPERATOR_OWNER' 
  | 'OPERATIONS_MANAGER' 
  | 'BRANCH_MANAGER' 
  | 'TICKETING_CLERK' 
  | 'AGENT' 
  | 'CONDUCTOR' 
  | 'FINANCE' 
  | 'PASSENGER';

export interface UserTable {
  id: Generated<string>;
  phone_number: string | null;
  email: string | null;
  password_hash: string | null;
  full_name: string;
  role: UserRole;
  operator_id: string | null;
  branch_id: string | null;
  created_at: Generated<Date>;
}

export interface OperatorTable {
  id: Generated<string>;
  name: string;
  code: string | null;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
}

export interface BusTable {
  id: Generated<string>;
  operator_id: string;
  registration_number: string;
  bus_class: Generated<string>;
  capacity: number;
  created_at: Generated<Date>;
}

export interface RouteTable {
  id: Generated<string>;
  operator_id: string;
  origin: string;
  destination: string;
  base_fare_usd: string; // Kysely treats decimals as strings to avoid precision loss
  created_at: Generated<Date>;
}

export interface TripTable {
  id: Generated<string>;
  route_id: string;
  bus_id: string | null;
  departure_time: Date;
  arrival_time: Date | null;
  status: Generated<string>;
  override_fare_usd: string | null;
  created_at: Generated<Date>;
}

export interface SeatTable {
  id: Generated<string>;
  bus_id: string;
  seat_identifier: string;
  is_active: Generated<boolean>;
}

export interface BookingTable {
  id: Generated<string>;
  reference_code: string;
  trip_id: string;
  passenger_id: string;
  booked_by_user_id: string | null;
  status: Generated<BookingStatus>;
  total_amount: string;
  currency: Generated<string>;
  exchange_rate_applied: Generated<string>;
  expires_at: Date | null;
  created_at: Generated<Date>;
}

export interface BookingSeatTable {
  booking_id: string;
  trip_id: string;
  seat_id: string;
  passenger_name: string | null;
  passenger_id_number: string | null;
  boarding_status: Generated<BoardingStatus>;
}

export interface PaymentTable {
  id: Generated<string>;
  booking_id: string;
  amount: string;
  currency: string;
  provider: string;
  provider_reference: string | null;
  status: Generated<PaymentStatus>;
  handled_by_clerk: string | null;
  verified_by_finance: string | null;
  created_at: Generated<Date>;
}

export interface CheckinTable {
    id: Generated<string>;
    trip_id: string;
    booking_id: string;
    seat_id: string;
    action_type: string;
    boarding_state_before: BoardingStatus | null;
    boarding_state_after: BoardingStatus | null;
    performed_by_user_id: string | null;
    performed_at: Generated<Date>;
    idempotency_key: string;
    created_at: Generated<Date>;
}

export interface OverrideEventTable {
    id: Generated<string>;
    trip_id: string;
    booking_id: string;
    seat_id: string;
    override_action: string;
    reason_code: string;
    note: string | null;
    approved_by_user_id: string | null;
    created_at: Generated<Date>;
}

export interface AuditLogTable {
    id: Generated<string>;
    user_id: string | null;
    action: string;
    entity: string;
    entity_id: string;
    reason: string | null;
    created_at: Generated<Date>;
}

export interface AgentTable {
    id: Generated<string>;
    name: string;
    phone: string | null;
    branch_id: string | null;
    commission_rate_percentage: string;
    status: Generated<string>;
    created_at: Generated<Date>;
}

export interface AgentSaleTable {
    id: Generated<string>;
    agent_id: string;
    booking_id: string;
    sale_amount_usd: string;
    commission_earned_usd: string;
    status: Generated<string>;
    created_at: Generated<Date>;
}

export interface Database {
  users: UserTable;
  operators: OperatorTable;
  branches: BranchTable;
  buses: BusTable;
  routes: RouteTable;
  trips: TripTable;
  seats: SeatTable;
  bookings: BookingTable;
  booking_seats: BookingSeatTable;
  payments: PaymentTable;
  checkins: CheckinTable;
  override_events: OverrideEventTable;
  agents: AgentTable;
  agent_sales: AgentSaleTable;
  audit_logs: AuditLogTable;
}

export interface BranchTable {
    id: Generated<string>;
    operator_id: string;
    name: string;
    city: string;
    created_at: Generated<Date>;
}
