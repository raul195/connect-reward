-- ============================================================
-- Connect Reward — Demo Seed Data for Presentations
-- ============================================================
-- Run this in Supabase SQL Editor after running all migrations.
-- This creates realistic demo data for screenshots and presentations.
--
-- IMPORTANT: This seed bypasses auth.users for demo purposes.
-- For real logins, create users via Supabase Auth first.
-- ============================================================

-- ============================================================
-- 1. DEMO COMPANY: SunBright Solar
-- ============================================================
INSERT INTO companies (id, name, slug, logo_url, plan, settings)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'SunBright Solar',
  'sunbright-solar',
  NULL,
  'growth',
  '{
    "milestone_bonus": 500,
    "milestone_threshold": 5,
    "review_points": 25,
    "photo_review_bonus": 10,
    "points_expiration": "never",
    "brandColor": "#0D9488",
    "secondaryColor": "#F59E0B",
    "accentColor": "#10B981"
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  settings = EXCLUDED.settings;

-- ============================================================
-- 2. DEMO SERVICES (for service-based points)
-- ============================================================
INSERT INTO services (id, company_id, name, description, points_value, display_order, is_active) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', '11111111-1111-1111-1111-111111111111', 'Full Solar Installation', 'Complete residential solar panel installation (6-12kW system)', 500, 1, true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002', '11111111-1111-1111-1111-111111111111', 'Battery Storage Add-on', 'Tesla Powerwall or similar battery backup system', 300, 2, true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa003', '11111111-1111-1111-1111-111111111111', 'Solar Roof Tiles', 'Premium integrated solar roof tile installation', 750, 3, true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa004', '11111111-1111-1111-1111-111111111111', 'EV Charger Installation', 'Level 2 home EV charging station setup', 150, 4, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. DEMO CONTRACTOR (Owner) — Mike Reynolds
-- ============================================================
-- Note: For actual login, create this user in Supabase Auth first
INSERT INTO profiles (id, company_id, role, full_name, email, phone, loyalty_tier, total_points, address, city, state, zip)
VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccc0001',
  '11111111-1111-1111-1111-111111111111',
  'contractor',
  'Mike Reynolds',
  'mike@sunbrightsolar.com',
  '(801) 555-0100',
  'bronze',
  0,
  '100 Solar Plaza',
  'Salt Lake City',
  'UT',
  '84101'
)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- ============================================================
-- 4. DEMO TEAM MEMBERS
-- ============================================================
INSERT INTO profiles (id, company_id, role, full_name, email, phone, loyalty_tier, total_points) VALUES
('cccccccc-cccc-cccc-cccc-cccccccc0002', '11111111-1111-1111-1111-111111111111', 'contractor', 'Sarah Chen', 'sarah@sunbrightsolar.com', '(801) 555-0101', 'bronze', 0),
('cccccccc-cccc-cccc-cccc-cccccccc0003', '11111111-1111-1111-1111-111111111111', 'contractor', 'James Martinez', 'james@sunbrightsolar.com', '(801) 555-0102', 'bronze', 0),
('cccccccc-cccc-cccc-cccc-cccccccc0004', '11111111-1111-1111-1111-111111111111', 'contractor', 'Lisa Thompson', 'lisa@sunbrightsolar.com', '(801) 555-0103', 'bronze', 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. DEMO CUSTOMERS (15 customers with varying engagement)
-- ============================================================
INSERT INTO profiles (id, company_id, role, full_name, email, phone, address, city, state, zip, loyalty_tier, total_points, created_at) VALUES
-- Top performers (Gold/Platinum tier)
('dddddddd-dddd-dddd-dddd-dddddddd0001', '11111111-1111-1111-1111-111111111111', 'customer', 'John Smith', 'john.smith@email.com', '(801) 555-1001', '742 Evergreen Terrace', 'Salt Lake City', 'UT', '84101', 'gold', 3500, NOW() - INTERVAL '6 months'),
('dddddddd-dddd-dddd-dddd-dddddddd0002', '11111111-1111-1111-1111-111111111111', 'customer', 'Maria Garcia', 'maria.garcia@email.com', '(801) 555-1002', '123 Oak Street', 'Provo', 'UT', '84601', 'gold', 2700, NOW() - INTERVAL '5 months'),
('dddddddd-dddd-dddd-dddd-dddddddd0003', '11111111-1111-1111-1111-111111111111', 'customer', 'David Wilson', 'david.wilson@email.com', '(801) 555-1003', '456 Pine Ave', 'Ogden', 'UT', '84401', 'silver', 2500, NOW() - INTERVAL '4 months'),

-- Mid-tier (Silver)
('dddddddd-dddd-dddd-dddd-dddddddd0004', '11111111-1111-1111-1111-111111111111', 'customer', 'Jennifer Lee', 'jennifer.lee@email.com', '(801) 555-1004', '789 Maple Dr', 'Sandy', 'UT', '84070', 'silver', 1500, NOW() - INTERVAL '4 months'),
('dddddddd-dddd-dddd-dddd-dddddddd0005', '11111111-1111-1111-1111-111111111111', 'customer', 'Robert Brown', 'robert.brown@email.com', '(801) 555-1005', '321 Cedar Ln', 'Draper', 'UT', '84020', 'silver', 1500, NOW() - INTERVAL '3 months'),
('dddddddd-dddd-dddd-dddd-dddddddd0006', '11111111-1111-1111-1111-111111111111', 'customer', 'Emily Davis', 'emily.davis@email.com', '(801) 555-1006', '654 Birch Rd', 'Lehi', 'UT', '84043', 'silver', 1000, NOW() - INTERVAL '3 months'),
('dddddddd-dddd-dddd-dddd-dddddddd0007', '11111111-1111-1111-1111-111111111111', 'customer', 'Michael Johnson', 'michael.johnson@email.com', '(801) 555-1007', '987 Willow Way', 'Orem', 'UT', '84057', 'silver', 1000, NOW() - INTERVAL '2 months'),

-- Newer/lower tier (Bronze)
('dddddddd-dddd-dddd-dddd-dddddddd0008', '11111111-1111-1111-1111-111111111111', 'customer', 'Sarah Martinez', 'sarah.martinez@email.com', '(801) 555-1008', '147 Elm St', 'Murray', 'UT', '84107', 'bronze', 750, NOW() - INTERVAL '2 months'),
('dddddddd-dddd-dddd-dddd-dddddddd0009', '11111111-1111-1111-1111-111111111111', 'customer', 'Chris Taylor', 'chris.taylor@email.com', '(801) 555-1009', '258 Spruce Ct', 'West Jordan', 'UT', '84088', 'bronze', 525, NOW() - INTERVAL '6 weeks'),
('dddddddd-dddd-dddd-dddd-dddddddd0010', '11111111-1111-1111-1111-111111111111', 'customer', 'Amanda White', 'amanda.white@email.com', '(801) 555-1010', '369 Aspen Pl', 'Taylorsville', 'UT', '84123', 'bronze', 500, NOW() - INTERVAL '5 weeks'),
('dddddddd-dddd-dddd-dddd-dddddddd0011', '11111111-1111-1111-1111-111111111111', 'customer', 'Kevin Anderson', 'kevin.anderson@email.com', '(801) 555-1011', '741 Poplar Blvd', 'Riverton', 'UT', '84065', 'bronze', 300, NOW() - INTERVAL '4 weeks'),
('dddddddd-dddd-dddd-dddd-dddddddd0012', '11111111-1111-1111-1111-111111111111', 'customer', 'Jessica Thomas', 'jessica.thomas@email.com', '(801) 555-1012', '852 Hickory Ln', 'Herriman', 'UT', '84096', 'bronze', 250, NOW() - INTERVAL '3 weeks'),
('dddddddd-dddd-dddd-dddd-dddddddd0013', '11111111-1111-1111-1111-111111111111', 'customer', 'Brian Jackson', 'brian.jackson@email.com', '(801) 555-1013', '963 Walnut Ave', 'South Jordan', 'UT', '84095', 'bronze', 50, NOW() - INTERVAL '2 weeks'),
('dddddddd-dddd-dddd-dddd-dddddddd0014', '11111111-1111-1111-1111-111111111111', 'customer', 'Nicole Harris', 'nicole.harris@email.com', '(801) 555-1014', '174 Chestnut Dr', 'Cottonwood Heights', 'UT', '84121', 'bronze', 25, NOW() - INTERVAL '1 week'),
('dddddddd-dddd-dddd-dddd-dddddddd0015', '11111111-1111-1111-1111-111111111111', 'customer', 'Ryan Clark', 'ryan.clark@email.com', '(801) 555-1015', '285 Sycamore St', 'Holladay', 'UT', '84117', 'bronze', 0, NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. DEMO REFERRALS (24 referrals across all statuses)
-- ============================================================
INSERT INTO referrals (id, company_id, referrer_id, service_id, referee_name, referee_email, referee_phone, service_type, status, points_awarded, notes, created_at) VALUES
-- Completed / Won (8)
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0001', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', 'Tom Henderson', 'tom.h@email.com', '(801) 555-2001', 'Neighbor', 'won', 500, 'Address: 111 Solar Way, Salt Lake City, UT 84101', NOW() - INTERVAL '5 months'),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0002', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', 'Nancy Drew', 'nancy.d@email.com', '(801) 555-2002', 'Friend', 'won', 500, 'Address: 222 Sun Blvd, Provo, UT 84601', NOW() - INTERVAL '4 months'),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0003', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002', 'Steve Rogers', 'steve.r@email.com', '(801) 555-2003', 'Coworker', 'won', 300, 'Address: 333 Power St, Ogden, UT 84401', NOW() - INTERVAL '3 months'),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0004', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', 'Diana Prince', 'diana.p@email.com', '(801) 555-2004', 'Family', 'won', 500, 'Address: 444 Energy Ave, Sandy, UT 84070', NOW() - INTERVAL '4 months'),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0005', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa003', 'Bruce Wayne', 'bruce.w@email.com', '(801) 555-2005', 'Friend', 'won', 750, 'Address: 555 Manor Dr, Draper, UT 84020', NOW() - INTERVAL '2 months'),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0006', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', 'Clark Kent', 'clark.k@email.com', '(801) 555-2006', 'Neighbor', 'won', 500, 'Address: 666 Sunshine Rd, Lehi, UT 84043', NOW() - INTERVAL '3 months'),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0007', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002', 'Lois Lane', 'lois.l@email.com', '(801) 555-2007', 'Friend', 'won', 300, 'Address: 777 Daily Pl, Orem, UT 84057', NOW() - INTERVAL '2 months'),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0008', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', 'Peter Parker', 'peter.p@email.com', '(801) 555-2008', 'Coworker', 'won', 500, 'Address: 888 Web St, Murray, UT 84107', NOW() - INTERVAL '1 month'),

