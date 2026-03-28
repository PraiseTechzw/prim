-- ZimBus Production Database Schema
-- Idempotent script for fresh or reset deployments

-- 1. CLEANUP (Optional: Remove if you want to preserve data)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS agent_sales CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS booking_seats CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS buses CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS operators CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS override_events CASCADE;
DROP TABLE IF EXISTS checkins CASCADE;

DROP TYPE IF EXISTS boarding_status CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- 2. ENUMS
CREATE TYPE boarding_status AS ENUM (
  'NOT_CHECKED_IN', 'CHECKED_IN', 'BOARDED', 'DENIED_BOARDING', 'OVERRIDDEN_BOARDING'
);

CREATE TYPE booking_status AS ENUM (
  'DRAFT', 'SEAT_HELD', 'PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 
  'PAYMENT_VERIFICATION', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 
  'CANCELLED', 'EXPIRED', 'REFUNDED'
);

CREATE TYPE payment_status AS ENUM (
  'INITIATED', 'AWAITING_CUSTOMER_ACTION', 'SUBMITTED', 'SUCCESS', 
  'FAILED', 'EXPIRED', 'REQUIRES_MANUAL_REVIEW', 'REVERSED'
);

CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN', 'OPERATOR_OWNER', 'OPERATIONS_MANAGER', 'BRANCH_MANAGER',
  'TICKETING_CLERK', 'AGENT', 'CONDUCTOR', 'FINANCE', 'PASSENGER'
);

-- 3. CORE TABLES
CREATE TABLE operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID REFERENCES operators(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'PASSENGER',
    operator_id UUID REFERENCES operators(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE buses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID REFERENCES operators(id) ON DELETE CASCADE,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    bus_class VARCHAR(50) DEFAULT 'Standard', 
    capacity INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID REFERENCES operators(id) ON DELETE CASCADE,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    base_fare_usd DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
    departure_time TIMESTAMP NOT NULL,
    arrival_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'SCHEDULED',
    override_fare_usd DECIMAL(10, 2), 
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trips_departure ON trips(departure_time);
CREATE INDEX idx_trips_route ON trips(route_id);

CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
    seat_identifier VARCHAR(10) NOT NULL, 
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(bus_id, seat_identifier)
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_code VARCHAR(30) UNIQUE NOT NULL,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    passenger_id UUID REFERENCES users(id) ON DELETE CASCADE,
    booked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL, 
    status booking_status DEFAULT 'DRAFT',
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    exchange_rate_applied DECIMAL(10, 4) DEFAULT 1.0000,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE booking_seats (
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    seat_id UUID REFERENCES seats(id) ON DELETE RESTRICT,
    passenger_name VARCHAR(255),
    passenger_id_number VARCHAR(100),
    boarding_status boarding_status DEFAULT 'NOT_CHECKED_IN',
    PRIMARY KEY (booking_id, seat_id)
);

CREATE TABLE checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    seat_id UUID REFERENCES seats(id), 
    action_type VARCHAR(20) NOT NULL, 
    boarding_state_before boarding_status,
    boarding_state_after boarding_status,
    performed_by_user_id UUID REFERENCES users(id),
    performed_at TIMESTAMP DEFAULT NOW(),
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE override_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(id),
    booking_id UUID REFERENCES bookings(id),
    seat_id UUID REFERENCES seats(id),
    override_action VARCHAR(50),
    reason_code VARCHAR(50),
    note TEXT,
    approved_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    provider VARCHAR(50) NOT NULL, 
    provider_reference VARCHAR(255),
    status payment_status DEFAULT 'INITIATED',
    handled_by_clerk UUID REFERENCES users(id), 
    verified_by_finance UUID REFERENCES users(id), 
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE,
    branch_id UUID REFERENCES branches(id),
    commission_rate_percentage DECIMAL(5, 2) DEFAULT 5.00,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agent_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id),
    booking_id UUID REFERENCES bookings(id),
    sale_amount_usd DECIMAL(10, 2),
    commission_earned_usd DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'UNPAID', 
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    entity VARCHAR(50),
    entity_id UUID,
    payload JSONB,
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. INDEXES
CREATE INDEX idx_checkins_trip ON checkins(trip_id);
CREATE INDEX idx_checkins_booking ON checkins(booking_id);
CREATE INDEX idx_agent_sales_agent ON agent_sales(agent_id);

-- Note: Complex double-booking prevention is handled at the application layer 
-- via transactions and Redis locks due to subquery limitations in Postgres indexes.
CREATE UNIQUE INDEX idx_booking_seat_unique ON booking_seats(booking_id, seat_id);