-- Quote Sent / Quoted (4)
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0009', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', 'Mary Jane', 'mary.j@email.com', '(801) 555-2009', 'Friend', 'quoted', 0, 'Address: 999 Broadway, West Jordan, UT 84088', NOW() - INTERVAL '2 weeks'),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0010', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002', 'Harry Osborn', 'harry.o@email.com', '(801) 555-2010', 'Friend', 'quoted', 0, 'Address: 101 Green Ln, Taylorsville, UT 84123', NOW() - INTERVAL '10 days'),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0011', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', 'Gwen Stacy', 'gwen.s@email.com', '(801) 555-2011', 'Neighbor', 'quoted', 0, 'Address: 202 Bridge Ave, Riverton, UT 84065', NOW() - INTERVAL '1 week'),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0012', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', 'Miles Morales', 'miles.m@email.com', '(801) 555-2012', 'Family', 'quoted', 0, 'Address: 303 Brooklyn St, Herriman, UT 84096', NOW() - INTERVAL '5 days'),

-- Contacted (5)
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0013', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', 'Tony Stark', 'tony.s@email.com', '(801) 555-2013', 'Coworker', 'contacted', 0, 'Address: 404 Malibu Pt, South Jordan, UT 84095', NOW() - INTERVAL '4 days'),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0014', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002', 'Pepper Potts', 'pepper.p@email.com', '(801) 555-2014', 'Friend', 'contacted', 0, 'Address: 505 Stark Tower, Cottonwood Heights, UT 84121', NOW() - INTERVAL '3 days'),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0015', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0008', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', 'Happy Hogan', 'happy.h@email.com', '(801) 555-2015', 'Neighbor', 'contacted', 0, 'Address: 606 Security Blvd, Holladay, UT 84117', NOW() - INTERVAL '2 days'),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0016', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0009', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002', 'Rhodey Rhodes', 'rhodey.r@email.com', '(801) 555-2016', 'Coworker', 'contacted', 0, 'Address: 707 Air Force Way, Salt Lake City, UT 84101', NOW() - INTERVAL '1 day'),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0017', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', 'Vision Android', 'vision.a@email.com', '(801) 555-2017', 'Other', 'contacted', 0, 'Address: 808 Mind Stone Dr, Provo, UT 84601', NOW() - INTERVAL '12 hours'),

-- Pending / Submitted (5)
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0018', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', 'Wanda Maximoff', 'wanda.m@email.com', '(801) 555-2018', 'Friend', 'pending', 0, 'Address: 909 Hex Ln, Ogden, UT 84401', NOW() - INTERVAL '6 hours'),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0019', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', 'Sam Wilson', 'sam.w@email.com', '(801) 555-2019', 'Neighbor', 'pending', 0, 'Address: 110 Falcon Ave, Sandy, UT 84070', NOW() - INTERVAL '3 hours'),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0020', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0011', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002', 'Bucky Barnes', 'bucky.b@email.com', '(801) 555-2020', 'Friend', 'pending', 0, 'Address: 211 Winter Rd, Draper, UT 84020', NOW() - INTERVAL '2 hours'),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0021', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', 'Scott Lang', 'scott.l@email.com', '(801) 555-2022', 'Neighbor', 'pending', 0, 'Address: 413 Quantum Blvd, Orem, UT 84057', NOW() - INTERVAL '30 minutes'),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0022', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa002', 'Hope Van Dyne', 'hope.v@email.com', '(801) 555-2023', 'Family', 'pending', 0, 'Address: 514 Pym Tech Dr, Murray, UT 84107', NOW() - INTERVAL '15 minutes'),

-- Lost / Cancelled (2)
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0023', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', 'Thanos Titan', 'thanos.t@email.com', '(801) 555-2025', 'Other', 'lost', 0, 'Customer decided not to proceed', NOW() - INTERVAL '1 month'),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0024', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0012', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa001', 'Loki Laufeyson', 'loki.l@email.com', '(801) 555-2026', 'Friend', 'expired', 0, 'No response after multiple contact attempts', NOW() - INTERVAL '2 months')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. DEMO REWARDS CATALOG
-- ============================================================
INSERT INTO rewards (id, company_id, name, description, type, points_cost, min_tier, active, quantity_left) VALUES
('wwwwwwww-wwww-wwww-wwww-wwwwwwww0001', '11111111-1111-1111-1111-111111111111', '$25 Amazon Gift Card', 'Digital gift card delivered via email within 24 hours', 'gift_card', 250, 'bronze', true, NULL),
('wwwwwwww-wwww-wwww-wwww-wwwwwwww0002', '11111111-1111-1111-1111-111111111111', '$50 Amazon Gift Card', 'Digital gift card delivered via email within 24 hours', 'gift_card', 500, 'bronze', true, NULL),
('wwwwwwww-wwww-wwww-wwww-wwwwwwww0003', '11111111-1111-1111-1111-111111111111', '$100 Amazon Gift Card', 'Digital gift card delivered via email within 24 hours', 'gift_card', 1000, 'silver', true, NULL),
('wwwwwwww-wwww-wwww-wwww-wwwwwwww0004', '11111111-1111-1111-1111-111111111111', '$25 Home Depot Gift Card', 'Perfect for your next home improvement project', 'gift_card', 250, 'bronze', true, NULL),
('wwwwwwww-wwww-wwww-wwww-wwwwwwww0005', '11111111-1111-1111-1111-111111111111', '$50 Restaurant Gift Card', 'Choose from popular local restaurants', 'gift_card', 500, 'bronze', true, NULL),
('wwwwwwww-wwww-wwww-wwww-wwwwwwww0006', '11111111-1111-1111-1111-111111111111', 'Yeti Rambler 20oz Tumbler', 'Premium insulated tumbler in your choice of color', 'custom', 300, 'bronze', true, 50),
('wwwwwwww-wwww-wwww-wwww-wwwwwwww0007', '11111111-1111-1111-1111-111111111111', 'Yeti Cooler (Roadie 24)', 'Portable hard cooler perfect for outdoor adventures', 'custom', 1500, 'silver', true, 10),
('wwwwwwww-wwww-wwww-wwww-wwwwwwww0008', '11111111-1111-1111-1111-111111111111', 'Smart Thermostat', 'Nest or Ecobee smart thermostat with installation credit', 'custom', 800, 'silver', true, 25),
('wwwwwwww-wwww-wwww-wwww-wwwwwwww0009', '11111111-1111-1111-1111-111111111111', 'Apple AirPods Pro', 'Latest generation with active noise cancellation', 'custom', 1200, 'gold', true, 15),
('wwwwwwww-wwww-wwww-wwww-wwwwwwww0010', '11111111-1111-1111-1111-111111111111', '55" 4K Smart TV', 'Samsung or LG 4K UHD Smart TV', 'custom', 2500, 'gold', true, 5),
('wwwwwwww-wwww-wwww-wwww-wwwwwwww0011', '11111111-1111-1111-1111-111111111111', 'Weekend Getaway Package', '2-night stay at a local resort or Airbnb credit', 'custom', 3000, 'gold', true, NULL),
('wwwwwwww-wwww-wwww-wwww-wwwwwwww0012', '11111111-1111-1111-1111-111111111111', 'Hawaiian Vacation Package', 'Flights + 5-night stay for two in Maui', 'custom', 7500, 'platinum', true, 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. DEMO REDEMPTIONS
-- ============================================================
INSERT INTO redemptions (id, reward_id, profile_id, company_id, status, created_at) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeee0001', 'wwwwwwww-wwww-wwww-wwww-wwwwwwww0003', 'dddddddd-dddd-dddd-dddd-dddddddd0001', '11111111-1111-1111-1111-111111111111', 'fulfilled', NOW() - INTERVAL '2 months'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeee0002', 'wwwwwwww-wwww-wwww-wwww-wwwwwwww0002', 'dddddddd-dddd-dddd-dddd-dddddddd0002', '11111111-1111-1111-1111-111111111111', 'fulfilled', NOW() - INTERVAL '6 weeks'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeee0003', 'wwwwwwww-wwww-wwww-wwww-wwwwwwww0002', 'dddddddd-dddd-dddd-dddd-dddddddd0004', '11111111-1111-1111-1111-111111111111', 'fulfilled', NOW() - INTERVAL '3 weeks'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeee0004', 'wwwwwwww-wwww-wwww-wwww-wwwwwwww0001', 'dddddddd-dddd-dddd-dddd-dddddddd0006', '11111111-1111-1111-1111-111111111111', 'approved', NOW() - INTERVAL '3 days'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeee0005', 'wwwwwwww-wwww-wwww-wwww-wwwwwwww0006', 'dddddddd-dddd-dddd-dddd-dddddddd0001', '11111111-1111-1111-1111-111111111111', 'pending', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. DEMO POINT TRANSACTIONS
-- ============================================================
INSERT INTO point_transactions (id, profile_id, company_id, type, amount, description, referral_id, redemption_id, created_at) VALUES
-- John Smith activity (top referrer)
('tttttttt-tttt-tttt-tttt-tttttttt0001', 'dddddddd-dddd-dddd-dddd-dddddddd0001', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed: Tom Henderson (Full Solar Installation)', 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0001', NULL, NOW() - INTERVAL '5 months'),
('tttttttt-tttt-tttt-tttt-tttttttt0002', 'dddddddd-dddd-dddd-dddd-dddddddd0001', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed: Nancy Drew (Full Solar Installation)', 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0002', NULL, NOW() - INTERVAL '4 months'),
('tttttttt-tttt-tttt-tttt-tttttttt0003', 'dddddddd-dddd-dddd-dddd-dddddddd0001', '11111111-1111-1111-1111-111111111111', 'earned', 300, 'Referral completed: Steve Rogers (Battery Storage Add-on)', 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0003', NULL, NOW() - INTERVAL '3 months'),
('tttttttt-tttt-tttt-tttt-tttttttt0004', 'dddddddd-dddd-dddd-dddd-dddddddd0001', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Milestone bonus: 5 referrals completed!', NULL, NULL, NOW() - INTERVAL '3 months'),
('tttttttt-tttt-tttt-tttt-tttttttt0005', 'dddddddd-dddd-dddd-dddd-dddddddd0001', '11111111-1111-1111-1111-111111111111', 'earned', 25, 'Google review submitted', NULL, NULL, NOW() - INTERVAL '10 weeks'),
('tttttttt-tttt-tttt-tttt-tttttttt0006', 'dddddddd-dddd-dddd-dddd-dddddddd0001', '11111111-1111-1111-1111-111111111111', 'redeemed', -1000, 'Redeemed: $100 Amazon Gift Card', NULL, 'eeeeeeee-eeee-eeee-eeee-eeeeeeee0001', NOW() - INTERVAL '2 months'),
('tttttttt-tttt-tttt-tttt-tttttttt0007', 'dddddddd-dddd-dddd-dddd-dddddddd0001', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed: Additional customer', NULL, NULL, NOW() - INTERVAL '6 weeks'),
('tttttttt-tttt-tttt-tttt-tttttttt0008', 'dddddddd-dddd-dddd-dddd-dddddddd0001', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed: Additional customer', NULL, NULL, NOW() - INTERVAL '4 weeks'),
('tttttttt-tttt-tttt-tttt-tttttttt0009', 'dddddddd-dddd-dddd-dddd-dddddddd0001', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed: Additional customer', NULL, NULL, NOW() - INTERVAL '2 weeks'),
('tttttttt-tttt-tttt-tttt-tttttttt0010', 'dddddddd-dddd-dddd-dddd-dddddddd0001', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Milestone bonus: 10 referrals completed!', NULL, NULL, NOW() - INTERVAL '2 weeks'),
('tttttttt-tttt-tttt-tttt-tttttttt0011', 'dddddddd-dddd-dddd-dddd-dddddddd0001', '11111111-1111-1111-1111-111111111111', 'redeemed', -300, 'Redeemed: Yeti Rambler 20oz Tumbler', NULL, 'eeeeeeee-eeee-eeee-eeee-eeeeeeee0005', NOW() - INTERVAL '1 day'),

-- Maria Garcia activity
('tttttttt-tttt-tttt-tttt-tttttttt0012', 'dddddddd-dddd-dddd-dddd-dddddddd0002', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed: Diana Prince (Full Solar Installation)', 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0004', NULL, NOW() - INTERVAL '4 months'),
('tttttttt-tttt-tttt-tttt-tttttttt0013', 'dddddddd-dddd-dddd-dddd-dddddddd0002', '11111111-1111-1111-1111-111111111111', 'earned', 750, 'Referral completed: Bruce Wayne (Solar Roof Tiles)', 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0005', NULL, NOW() - INTERVAL '2 months'),
('tttttttt-tttt-tttt-tttt-tttttttt0014', 'dddddddd-dddd-dddd-dddd-dddddddd0002', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Milestone bonus: 5 referrals completed!', NULL, NULL, NOW() - INTERVAL '2 months'),
('tttttttt-tttt-tttt-tttt-tttttttt0015', 'dddddddd-dddd-dddd-dddd-dddddddd0002', '11111111-1111-1111-1111-111111111111', 'earned', 25, 'Google review submitted', NULL, NULL, NOW() - INTERVAL '6 weeks'),
('tttttttt-tttt-tttt-tttt-tttttttt0016', 'dddddddd-dddd-dddd-dddd-dddddddd0002', '11111111-1111-1111-1111-111111111111', 'redeemed', -500, 'Redeemed: $50 Amazon Gift Card', NULL, 'eeeeeeee-eeee-eeee-eeee-eeeeeeee0002', NOW() - INTERVAL '6 weeks'),
('tttttttt-tttt-tttt-tttt-tttttttt0017', 'dddddddd-dddd-dddd-dddd-dddddddd0002', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed: Additional customer', NULL, NULL, NOW() - INTERVAL '4 weeks'),
('tttttttt-tttt-tttt-tttt-tttttttt0018', 'dddddddd-dddd-dddd-dddd-dddddddd0002', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed: Additional customer', NULL, NULL, NOW() - INTERVAL '2 weeks'),
('tttttttt-tttt-tttt-tttt-tttttttt0019', 'dddddddd-dddd-dddd-dddd-dddddddd0002', '11111111-1111-1111-1111-111111111111', 'earned', 25, 'Yelp review with photo', NULL, NULL, NOW() - INTERVAL '1 week'),

-- David Wilson activity
('tttttttt-tttt-tttt-tttt-tttttttt0020', 'dddddddd-dddd-dddd-dddd-dddddddd0003', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed: Clark Kent (Full Solar Installation)', 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0006', NULL, NOW() - INTERVAL '3 months'),
('tttttttt-tttt-tttt-tttt-tttttttt0021', 'dddddddd-dddd-dddd-dddd-dddddddd0003', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Milestone bonus: 5 referrals completed!', NULL, NULL, NOW() - INTERVAL '3 months'),
('tttttttt-tttt-tttt-tttt-tttttttt0022', 'dddddddd-dddd-dddd-dddd-dddddddd0003', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed: Additional customer', NULL, NULL, NOW() - INTERVAL '2 months'),
('tttttttt-tttt-tttt-tttt-tttttttt0023', 'dddddddd-dddd-dddd-dddd-dddddddd0003', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed: Additional customer', NULL, NULL, NOW() - INTERVAL '1 month'),
('tttttttt-tttt-tttt-tttt-tttttttt0024', 'dddddddd-dddd-dddd-dddd-dddddddd0003', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed: Additional customer', NULL, NULL, NOW() - INTERVAL '2 weeks'),

-- Other customer activity
('tttttttt-tttt-tttt-tttt-tttttttt0025', 'dddddddd-dddd-dddd-dddd-dddddddd0004', '11111111-1111-1111-1111-111111111111', 'earned', 300, 'Referral completed: Lois Lane (Battery Storage Add-on)', 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0007', NULL, NOW() - INTERVAL '2 months'),
('tttttttt-tttt-tttt-tttt-tttttttt0026', 'dddddddd-dddd-dddd-dddd-dddddddd0004', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed: Additional customer', NULL, NULL, NOW() - INTERVAL '5 weeks'),
('tttttttt-tttt-tttt-tttt-tttttttt0027', 'dddddddd-dddd-dddd-dddd-dddddddd0004', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed: Additional customer', NULL, NULL, NOW() - INTERVAL '3 weeks'),
('tttttttt-tttt-tttt-tttt-tttttttt0028', 'dddddddd-dddd-dddd-dddd-dddddddd0004', '11111111-1111-1111-1111-111111111111', 'redeemed', -500, 'Redeemed: $50 Amazon Gift Card', NULL, 'eeeeeeee-eeee-eeee-eeee-eeeeeeee0003', NOW() - INTERVAL '3 weeks'),
('tttttttt-tttt-tttt-tttt-tttttttt0029', 'dddddddd-dddd-dddd-dddd-dddddddd0005', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed: Peter Parker (Full Solar Installation)', 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0008', NULL, NOW() - INTERVAL '1 month'),
('tttttttt-tttt-tttt-tttt-tttttttt0030', 'dddddddd-dddd-dddd-dddd-dddddddd0005', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed: Additional customer', NULL, NULL, NOW() - INTERVAL '2 weeks'),
('tttttttt-tttt-tttt-tttt-tttttttt0031', 'dddddddd-dddd-dddd-dddd-dddddddd0005', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed: Additional customer', NULL, NULL, NOW() - INTERVAL '1 week'),
('tttttttt-tttt-tttt-tttt-tttttttt0032', 'dddddddd-dddd-dddd-dddd-dddddddd0006', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed: Additional customer', NULL, NULL, NOW() - INTERVAL '3 weeks'),
('tttttttt-tttt-tttt-tttt-tttttttt0033', 'dddddddd-dddd-dddd-dddd-dddddddd0006', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed: Additional customer', NULL, NULL, NOW() - INTERVAL '2 weeks'),
('tttttttt-tttt-tttt-tttt-tttttttt0034', 'dddddddd-dddd-dddd-dddd-dddddddd0006', '11111111-1111-1111-1111-111111111111', 'redeemed', -250, 'Redeemed: $25 Amazon Gift Card', NULL, 'eeeeeeee-eeee-eeee-eeee-eeeeeeee0004', NOW() - INTERVAL '3 days'),
('tttttttt-tttt-tttt-tttt-tttttttt0035', 'dddddddd-dddd-dddd-dddd-dddddddd0007', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed: Additional customer', NULL, NULL, NOW() - INTERVAL '4 weeks'),
('tttttttt-tttt-tttt-tttt-tttttttt0036', 'dddddddd-dddd-dddd-dddd-dddddddd0007', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed: Additional customer', NULL, NULL, NOW() - INTERVAL '2 weeks'),

-- Recent activity
('tttttttt-tttt-tttt-tttt-tttttttt0037', 'dddddddd-dddd-dddd-dddd-dddddddd0008', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed', NULL, NULL, NOW() - INTERVAL '2 days'),
('tttttttt-tttt-tttt-tttt-tttttttt0038', 'dddddddd-dddd-dddd-dddd-dddddddd0008', '11111111-1111-1111-1111-111111111111', 'earned', 250, 'Referral completed', NULL, NULL, NOW() - INTERVAL '3 weeks'),
('tttttttt-tttt-tttt-tttt-tttttttt0039', 'dddddddd-dddd-dddd-dddd-dddddddd0009', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed', NULL, NULL, NOW() - INTERVAL '4 weeks'),
('tttttttt-tttt-tttt-tttt-tttttttt0040', 'dddddddd-dddd-dddd-dddd-dddddddd0009', '11111111-1111-1111-1111-111111111111', 'earned', 25, 'Google review submitted', NULL, NULL, NOW() - INTERVAL '1 day'),
('tttttttt-tttt-tttt-tttt-tttttttt0041', 'dddddddd-dddd-dddd-dddd-dddddddd0010', '11111111-1111-1111-1111-111111111111', 'earned', 500, 'Referral completed', NULL, NULL, NOW() - INTERVAL '12 hours'),
('tttttttt-tttt-tttt-tttt-tttttttt0042', 'dddddddd-dddd-dddd-dddd-dddddddd0011', '11111111-1111-1111-1111-111111111111', 'earned', 300, 'Referral completed', NULL, NULL, NOW() - INTERVAL '3 weeks'),
('tttttttt-tttt-tttt-tttt-tttttttt0043', 'dddddddd-dddd-dddd-dddd-dddddddd0012', '11111111-1111-1111-1111-111111111111', 'earned', 250, 'Referral in progress', NULL, NULL, NOW() - INTERVAL '2 weeks'),
('tttttttt-tttt-tttt-tttt-tttttttt0044', 'dddddddd-dddd-dddd-dddd-dddddddd0013', '11111111-1111-1111-1111-111111111111', 'earned', 25, 'Review submitted', NULL, NULL, NOW() - INTERVAL '1 week'),
('tttttttt-tttt-tttt-tttt-tttttttt0045', 'dddddddd-dddd-dddd-dddd-dddddddd0013', '11111111-1111-1111-1111-111111111111', 'earned', 25, 'Photo bonus', NULL, NULL, NOW() - INTERVAL '1 week'),
('tttttttt-tttt-tttt-tttt-tttttttt0046', 'dddddddd-dddd-dddd-dddd-dddddddd0014', '11111111-1111-1111-1111-111111111111', 'earned', 25, 'Google review submitted', NULL, NULL, NOW() - INTERVAL '6 hours')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. DEMO ACHIEVEMENTS
-- ============================================================
INSERT INTO achievements (id, company_id, name, description, icon, condition, points_bonus) VALUES
('aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbbb', NULL, 'First Referral', 'Submit your first referral', 'star', '{"type": "referral_count", "value": 1}'::jsonb, 50),
('aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbcc', NULL, 'High Five', 'Complete 5 successful referrals', 'hand', '{"type": "completed_referrals", "value": 5}'::jsonb, 100),
('aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbdd', NULL, 'Power Ten', 'Complete 10 successful referrals', 'zap', '{"type": "completed_referrals", "value": 10}'::jsonb, 250),
('aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbee', NULL, 'Silver Status', 'Reach Silver tier', 'award', '{"type": "tier_reached", "value": "silver"}'::jsonb, 0),
('aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbff', NULL, 'Gold Status', 'Reach Gold tier', 'trophy', '{"type": "tier_reached", "value": "gold"}'::jsonb, 0),
('aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabb00', NULL, 'Platinum Status', 'Reach Platinum tier', 'crown', '{"type": "tier_reached", "value": "platinum"}'::jsonb, 0),
('aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabb11', NULL, 'Reviewer', 'Leave your first review', 'message-square', '{"type": "review_count", "value": 1}'::jsonb, 25),
('aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabb22', NULL, 'Spread the Word', 'Submit 3 referrals in one month', 'megaphone', '{"type": "monthly_referrals", "value": 3}'::jsonb, 100)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 11. DEMO USER ACHIEVEMENTS
-- ============================================================
INSERT INTO user_achievements (profile_id, achievement_id, earned_at) VALUES
-- John Smith achievements
('dddddddd-dddd-dddd-dddd-dddddddd0001', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbbb', NOW() - INTERVAL '5 months'),
('dddddddd-dddd-dddd-dddd-dddddddd0001', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbcc', NOW() - INTERVAL '3 months'),
('dddddddd-dddd-dddd-dddd-dddddddd0001', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbdd', NOW() - INTERVAL '2 weeks'),
('dddddddd-dddd-dddd-dddd-dddddddd0001', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbee', NOW() - INTERVAL '4 months'),
('dddddddd-dddd-dddd-dddd-dddddddd0001', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbff', NOW() - INTERVAL '6 weeks'),
('dddddddd-dddd-dddd-dddd-dddddddd0001', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabb11', NOW() - INTERVAL '10 weeks'),
('dddddddd-dddd-dddd-dddd-dddddddd0001', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabb22', NOW() - INTERVAL '4 months'),

-- Maria Garcia achievements
('dddddddd-dddd-dddd-dddd-dddddddd0002', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbbb', NOW() - INTERVAL '4 months'),
('dddddddd-dddd-dddd-dddd-dddddddd0002', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbcc', NOW() - INTERVAL '2 months'),
('dddddddd-dddd-dddd-dddd-dddddddd0002', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbee', NOW() - INTERVAL '3 months'),
('dddddddd-dddd-dddd-dddd-dddddddd0002', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbff', NOW() - INTERVAL '4 weeks'),
('dddddddd-dddd-dddd-dddd-dddddddd0002', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabb11', NOW() - INTERVAL '6 weeks'),

-- David Wilson achievements
('dddddddd-dddd-dddd-dddd-dddddddd0003', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbbb', NOW() - INTERVAL '3 months'),
('dddddddd-dddd-dddd-dddd-dddddddd0003', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbcc', NOW() - INTERVAL '2 months'),
('dddddddd-dddd-dddd-dddd-dddddddd0003', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbee', NOW() - INTERVAL '2 months'),

-- Other customers
('dddddddd-dddd-dddd-dddd-dddddddd0004', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbbb', NOW() - INTERVAL '2 months'),
('dddddddd-dddd-dddd-dddd-dddddddd0004', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbee', NOW() - INTERVAL '5 weeks'),
('dddddddd-dddd-dddd-dddd-dddddddd0005', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbbb', NOW() - INTERVAL '1 month'),
('dddddddd-dddd-dddd-dddd-dddddddd0005', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbee', NOW() - INTERVAL '3 weeks'),
('dddddddd-dddd-dddd-dddd-dddddddd0006', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbbb', NOW() - INTERVAL '3 weeks'),
('dddddddd-dddd-dddd-dddd-dddddddd0006', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbee', NOW() - INTERVAL '2 weeks'),
('dddddddd-dddd-dddd-dddd-dddddddd0007', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbbb', NOW() - INTERVAL '4 weeks'),
('dddddddd-dddd-dddd-dddd-dddddddd0007', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbee', NOW() - INTERVAL '3 weeks'),
('dddddddd-dddd-dddd-dddd-dddddddd0008', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbbb', NOW() - INTERVAL '2 weeks'),
('dddddddd-dddd-dddd-dddd-dddddddd0009', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbbb', NOW() - INTERVAL '4 weeks'),
('dddddddd-dddd-dddd-dddd-dddddddd0010', 'aaaabbbb-aaaa-bbbb-aaaa-bbbbaaaabbbb', NOW() - INTERVAL '12 hours')
ON CONFLICT (profile_id, achievement_id) DO NOTHING;

-- ============================================================
-- 12. DEMO NOTIFICATIONS
-- ============================================================
INSERT INTO notifications (id, profile_id, type, title, body, read, data, created_at) VALUES
('nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnn0001', 'dddddddd-dddd-dddd-dddd-dddddddd0001', 'referral_update', 'Referral Update', 'Your referral Mary Jane has received a quote!', false, '{"referral_id": "rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0009"}'::jsonb, NOW() - INTERVAL '2 weeks'),
('nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnn0002', 'dddddddd-dddd-dddd-dddd-dddddddd0001', 'achievement', 'Milestone Reached!', 'Congratulations! You''ve completed 10 referrals and earned a 500 point bonus!', true, '{"achievement": "Power Ten"}'::jsonb, NOW() - INTERVAL '2 weeks'),
('nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnn0003', 'dddddddd-dddd-dddd-dddd-dddddddd0001', 'reward_earned', 'Reward Processing', 'Your Yeti Rambler order is being processed!', false, '{"reward": "Yeti Rambler 20oz Tumbler"}'::jsonb, NOW() - INTERVAL '1 day'),
('nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnn0004', 'dddddddd-dddd-dddd-dddd-dddddddd0002', 'referral_update', 'Referral Update', 'Your referral Tony Stark has a consultation scheduled!', false, '{"referral_id": "rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0013"}'::jsonb, NOW() - INTERVAL '4 days'),
('nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnn0005', 'dddddddd-dddd-dddd-dddd-dddddddd0006', 'reward_earned', 'Points Earned!', 'You earned 25 points for your Google review!', false, '{}'::jsonb, NOW() - INTERVAL '1 day'),
('nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnn0006', 'dddddddd-dddd-dddd-dddd-dddddddd0008', 'referral_update', 'Referral Update', 'Your referral Happy Hogan has a consultation scheduled!', false, '{"referral_id": "rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0015"}'::jsonb, NOW() - INTERVAL '2 days'),
('nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnn0007', 'dddddddd-dddd-dddd-dddd-dddddddd0010', 'achievement', 'First Referral!', 'Congratulations on submitting your first referral!', false, '{"achievement": "First Referral"}'::jsonb, NOW() - INTERVAL '12 hours'),
('nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnn0008', 'dddddddd-dddd-dddd-dddd-dddddddd0003', 'referral_update', 'Referral Update', 'Your referral Harry Osborn has received a quote!', true, '{"referral_id": "rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0010"}'::jsonb, NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 13. DEMO REVIEWS
-- ============================================================
INSERT INTO reviews (id, company_id, profile_id, referral_id, rating, comment, created_at) VALUES
('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvv0001', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0001', 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0001', 5, 'Absolutely amazing experience! The team was professional, the installation was quick, and my energy bills have dropped significantly. Highly recommend SunBright Solar!', NOW() - INTERVAL '10 weeks'),
('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvv0002', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0002', 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrr0004', 5, 'Best decision we ever made for our home. The referral program is a nice bonus too!', NOW() - INTERVAL '6 weeks'),
('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvv0003', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0009', NULL, 4, 'Great service and quality panels. Installation took a bit longer than expected but the results are worth it.', NOW() - INTERVAL '1 day'),
('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvv0004', '11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddd0014', NULL, 5, 'Just got our system installed and already seeing results. Customer service was exceptional.', NOW() - INTERVAL '6 hours')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 14. DEMO EARLY ACCESS APPLICATIONS (for Super Admin)
-- ============================================================
INSERT INTO early_access_applications (id, full_name, email, phone, company_name, industry, industry_other, company_size, website, current_referral_method, current_referral_method_other, monthly_referral_volume, biggest_challenge, desired_plan, how_did_you_hear, status, notes, submitted_at) VALUES
('eaeaeaea-eaea-eaea-eaea-eaeaeaea0001', 'Marcus Johnson', 'marcus@toptieroofing.com', '(555) 123-4567', 'Top Tier Roofing', 'roofing', NULL, '6-15', 'www.toptieroofing.com', 'cash_bonuses', NULL, '6-15', 'We give cash bonuses but have no way to track who referred who. Customers forget to ask for their reward.', 'growth', 'Google search', 'new', NULL, NOW() - INTERVAL '2 hours'),
('eaeaeaea-eaea-eaea-eaea-eaeaeaea0002', 'Sandra Lee', 'sandra@comforthvac.com', '(555) 234-5678', 'Comfort HVAC Solutions', 'hvac', NULL, '16-50', 'www.comforthvac.com', 'none', NULL, '1-5', 'We know referrals work but never set up a formal program. Looking for something easy to manage.', 'starter', 'Industry conference', 'contacted', 'Called 1/15, very interested. Following up next week.', NOW() - INTERVAL '1 day'),
('eaeaeaea-eaea-eaea-eaea-eaeaeaea0003', 'David Chen', 'david@greenturf.com', '(555) 345-6789', 'Green Turf Landscaping', 'turf', NULL, '2-5', 'www.greenturf.com', 'word_of_mouth', NULL, '1-5', 'Our customers love us but we don''t have a way to reward them for referrals.', 'starter', 'Friend recommendation', 'demo_scheduled', 'Demo scheduled for Friday 2pm EST', NOW() - INTERVAL '3 days'),
('eaeaeaea-eaea-eaea-eaea-eaeaeaea0004', 'Rachel Adams', 'rachel@bugfreepest.com', '(555) 456-7890', 'BugFree Pest Control', 'pest_control', NULL, '6-15', 'www.bugfreepest.com', 'gift_cards', NULL, '16-30', 'We manually track everything in a spreadsheet. It''s a mess and customers fall through the cracks.', 'growth', 'Facebook ad', 'approved', 'Ready to onboard. Sending welcome package.', NOW() - INTERVAL '5 days'),
('eaeaeaea-eaea-eaea-eaea-eaeaeaea0005', 'Tom Williams', 'tom@clearpanewindows.com', '(555) 567-8901', 'ClearPane Windows', 'windows', NULL, '2-5', NULL, 'none', NULL, '0', 'Just starting out. Want to build referrals into our business from day one.', 'free', 'LinkedIn', 'new', NULL, NOW() - INTERVAL '6 hours'),
('eaeaeaea-eaea-eaea-eaea-eaeaeaea0006', 'Lisa Park', 'lisa@solarelite.com', '(555) 678-9012', 'Solar Elite Pro', 'solar', NULL, '16-50', 'www.solarelitepro.com', 'referral_software', NULL, '30+', 'Current software is clunky and expensive. Looking for something more modern with better customer experience.', 'pro', 'Competitor comparison', 'demo_scheduled', 'Demo tomorrow at 10am PST', NOW() - INTERVAL '1 day'),
('eaeaeaea-eaea-eaea-eaea-eaeaeaea0007', 'James Miller', 'james@millerhvac.com', '(555) 789-0123', 'Miller HVAC Services', 'hvac', NULL, '6-15', 'www.millerhvac.com', 'word_of_mouth', NULL, '6-15', 'Referrals drive 40% of our business but we don''t reward customers consistently.', 'growth', 'Google search', 'contacted', 'Left voicemail', NOW() - INTERVAL '8 hours'),
('eaeaeaea-eaea-eaea-eaea-eaeaeaea0008', 'Anna Rodriguez', 'anna@rodriguezroofing.com', '(555) 890-1234', 'Rodriguez Roofing Co', 'roofing', NULL, '2-5', NULL, 'none', NULL, '1-5', 'Want to start a referral program but don''t know where to begin.', 'starter', 'Yelp', 'new', NULL, NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SUMMARY
-- ============================================================
-- This seed creates:
-- - 1 demo company (SunBright Solar) on Growth plan
-- - 4 services with different point values (500, 300, 750, 150 pts)
-- - 1 contractor owner + 3 team members
-- - 15 customers with varying engagement levels
-- - 24 referrals across all statuses:
--   * 8 completed (won)
--   * 4 quoted
--   * 5 contacted
--   * 5 pending
--   * 2 lost/expired
-- - 12 rewards in the catalog
-- - 5 redemptions
-- - 46 point transactions
-- - 8 global achievements
-- - 26 user achievement assignments
-- - 8 notifications
-- - 4 reviews
-- - 8 early access applications
--
-- Key demo accounts for screenshots:
-- - john.smith@email.com - Power user with 3,500 pts, Gold tier, many referrals
-- - maria.garcia@email.com - Active user with 2,700 pts, Gold tier
-- - mike@sunbrightsolar.com - Contractor owner (for admin dashboard)
-- ============================================================
