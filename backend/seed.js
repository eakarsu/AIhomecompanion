const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'smarthome',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Drop existing tables (reverse dependency order)
    await client.query(`
      DROP TABLE IF EXISTS predictive_maintenance CASCADE;
      DROP TABLE IF EXISTS anomalies CASCADE;
      DROP TABLE IF EXISTS companion_interactions CASCADE;
      DROP TABLE IF EXISTS sleep_records CASCADE;
      DROP TABLE IF EXISTS meal_plans CASCADE;
      DROP TABLE IF EXISTS robot_tasks CASCADE;
      DROP TABLE IF EXISTS robot_status CASCADE;
      DROP TABLE IF EXISTS navigation_logs CASCADE;
      DROP TABLE IF EXISTS emotion_readings CASCADE;
      DROP TABLE IF EXISTS gesture_events CASCADE;
      DROP TABLE IF EXISTS detected_objects CASCADE;
      DROP TABLE IF EXISTS patrol_rounds CASCADE;
      DROP TABLE IF EXISTS face_records CASCADE;
      DROP TABLE IF EXISTS voice_commands CASCADE;
      DROP TABLE IF EXISTS budget_entries CASCADE;
      DROP TABLE IF EXISTS warranties CASCADE;
      DROP TABLE IF EXISTS packages CASCADE;
      DROP TABLE IF EXISTS laundry_loads CASCADE;
      DROP TABLE IF EXISTS media_sessions CASCADE;
      DROP TABLE IF EXISTS intercom_messages CASCADE;
      DROP TABLE IF EXISTS emergency_contacts CASCADE;
      DROP TABLE IF EXISTS inventory_items CASCADE;
      DROP TABLE IF EXISTS guests CASCADE;
      DROP TABLE IF EXISTS plants CASCADE;
      DROP TABLE IF EXISTS pets CASCADE;
      DROP TABLE IF EXISTS chores CASCADE;
      DROP TABLE IF EXISTS recipes CASCADE;
      DROP TABLE IF EXISTS calendar_events CASCADE;
      DROP TABLE IF EXISTS shopping_items CASCADE;
      DROP TABLE IF EXISTS weather_data CASCADE;
      DROP TABLE IF EXISTS ai_conversations CASCADE;
      DROP TABLE IF EXISTS recommendations CASCADE;
      DROP TABLE IF EXISTS analytics CASCADE;
      DROP TABLE IF EXISTS maintenance_logs CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS sensors CASCADE;
      DROP TABLE IF EXISTS schedules CASCADE;
      DROP TABLE IF EXISTS security_alerts CASCADE;
      DROP TABLE IF EXISTS energy_logs CASCADE;
      DROP TABLE IF EXISTS scenes CASCADE;
      DROP TABLE IF EXISTS automations CASCADE;
      DROP TABLE IF EXISTS devices CASCADE;
      DROP TABLE IF EXISTS rooms CASCADE;
      DROP TABLE IF EXISTS user_profiles CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // ============================================
    // Create all tables
    // ============================================
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        floor VARCHAR(50),
        type VARCHAR(100),
        size_sqft INTEGER,
        temperature DECIMAL(4,1),
        humidity DECIMAL(4,1),
        occupancy BOOLEAN DEFAULT false,
        icon VARCHAR(50),
        color VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE devices (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        brand VARCHAR(100),
        model VARCHAR(100),
        room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'offline',
        ip_address VARCHAR(45),
        firmware VARCHAR(50),
        battery_level INTEGER,
        last_active TIMESTAMP,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE automations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        trigger_type VARCHAR(100),
        trigger_value TEXT,
        action_type VARCHAR(100),
        action_value TEXT,
        is_active BOOLEAN DEFAULT true,
        room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE scenes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
        devices_config JSONB,
        mood VARCHAR(50),
        icon VARCHAR(50),
        color VARCHAR(20),
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE energy_logs (
        id SERIAL PRIMARY KEY,
        device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
        device_name VARCHAR(255),
        consumption_kwh DECIMAL(8,2),
        cost_usd DECIMAL(8,2),
        date DATE,
        peak_watts INTEGER,
        category VARCHAR(50),
        efficiency_rating VARCHAR(5),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE security_alerts (
        id SERIAL PRIMARY KEY,
        type VARCHAR(100) NOT NULL,
        severity VARCHAR(50),
        message TEXT,
        location VARCHAR(255),
        device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
        is_resolved BOOLEAN DEFAULT false,
        resolved_at TIMESTAMP,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE user_profiles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100),
        avatar VARCHAR(255),
        preferences JSONB,
        voice_id VARCHAR(100),
        age INTEGER,
        relation VARCHAR(100),
        is_home BOOLEAN DEFAULT false,
        last_seen TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE schedules (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        cron_expression VARCHAR(100),
        action_type VARCHAR(100),
        action_value TEXT,
        device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
        room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
        is_active BOOLEAN DEFAULT true,
        next_run TIMESTAMP,
        last_run TIMESTAMP,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE sensors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
        value DECIMAL(8,2),
        unit VARCHAR(20),
        min_threshold DECIMAL(8,2),
        max_threshold DECIMAL(8,2),
        status VARCHAR(50) DEFAULT 'normal',
        battery_level INTEGER,
        last_reading TIMESTAMP,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        type VARCHAR(50),
        priority VARCHAR(50),
        source VARCHAR(100),
        is_read BOOLEAN DEFAULT false,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE maintenance_logs (
        id SERIAL PRIMARY KEY,
        device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
        device_name VARCHAR(255),
        type VARCHAR(100),
        description TEXT,
        status VARCHAR(50),
        scheduled_date DATE,
        completed_date DATE,
        cost DECIMAL(8,2),
        technician VARCHAR(255),
        priority VARCHAR(50),
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE analytics (
        id SERIAL PRIMARY KEY,
        metric_name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        value DECIMAL(10,2),
        unit VARCHAR(50),
        period VARCHAR(50),
        trend VARCHAR(50),
        change_percent DECIMAL(5,2),
        details JSONB,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE recommendations (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        priority VARCHAR(50),
        potential_savings DECIMAL(8,2),
        difficulty VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        ai_confidence DECIMAL(3,2),
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE ai_conversations (
        id SERIAL PRIMARY KEY,
        user_message TEXT NOT NULL,
        ai_response TEXT,
        context VARCHAR(100),
        tokens_used INTEGER,
        model VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Home Life Feature Tables

      CREATE TABLE weather_data (
        id SERIAL PRIMARY KEY,
        location VARCHAR(255) NOT NULL,
        date DATE,
        temperature DECIMAL(5,1),
        feels_like DECIMAL(5,1),
        humidity DECIMAL(4,1),
        wind_speed DECIMAL(5,1),
        condition VARCHAR(100),
        forecast_high DECIMAL(5,1),
        forecast_low DECIMAL(5,1),
        uv_index INTEGER,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE shopping_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        quantity INTEGER DEFAULT 1,
        unit VARCHAR(50),
        store VARCHAR(255),
        estimated_price DECIMAL(8,2),
        is_purchased BOOLEAN DEFAULT false,
        priority VARCHAR(50) DEFAULT 'medium',
        added_by VARCHAR(255),
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE calendar_events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date DATE,
        start_time TIME,
        end_time TIME,
        location VARCHAR(255),
        category VARCHAR(100),
        recurrence VARCHAR(50),
        assigned_to VARCHAR(255),
        is_all_day BOOLEAN DEFAULT false,
        reminder_minutes INTEGER,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE recipes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        cuisine VARCHAR(100),
        category VARCHAR(100),
        prep_time_min INTEGER,
        cook_time_min INTEGER,
        servings INTEGER,
        difficulty VARCHAR(50),
        instructions TEXT,
        calories INTEGER,
        rating DECIMAL(2,1),
        is_favorite BOOLEAN DEFAULT false,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE chores (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        assigned_to VARCHAR(255),
        room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
        frequency VARCHAR(50),
        priority VARCHAR(50) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'pending',
        due_date DATE,
        completed_date DATE,
        points INTEGER DEFAULT 0,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE pets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        species VARCHAR(100),
        breed VARCHAR(100),
        age_years DECIMAL(3,1),
        weight DECIMAL(5,1),
        vet_name VARCHAR(255),
        vet_phone VARCHAR(50),
        next_vet_visit DATE,
        feeding_schedule VARCHAR(255),
        medications TEXT,
        notes TEXT,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE plants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        species VARCHAR(255),
        location VARCHAR(255),
        sunlight_needs VARCHAR(50),
        water_frequency VARCHAR(50),
        last_watered DATE,
        next_water DATE,
        last_fertilized DATE,
        health_status VARCHAR(50) DEFAULT 'healthy',
        notes TEXT,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE guests (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        relationship VARCHAR(100),
        phone VARCHAR(50),
        email VARCHAR(255),
        visit_date DATE,
        departure_date DATE,
        room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
        wifi_access BOOLEAN DEFAULT false,
        dietary_restrictions TEXT,
        notes TEXT,
        status VARCHAR(50) DEFAULT 'expected',
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE inventory_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        quantity INTEGER DEFAULT 1,
        unit VARCHAR(50),
        location VARCHAR(255),
        expiry_date DATE,
        min_stock INTEGER DEFAULT 1,
        barcode VARCHAR(100),
        status VARCHAR(50) DEFAULT 'in_stock',
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE emergency_contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        relationship VARCHAR(100),
        phone VARCHAR(50) NOT NULL,
        alt_phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        type VARCHAR(100),
        priority INTEGER DEFAULT 1,
        notes TEXT,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE intercom_messages (
        id SERIAL PRIMARY KEY,
        from_room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
        to_room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
        from_room VARCHAR(255),
        to_room VARCHAR(255),
        sender VARCHAR(255),
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'text',
        is_read BOOLEAN DEFAULT false,
        priority VARCHAR(50) DEFAULT 'normal',
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE media_sessions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255),
        album VARCHAR(255),
        media_type VARCHAR(50),
        source VARCHAR(100),
        room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
        device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
        volume INTEGER DEFAULT 50,
        status VARCHAR(50) DEFAULT 'stopped',
        duration_sec INTEGER,
        playlist VARCHAR(255),
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE laundry_loads (
        id SERIAL PRIMARY KEY,
        label VARCHAR(255) NOT NULL,
        load_type VARCHAR(100),
        machine VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        started_at TIMESTAMP,
        estimated_done TIMESTAMP,
        temperature VARCHAR(50),
        cycle_type VARCHAR(50),
        assigned_to VARCHAR(255),
        notes TEXT,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE packages (
        id SERIAL PRIMARY KEY,
        description VARCHAR(255) NOT NULL,
        carrier VARCHAR(100),
        tracking_number VARCHAR(255),
        order_date DATE,
        expected_delivery DATE,
        actual_delivery DATE,
        status VARCHAR(50) DEFAULT 'ordered',
        recipient VARCHAR(255),
        retailer VARCHAR(255),
        notes TEXT,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE warranties (
        id SERIAL PRIMARY KEY,
        item_name VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        provider VARCHAR(255),
        policy_number VARCHAR(255),
        start_date DATE,
        end_date DATE,
        coverage_amount DECIMAL(10,2),
        premium DECIMAL(8,2),
        deductible DECIMAL(8,2),
        status VARCHAR(50) DEFAULT 'active',
        contact_phone VARCHAR(50),
        notes TEXT,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE budget_entries (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        amount DECIMAL(10,2),
        type VARCHAR(50) DEFAULT 'expense',
        date DATE,
        payment_method VARCHAR(100),
        vendor VARCHAR(255),
        is_recurring BOOLEAN DEFAULT false,
        frequency VARCHAR(50),
        notes TEXT,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Robot AI Feature Tables

      CREATE TABLE voice_commands (
        id SERIAL PRIMARY KEY,
        command_text TEXT NOT NULL,
        intent VARCHAR(100),
        confidence DECIMAL(3,2),
        speaker VARCHAR(255),
        room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
        action_taken TEXT,
        status VARCHAR(50) DEFAULT 'processed',
        response_text TEXT,
        processing_time_ms INTEGER,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE face_records (
        id SERIAL PRIMARY KEY,
        person_name VARCHAR(255) NOT NULL,
        profile_id INTEGER REFERENCES user_profiles(id) ON DELETE SET NULL,
        confidence DECIMAL(3,2),
        location VARCHAR(255),
        camera_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
        is_recognized BOOLEAN DEFAULT true,
        emotion VARCHAR(50),
        access_granted BOOLEAN DEFAULT true,
        image_ref VARCHAR(255),
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE patrol_rounds (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        route JSONB,
        schedule VARCHAR(100),
        status VARCHAR(50) DEFAULT 'scheduled',
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        rooms_checked INTEGER,
        anomalies_found INTEGER DEFAULT 0,
        report TEXT,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE detected_objects (
        id SERIAL PRIMARY KEY,
        object_name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        confidence DECIMAL(3,2),
        location VARCHAR(255),
        room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
        camera_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
        bounding_box JSONB,
        is_anomaly BOOLEAN DEFAULT false,
        action_taken TEXT,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE gesture_events (
        id SERIAL PRIMARY KEY,
        gesture_name VARCHAR(255) NOT NULL,
        person VARCHAR(255),
        confidence DECIMAL(3,2),
        action_triggered TEXT,
        room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
        camera_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'recognized',
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE emotion_readings (
        id SERIAL PRIMARY KEY,
        person VARCHAR(255) NOT NULL,
        emotion VARCHAR(100),
        confidence DECIMAL(3,2),
        secondary_emotion VARCHAR(100),
        room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
        context VARCHAR(255),
        action_suggested TEXT,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE navigation_logs (
        id SERIAL PRIMARY KEY,
        destination VARCHAR(255) NOT NULL,
        from_location VARCHAR(255),
        room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'navigating',
        distance_meters DECIMAL(6,1),
        duration_sec INTEGER,
        obstacles_avoided INTEGER DEFAULT 0,
        map_version VARCHAR(50),
        path_data JSONB,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE robot_status (
        id SERIAL PRIMARY KEY,
        robot_name VARCHAR(255) NOT NULL,
        battery_level INTEGER,
        status VARCHAR(50) DEFAULT 'idle',
        current_location VARCHAR(255),
        cpu_usage DECIMAL(4,1),
        memory_usage DECIMAL(4,1),
        temperature_celsius DECIMAL(4,1),
        uptime_hours DECIMAL(8,1),
        last_charged TIMESTAMP,
        firmware_version VARCHAR(50),
        health_score INTEGER,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE robot_tasks (
        id SERIAL PRIMARY KEY,
        task_name VARCHAR(255) NOT NULL,
        description TEXT,
        task_type VARCHAR(100),
        priority VARCHAR(50) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'queued',
        assigned_robot VARCHAR(255),
        scheduled_at TIMESTAMP,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        result TEXT,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE meal_plans (
        id SERIAL PRIMARY KEY,
        meal_name VARCHAR(255) NOT NULL,
        meal_type VARCHAR(50),
        date DATE,
        recipe_id INTEGER,
        servings INTEGER,
        calories INTEGER,
        prep_time_min INTEGER,
        dietary_tags VARCHAR(255),
        ai_suggested BOOLEAN DEFAULT false,
        status VARCHAR(50) DEFAULT 'planned',
        notes TEXT,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE sleep_records (
        id SERIAL PRIMARY KEY,
        person VARCHAR(255) NOT NULL,
        date DATE,
        bedtime TIME,
        wake_time TIME,
        duration_hours DECIMAL(4,1),
        quality_score INTEGER,
        deep_sleep_pct DECIMAL(4,1),
        rem_sleep_pct DECIMAL(4,1),
        disturbances INTEGER DEFAULT 0,
        room_temperature DECIMAL(4,1),
        ai_recommendation TEXT,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE companion_interactions (
        id SERIAL PRIMARY KEY,
        interaction_type VARCHAR(100) NOT NULL,
        person VARCHAR(255),
        content TEXT,
        category VARCHAR(100),
        duration_min INTEGER,
        mood_before VARCHAR(50),
        mood_after VARCHAR(50),
        rating INTEGER,
        room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE anomalies (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        severity VARCHAR(50),
        source VARCHAR(255),
        description TEXT,
        room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
        device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
        confidence DECIMAL(3,2),
        is_resolved BOOLEAN DEFAULT false,
        action_taken TEXT,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE predictive_maintenance (
        id SERIAL PRIMARY KEY,
        device_name VARCHAR(255) NOT NULL,
        device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
        predicted_issue VARCHAR(255),
        failure_probability DECIMAL(3,2),
        predicted_date DATE,
        severity VARCHAR(50),
        recommendation TEXT,
        estimated_cost DECIMAL(8,2),
        status VARCHAR(50) DEFAULT 'predicted',
        ai_model VARCHAR(100),
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ============================================
    // Seed data for original tables
    // ============================================

    // Seed admin user
    const hashedPassword = await bcrypt.hash(process.env.DEFAULT_PASSWORD || 'admin123', 10);
    await client.query(`
      INSERT INTO users (email, password, name, role) VALUES
      ($1, $2, 'Admin User', 'admin')
    `, [process.env.DEFAULT_EMAIL || 'admin@smarthome.com', hashedPassword]);

    // Seed Rooms (16 items)
    await client.query(`
      INSERT INTO rooms (name, floor, type, size_sqft, temperature, humidity, occupancy, icon, color) VALUES
      ('Living Room', '1st Floor', 'Living', 450, 72.5, 45.0, true, '🛋️', '#4F46E5'),
      ('Master Bedroom', '2nd Floor', 'Bedroom', 350, 70.0, 40.0, false, '🛏️', '#7C3AED'),
      ('Kitchen', '1st Floor', 'Kitchen', 300, 74.0, 55.0, true, '🍳', '#F59E0B'),
      ('Bathroom', '1st Floor', 'Bathroom', 100, 75.0, 65.0, false, '🚿', '#06B6D4'),
      ('Home Office', '2nd Floor', 'Office', 200, 71.0, 42.0, true, '💻', '#10B981'),
      ('Garage', '1st Floor', 'Garage', 500, 65.0, 50.0, false, '🚗', '#6B7280'),
      ('Kids Room', '2nd Floor', 'Bedroom', 250, 71.5, 43.0, false, '🧸', '#EC4899'),
      ('Guest Room', '2nd Floor', 'Bedroom', 200, 70.0, 40.0, false, '🏠', '#8B5CF6'),
      ('Dining Room', '1st Floor', 'Dining', 250, 72.0, 44.0, false, '🍽️', '#F97316'),
      ('Laundry Room', '1st Floor', 'Utility', 80, 73.0, 60.0, false, '👕', '#14B8A6'),
      ('Basement', 'Basement', 'Recreation', 600, 68.0, 55.0, false, '🎮', '#6366F1'),
      ('Patio', 'Outdoor', 'Outdoor', 400, 78.0, 50.0, false, '☀️', '#22C55E'),
      ('Hallway', '1st Floor', 'Hallway', 120, 72.0, 44.0, false, '🚪', '#94A3B8'),
      ('Master Bath', '2nd Floor', 'Bathroom', 150, 74.0, 60.0, false, '🛁', '#0EA5E9'),
      ('Pantry', '1st Floor', 'Storage', 60, 68.0, 35.0, false, '🥫', '#A3E635'),
      ('Nursery', '2nd Floor', 'Bedroom', 180, 72.0, 45.0, true, '👶', '#FB7185')
    `);

    // Seed Devices (18 items)
    await client.query(`
      INSERT INTO devices (name, type, brand, model, room_id, status, ip_address, firmware, battery_level, last_active, icon) VALUES
      ('Main Light', 'Smart Light', 'Philips Hue', 'White Ambiance', 1, 'online', '192.168.1.10', 'v3.2.1', NULL, NOW(), '💡'),
      ('Thermostat', 'Thermostat', 'Nest', 'Learning 3rd Gen', 1, 'online', '192.168.1.11', 'v5.1.0', NULL, NOW(), '🌡️'),
      ('Security Camera', 'Camera', 'Ring', 'Indoor Cam', 1, 'online', '192.168.1.12', 'v2.4.0', NULL, NOW(), '📷'),
      ('Smart Speaker', 'Speaker', 'Amazon', 'Echo Dot 5th', 1, 'online', '192.168.1.13', 'v4.0.2', NULL, NOW(), '🔊'),
      ('Door Lock', 'Lock', 'August', 'Smart Lock Pro', 13, 'online', '192.168.1.14', 'v1.8.3', 85, NOW(), '🔒'),
      ('Bedroom Light', 'Smart Light', 'LIFX', 'A60 Color', 2, 'online', '192.168.1.15', 'v2.1.0', NULL, NOW(), '💡'),
      ('AC Unit', 'Climate', 'Sensibo', 'Sky', 2, 'online', '192.168.1.16', 'v3.0.1', NULL, NOW(), '❄️'),
      ('Kitchen Light', 'Smart Light', 'Philips Hue', 'Light Strip Plus', 3, 'online', '192.168.1.17', 'v3.2.1', NULL, NOW(), '💡'),
      ('Smart Fridge', 'Appliance', 'Samsung', 'Family Hub', 3, 'online', '192.168.1.18', 'v1.5.0', NULL, NOW(), '🧊'),
      ('Smoke Detector', 'Sensor', 'Nest', 'Protect 2nd Gen', 3, 'online', '192.168.1.19', 'v4.2.0', 92, NOW(), '🔥'),
      ('Robot Vacuum', 'Appliance', 'iRobot', 'Roomba j7+', 1, 'online', '192.168.1.20', 'v3.8.1', 78, NOW(), '🤖'),
      ('Garage Door', 'Actuator', 'MyQ', 'Smart Opener', 6, 'online', '192.168.1.21', 'v2.0.3', NULL, NOW(), '🚪'),
      ('Office Light', 'Smart Light', 'Nanoleaf', 'Shapes Hexagon', 5, 'online', '192.168.1.22', 'v1.9.0', NULL, NOW(), '💡'),
      ('Motion Sensor', 'Sensor', 'Aqara', 'P1', 13, 'online', '192.168.1.23', 'v1.3.2', 95, NOW(), '👁️'),
      ('Smart Plug', 'Plug', 'TP-Link', 'Kasa EP25', 5, 'online', '192.168.1.24', 'v2.1.0', NULL, NOW(), '🔌'),
      ('Water Sensor', 'Sensor', 'Aqara', 'Water Leak', 4, 'online', '192.168.1.25', 'v1.2.0', 88, NOW(), '💧'),
      ('Smart Blinds', 'Actuator', 'Lutron', 'Serena Shades', 2, 'online', '192.168.1.26', 'v2.3.0', 70, NOW(), '🪟'),
      ('Doorbell', 'Camera', 'Ring', 'Video Doorbell 4', 13, 'online', '192.168.1.27', 'v3.1.0', 60, NOW(), '🔔')
    `);

    // Seed Automations (16 items)
    await client.query(`
      INSERT INTO automations (name, description, trigger_type, trigger_value, action_type, action_value, is_active, room_id, icon) VALUES
      ('Morning Wake Up', 'Gradually turn on lights and adjust thermostat', 'time', '06:30', 'scene', 'morning_routine', true, 2, '🌅'),
      ('Away Mode', 'Activate security when everyone leaves', 'presence', 'all_away', 'security', 'arm_all', true, NULL, '🏃'),
      ('Night Lock Down', 'Lock doors and arm security at bedtime', 'time', '23:00', 'multi', 'lock_all,arm_security', true, NULL, '🌙'),
      ('Motion Lights', 'Turn on hallway lights on motion', 'sensor', 'motion_detected', 'device', 'lights_on', true, 13, '👁️'),
      ('Temperature Control', 'Adjust AC when temp exceeds 76F', 'sensor', 'temp_above_76', 'device', 'ac_cool_74', true, 1, '🌡️'),
      ('Doorbell Alert', 'Send notification when doorbell rings', 'device', 'doorbell_press', 'notification', 'doorbell_alert', true, 13, '🔔'),
      ('Leak Detection', 'Alert and shut water on leak detection', 'sensor', 'water_detected', 'multi', 'alert,shut_water', true, 4, '💧'),
      ('Sunset Lights', 'Turn on outdoor lights at sunset', 'time', 'sunset', 'device', 'outdoor_lights_on', true, 12, '🌇'),
      ('Smoke Alert', 'Emergency alert on smoke detection', 'sensor', 'smoke_detected', 'emergency', 'fire_alert', true, NULL, '🔥'),
      ('Good Morning Coffee', 'Start coffee maker at wake up time', 'time', '06:25', 'device', 'coffee_maker_on', true, 3, '☕'),
      ('Kids Bedtime', 'Dim lights in kids room at 8 PM', 'time', '20:00', 'scene', 'kids_sleep', true, 7, '🧸'),
      ('Energy Saver', 'Turn off idle devices after 30 min', 'sensor', 'no_motion_30min', 'device', 'power_off_idle', true, NULL, '⚡'),
      ('Welcome Home', 'Unlock door and set comfort when arriving', 'presence', 'owner_arriving', 'scene', 'welcome', true, NULL, '🏠'),
      ('Garage Auto Close', 'Close garage if open for 15 minutes', 'timer', '15_min_open', 'device', 'garage_close', true, 6, '🚗'),
      ('Rain Alert', 'Close windows notification when rain detected', 'weather', 'rain_incoming', 'notification', 'close_windows', true, NULL, '🌧️'),
      ('Party Mode', 'Set colorful lights and music on command', 'voice', 'party_time', 'scene', 'party', false, 1, '🎉')
    `);

    // Seed Scenes (16 items)
    await client.query(`
      INSERT INTO scenes (name, description, room_id, devices_config, mood, icon, color, is_active) VALUES
      ('Movie Night', 'Dim lights, close blinds, set ambient lighting', 1, '{"lights": "10%", "blinds": "closed", "tv": "on"}', 'relaxed', '🎬', '#1E1B4B', false),
      ('Morning Routine', 'Bright lights, news on speaker, coffee started', 2, '{"lights": "100%", "speaker": "news", "coffee": "on"}', 'energetic', '🌅', '#FEF3C7', false),
      ('Dinner Time', 'Warm lighting, soft music, dining room focus', 9, '{"lights": "60%", "music": "jazz", "candles": "on"}', 'warm', '🍷', '#7C2D12', false),
      ('Deep Focus', 'Cool white light, noise cancellation, DND mode', 5, '{"lights": "80%", "color": "cool_white", "dnd": true}', 'focused', '🎯', '#1E40AF', false),
      ('Goodnight', 'All lights off, doors locked, thermostat to sleep mode', NULL, '{"lights": "off", "locks": "locked", "temp": "68"}', 'calm', '🌙', '#312E81', false),
      ('Party Mode', 'Colorful dynamic lights, upbeat music, all rooms', 1, '{"lights": "dynamic", "music": "party", "color": "rainbow"}', 'exciting', '🎉', '#BE185D', false),
      ('Reading Time', 'Warm focused light, quiet environment', 1, '{"lights": "70%", "color": "warm", "music": "off"}', 'calm', '📚', '#92400E', false),
      ('Romantic', 'Soft pink lights, gentle music, fireplace on', 9, '{"lights": "30%", "color": "pink", "music": "romantic"}', 'romantic', '💕', '#9D174D', false),
      ('Workout', 'Bright energetic lights, pump-up music', 11, '{"lights": "100%", "color": "bright", "music": "workout"}', 'energetic', '💪', '#065F46', false),
      ('Cooking', 'Bright kitchen lights, timer ready, recipe display', 3, '{"lights": "100%", "display": "recipe", "timer": "ready"}', 'active', '👨‍🍳', '#EA580C', false),
      ('Baby Nap', 'Soft night light, white noise, monitor on', 16, '{"lights": "5%", "color": "soft_blue", "sound": "white_noise"}', 'peaceful', '👶', '#7E22CE', false),
      ('Game Time', 'Bias lighting, gaming audio, snack reminder', 11, '{"lights": "ambient", "color": "gaming", "audio": "surround"}', 'exciting', '🎮', '#4338CA', false),
      ('Wake Up Gentle', 'Gradual sunrise simulation over 30 minutes', 2, '{"lights": "sunrise", "duration": "30min", "sound": "birds"}', 'gentle', '☀️', '#F59E0B', false),
      ('Guest Welcome', 'Comfortable lighting, pleasant temperature, music', 8, '{"lights": "70%", "temp": "72", "music": "ambient"}', 'welcoming', '🏡', '#0D9488', false),
      ('Study Session', 'Cool bright light, lo-fi music, timer set', 7, '{"lights": "90%", "color": "daylight", "music": "lofi"}', 'focused', '📖', '#2563EB', false),
      ('Spa Bath', 'Soft blue lights, calming sounds, warm water', 14, '{"lights": "20%", "color": "blue", "sound": "spa"}', 'relaxed', '🧖', '#0891B2', false)
    `);

    // Seed Energy Logs (16 items)
    await client.query(`
      INSERT INTO energy_logs (device_id, device_name, consumption_kwh, cost_usd, date, peak_watts, category, efficiency_rating) VALUES
      (1, 'Main Light', 2.4, 0.29, '2024-12-15', 60, 'Lighting', 'A+'),
      (2, 'Thermostat', 15.8, 1.90, '2024-12-15', 3500, 'Climate', 'A'),
      (7, 'AC Unit', 28.5, 3.42, '2024-12-15', 5000, 'Climate', 'B+'),
      (9, 'Smart Fridge', 4.2, 0.50, '2024-12-15', 150, 'Appliance', 'A'),
      (11, 'Robot Vacuum', 1.8, 0.22, '2024-12-15', 40, 'Appliance', 'A+'),
      (6, 'Bedroom Light', 1.5, 0.18, '2024-12-15', 40, 'Lighting', 'A+'),
      (8, 'Kitchen Light', 3.1, 0.37, '2024-12-15', 72, 'Lighting', 'A'),
      (13, 'Office Light', 2.8, 0.34, '2024-12-15', 65, 'Lighting', 'A'),
      (15, 'Smart Plug', 5.6, 0.67, '2024-12-15', 1200, 'Plug', 'B'),
      (3, 'Security Camera', 0.8, 0.10, '2024-12-15', 12, 'Security', 'A+'),
      (18, 'Doorbell', 0.3, 0.04, '2024-12-15', 8, 'Security', 'A+'),
      (4, 'Smart Speaker', 0.5, 0.06, '2024-12-15', 15, 'Entertainment', 'A+'),
      (17, 'Smart Blinds', 0.2, 0.02, '2024-12-15', 10, 'Actuator', 'A+'),
      (12, 'Garage Door', 0.4, 0.05, '2024-12-15', 500, 'Actuator', 'B+'),
      (5, 'Door Lock', 0.1, 0.01, '2024-12-15', 5, 'Security', 'A+'),
      (10, 'Smoke Detector', 0.05, 0.01, '2024-12-15', 3, 'Safety', 'A+')
    `);

    // Seed Security Alerts (16 items)
    await client.query(`
      INSERT INTO security_alerts (type, severity, message, location, device_id, is_resolved, icon, created_at) VALUES
      ('Motion Detected', 'low', 'Motion detected in backyard at 2:30 AM', 'Backyard', 3, true, '👁️', NOW() - INTERVAL '2 days'),
      ('Door Unlocked', 'medium', 'Front door left unlocked for 30 minutes', 'Front Door', 5, true, '🔓', NOW() - INTERVAL '1 day'),
      ('Camera Offline', 'high', 'Living room camera went offline unexpectedly', 'Living Room', 3, false, '📷', NOW() - INTERVAL '3 hours'),
      ('Failed Login', 'medium', 'Multiple failed login attempts detected', 'System', NULL, false, '⚠️', NOW() - INTERVAL '5 hours'),
      ('Window Open', 'low', 'Kitchen window left open while away', 'Kitchen', NULL, true, '🪟', NOW() - INTERVAL '3 days'),
      ('Smoke Detected', 'critical', 'Smoke detected in kitchen - false alarm from cooking', 'Kitchen', 10, true, '🔥', NOW() - INTERVAL '5 days'),
      ('Water Leak', 'critical', 'Water leak detected under bathroom sink', 'Bathroom', 16, true, '💧', NOW() - INTERVAL '7 days'),
      ('Unknown Person', 'high', 'Unrecognized person at front door', 'Front Door', 18, true, '👤', NOW() - INTERVAL '4 hours'),
      ('Garage Open', 'medium', 'Garage door left open after 10 PM', 'Garage', 12, true, '🚗', NOW() - INTERVAL '2 days'),
      ('Network Intrusion', 'critical', 'Unusual network activity detected on IoT subnet', 'Network', NULL, false, '🌐', NOW() - INTERVAL '1 hour'),
      ('Battery Low', 'low', 'Door lock battery below 20%', 'Front Door', 5, false, '🔋', NOW() - INTERVAL '6 hours'),
      ('Tampering', 'high', 'Motion sensor tamper alert in hallway', 'Hallway', 14, false, '🛑', NOW() - INTERVAL '30 minutes'),
      ('Power Outage', 'high', 'Brief power outage detected, backup activated', 'System', NULL, true, '⚡', NOW() - INTERVAL '4 days'),
      ('Doorbell Ring', 'low', 'Package delivery detected at front door', 'Front Door', 18, true, '📦', NOW() - INTERVAL '8 hours'),
      ('Late Night Activity', 'medium', 'Movement detected at 3 AM in basement', 'Basement', NULL, true, '🌙', NOW() - INTERVAL '6 days'),
      ('Device Added', 'low', 'New device connected to home network', 'Network', NULL, false, '📱', NOW() - INTERVAL '12 hours')
    `);

    // Seed User Profiles (16 items)
    await client.query(`
      INSERT INTO user_profiles (name, role, avatar, preferences, voice_id, age, relation, is_home, last_seen) VALUES
      ('James Wilson', 'Home Owner', '👨', '{"theme": "dark", "temp": 72, "music": "jazz"}', 'voice_james', 42, 'Father', true, NOW()),
      ('Sarah Wilson', 'Home Owner', '👩', '{"theme": "light", "temp": 73, "music": "pop"}', 'voice_sarah', 39, 'Mother', true, NOW()),
      ('Max Wilson', 'Child', '👦', '{"theme": "colorful", "temp": 71, "music": "gaming"}', 'voice_max', 14, 'Son', false, NOW() - INTERVAL '2 hours'),
      ('Emma Wilson', 'Child', '👧', '{"theme": "pink", "temp": 72, "music": "disney"}', 'voice_emma', 8, 'Daughter', true, NOW()),
      ('Grandma Rose', 'Guest', '👵', '{"theme": "light", "temp": 74, "music": "classical"}', 'voice_rose', 68, 'Grandmother', false, NOW() - INTERVAL '3 days'),
      ('Uncle Bob', 'Guest', '👴', '{"theme": "dark", "temp": 70, "music": "rock"}', 'voice_bob', 55, 'Uncle', false, NOW() - INTERVAL '7 days'),
      ('Nanny Maria', 'Staff', '👩‍⚕️', '{"theme": "light", "temp": 72, "music": "ambient"}', 'voice_maria', 32, 'Nanny', false, NOW() - INTERVAL '1 day'),
      ('Dog Walker Pete', 'Service', '🧑', '{"theme": "default", "temp": 72}', 'voice_pete', 28, 'Service', false, NOW() - INTERVAL '2 days'),
      ('Baby Lily', 'Infant', '👶', '{"monitor": true, "white_noise": true}', NULL, 1, 'Daughter', true, NOW()),
      ('Cleaning Crew', 'Service', '🧹', '{"access_level": "limited", "schedule": "weekly"}', NULL, NULL, 'Service', false, NOW() - INTERVAL '4 days'),
      ('Neighbor Jake', 'Trusted', '🏘️', '{"access": "emergency_only"}', 'voice_jake', 35, 'Neighbor', false, NOW() - INTERVAL '14 days'),
      ('Gardener Tom', 'Service', '🌱', '{"access": "outdoor_only", "schedule": "biweekly"}', NULL, 45, 'Service', false, NOW() - INTERVAL '5 days'),
      ('Tutor Anna', 'Service', '📚', '{"access": "office_kids_room", "schedule": "tue_thu"}', 'voice_anna', 26, 'Tutor', false, NOW() - INTERVAL '3 days'),
      ('Aunt Lisa', 'Family', '👩‍🦰', '{"theme": "light", "temp": 73, "music": "country"}', 'voice_lisa', 44, 'Aunt', false, NOW() - INTERVAL '21 days'),
      ('Cousin Mike', 'Family', '🧑‍🦱', '{"theme": "dark", "temp": 69, "music": "hiphop"}', 'voice_mike', 19, 'Cousin', false, NOW() - INTERVAL '30 days'),
      ('Pet Sitter Amy', 'Service', '🐾', '{"access": "ground_floor", "schedule": "as_needed"}', 'voice_amy', 23, 'Service', false, NOW() - INTERVAL '10 days')
    `);

    // Seed Schedules (16 items)
    await client.query(`
      INSERT INTO schedules (name, description, cron_expression, action_type, action_value, device_id, room_id, is_active, next_run, last_run, icon) VALUES
      ('Morning Lights', 'Turn on lights gradually', '30 6 * * 1-5', 'device', 'lights_sunrise', 1, 1, true, NOW() + INTERVAL '1 day', NOW() - INTERVAL '12 hours', '🌅'),
      ('Evening Thermostat', 'Set comfortable evening temp', '0 18 * * *', 'device', 'set_temp_72', 2, 1, true, NOW() + INTERVAL '6 hours', NOW() - INTERVAL '18 hours', '🌡️'),
      ('Robot Vacuum Daily', 'Run vacuum on ground floor', '0 10 * * 1-5', 'device', 'start_cleaning', 11, 1, true, NOW() + INTERVAL '1 day', NOW() - INTERVAL '1 day', '🤖'),
      ('Weekend Sleep In', 'Delay morning routine to 8 AM', '0 8 * * 6,0', 'scene', 'morning_routine', NULL, 2, true, NOW() + INTERVAL '3 days', NOW() - INTERVAL '4 days', '😴'),
      ('Porch Lights On', 'Turn on porch lights at sunset', '0 18 * * *', 'device', 'porch_on', NULL, 12, true, NOW() + INTERVAL '5 hours', NOW() - INTERVAL '19 hours', '💡'),
      ('Porch Lights Off', 'Turn off porch lights at midnight', '0 0 * * *', 'device', 'porch_off', NULL, 12, true, NOW() + INTERVAL '11 hours', NOW() - INTERVAL '13 hours', '🌙'),
      ('Water Plants', 'Activate sprinkler system', '0 6 * * 1,3,5', 'device', 'sprinkler_on', NULL, 12, true, NOW() + INTERVAL '2 days', NOW() - INTERVAL '2 days', '🌱'),
      ('AC Pre-Cool', 'Pre-cool house before arrival', '0 16 * * 1-5', 'device', 'ac_cool_72', 7, NULL, true, NOW() + INTERVAL '3 hours', NOW() - INTERVAL '21 hours', '❄️'),
      ('Security Night Mode', 'Arm all security sensors', '0 23 * * *', 'security', 'arm_night', NULL, NULL, true, NOW() + INTERVAL '10 hours', NOW() - INTERVAL '14 hours', '🔒'),
      ('Morning Coffee', 'Start coffee maker', '25 6 * * 1-5', 'device', 'coffee_start', NULL, 3, true, NOW() + INTERVAL '1 day', NOW() - INTERVAL '12 hours', '☕'),
      ('Kids Bedtime Dim', 'Dim kids room lights', '0 20 * * 0-4', 'device', 'lights_dim_20', NULL, 7, true, NOW() + INTERVAL '7 hours', NOW() - INTERVAL '17 hours', '🧸'),
      ('Weekly Backup', 'Backup smart home config', '0 3 * * 0', 'system', 'backup_config', NULL, NULL, true, NOW() + INTERVAL '5 days', NOW() - INTERVAL '2 days', '💾'),
      ('Filter Reminder', 'Check HVAC filter monthly', '0 9 1 * *', 'notification', 'filter_check', 2, NULL, true, NOW() + INTERVAL '15 days', NOW() - INTERVAL '15 days', '🔧'),
      ('Garage Auto Close', 'Close garage if still open', '0 22 * * *', 'device', 'garage_close', 12, 6, true, NOW() + INTERVAL '9 hours', NOW() - INTERVAL '15 hours', '🚗'),
      ('Energy Report', 'Generate daily energy report', '0 8 * * *', 'report', 'energy_daily', NULL, NULL, true, NOW() + INTERVAL '1 day', NOW() - INTERVAL '16 hours', '📊'),
      ('Network Scan', 'Scan for unauthorized devices', '0 2 * * *', 'security', 'network_scan', NULL, NULL, true, NOW() + INTERVAL '13 hours', NOW() - INTERVAL '11 hours', '🌐')
    `);

    // Seed Sensors (16 items)
    await client.query(`
      INSERT INTO sensors (name, type, room_id, value, unit, min_threshold, max_threshold, status, battery_level, last_reading, icon) VALUES
      ('Living Room Temp', 'temperature', 1, 72.5, '°F', 65.0, 80.0, 'normal', NULL, NOW(), '🌡️'),
      ('Living Room Humidity', 'humidity', 1, 45.0, '%', 30.0, 60.0, 'normal', NULL, NOW(), '💧'),
      ('Kitchen CO2', 'co2', 3, 420, 'ppm', 0, 1000, 'normal', 90, NOW(), '🫁'),
      ('Outdoor Temperature', 'temperature', 12, 78.0, '°F', NULL, NULL, 'normal', 85, NOW(), '☀️'),
      ('Bedroom Air Quality', 'aqi', 2, 35, 'AQI', 0, 100, 'good', 88, NOW(), '🌿'),
      ('Bathroom Humidity', 'humidity', 4, 65.0, '%', 30.0, 70.0, 'warning', NULL, NOW(), '💧'),
      ('Garage CO', 'co', 6, 2, 'ppm', 0, 35, 'normal', 75, NOW(), '⚠️'),
      ('Basement Moisture', 'moisture', 11, 42.0, '%', 20.0, 60.0, 'normal', 80, NOW(), '💦'),
      ('Nursery Noise', 'noise', 16, 32, 'dB', 0, 60, 'normal', 92, NOW(), '🔇'),
      ('Office Light Level', 'luminance', 5, 450, 'lux', 300, 750, 'normal', NULL, NOW(), '☀️'),
      ('Front Door Vibration', 'vibration', 13, 0.2, 'g', 0, 2.0, 'normal', 87, NOW(), '📳'),
      ('Kitchen Smoke', 'smoke', 3, 0.5, 'ppm', 0, 10, 'normal', 95, NOW(), '💨'),
      ('Master Bed Pressure', 'pressure', 2, 1013.25, 'hPa', 980, 1050, 'normal', NULL, NOW(), '🔵'),
      ('Patio UV Index', 'uv', 12, 6, 'UV', 0, 11, 'moderate', 70, NOW(), '🌞'),
      ('Pantry Temperature', 'temperature', 15, 68.0, '°F', 50.0, 75.0, 'normal', 82, NOW(), '🌡️'),
      ('Kids Room VOC', 'voc', 7, 120, 'ppb', 0, 500, 'good', 78, NOW(), '🍃')
    `);

    // Seed Notifications (16 items)
    await client.query(`
      INSERT INTO notifications (title, message, type, priority, source, is_read, icon, created_at) VALUES
      ('Welcome Home', 'James has arrived home. Setting comfort preferences.', 'info', 'low', 'Presence', true, '🏠', NOW() - INTERVAL '1 hour'),
      ('Energy Alert', 'Daily energy consumption is 15% above average.', 'warning', 'medium', 'Energy', false, '⚡', NOW() - INTERVAL '2 hours'),
      ('Device Offline', 'Living room camera is offline. Check connection.', 'error', 'high', 'Device', false, '📷', NOW() - INTERVAL '3 hours'),
      ('Schedule Complete', 'Morning routine executed successfully.', 'success', 'low', 'Schedule', true, '✅', NOW() - INTERVAL '6 hours'),
      ('Security Update', 'New firmware available for 3 devices.', 'info', 'medium', 'System', false, '🔄', NOW() - INTERVAL '12 hours'),
      ('Water Usage', 'Garden sprinkler used 50 gallons today.', 'info', 'low', 'Water', true, '🌊', NOW() - INTERVAL '1 day'),
      ('Temperature Alert', 'Nursery temperature dropped below 68F.', 'warning', 'high', 'Sensor', false, '🌡️', NOW() - INTERVAL '30 minutes'),
      ('Package Delivered', 'A package was detected at the front door.', 'info', 'medium', 'Security', true, '📦', NOW() - INTERVAL '4 hours'),
      ('Automation Failed', 'Evening thermostat automation failed to execute.', 'error', 'high', 'Automation', false, '❌', NOW() - INTERVAL '5 hours'),
      ('Battery Low', 'Front door lock battery at 15%.', 'warning', 'medium', 'Device', false, '🔋', NOW() - INTERVAL '8 hours'),
      ('Guest Arriving', 'Grandma Rose will arrive in 30 minutes.', 'info', 'low', 'Calendar', true, '👵', NOW() - INTERVAL '2 days'),
      ('Air Quality', 'Indoor air quality improved to Good level.', 'success', 'low', 'Sensor', true, '🌿', NOW() - INTERVAL '3 hours'),
      ('Maintenance Due', 'HVAC filter replacement is overdue by 5 days.', 'warning', 'medium', 'Maintenance', false, '🔧', NOW() - INTERVAL '5 days'),
      ('Network Alert', 'Unknown device attempted to connect.', 'error', 'critical', 'Network', false, '🌐', NOW() - INTERVAL '1 hour'),
      ('Voice Command', 'New voice command learned: Movie time.', 'success', 'low', 'AI', true, '🎤', NOW() - INTERVAL '6 hours'),
      ('Savings Milestone', 'You saved $45 on energy this month!', 'success', 'low', 'Energy', true, '💰', NOW() - INTERVAL '1 day')
    `);

    // Seed Maintenance Logs (16 items)
    await client.query(`
      INSERT INTO maintenance_logs (device_id, device_name, type, description, status, scheduled_date, completed_date, cost, technician, priority, icon) VALUES
      (2, 'Thermostat', 'Calibration', 'Annual thermostat calibration and cleaning', 'completed', '2024-12-01', '2024-12-01', 75.00, 'HVAC Pro Services', 'medium', '🌡️'),
      (9, 'Smart Fridge', 'Filter Replace', 'Replace water filter cartridge', 'completed', '2024-11-15', '2024-11-15', 45.00, 'Self', 'low', '🧊'),
      (11, 'Robot Vacuum', 'Brush Replace', 'Replace main brush and side brushes', 'completed', '2024-12-10', '2024-12-10', 29.99, 'Self', 'low', '🤖'),
      (3, 'Security Camera', 'Firmware Update', 'Critical security firmware update', 'pending', '2024-12-20', NULL, 0.00, 'Self', 'high', '📷'),
      (7, 'AC Unit', 'Annual Service', 'Full AC inspection and refrigerant check', 'scheduled', '2025-01-15', NULL, 150.00, 'CoolAir HVAC', 'high', '❄️'),
      (5, 'Door Lock', 'Battery Replace', 'Replace CR123A batteries', 'pending', '2024-12-18', NULL, 12.00, 'Self', 'medium', '🔒'),
      (1, 'Main Light', 'Bulb Replace', 'Replace Hue bulb showing reduced brightness', 'completed', '2024-11-28', '2024-11-28', 24.99, 'Self', 'low', '💡'),
      (12, 'Garage Door', 'Lubrication', 'Lubricate garage door tracks and hinges', 'completed', '2024-11-20', '2024-11-20', 0.00, 'Self', 'low', '🚗'),
      (10, 'Smoke Detector', 'Testing', 'Monthly smoke detector test', 'scheduled', '2025-01-01', NULL, 0.00, 'Self', 'high', '🔥'),
      (18, 'Doorbell', 'Battery Replace', 'Replace rechargeable battery pack', 'pending', '2024-12-22', NULL, 0.00, 'Self', 'medium', '🔔'),
      (17, 'Smart Blinds', 'Motor Check', 'Blinds motor making unusual noise', 'scheduled', '2025-01-10', NULL, 85.00, 'Window Solutions', 'medium', '🪟'),
      (15, 'Smart Plug', 'Inspection', 'Check for overheating issues', 'completed', '2024-12-05', '2024-12-05', 0.00, 'Self', 'low', '🔌'),
      (14, 'Motion Sensor', 'Recalibrate', 'Sensor triggering false positives', 'in_progress', '2024-12-16', NULL, 0.00, 'Self', 'medium', '👁️'),
      (4, 'Smart Speaker', 'Reset', 'Factory reset to fix connectivity issues', 'completed', '2024-12-08', '2024-12-08', 0.00, 'Self', 'low', '🔊'),
      (6, 'Bedroom Light', 'Color Check', 'Color temperature seems off, needs recalibration', 'pending', '2024-12-25', NULL, 0.00, 'Self', 'low', '💡'),
      (16, 'Water Sensor', 'Battery Replace', 'Replace CR2032 battery', 'scheduled', '2025-01-05', NULL, 5.00, 'Self', 'medium', '💧')
    `);

    // Seed Analytics (16 items)
    await client.query(`
      INSERT INTO analytics (metric_name, category, value, unit, period, trend, change_percent, details, icon) VALUES
      ('Total Energy Usage', 'Energy', 847.50, 'kWh', 'monthly', 'down', -12.5, '{"previous": 968.57, "target": 800}', '⚡'),
      ('Average Temperature', 'Climate', 72.3, '°F', 'weekly', 'stable', 0.5, '{"min": 68, "max": 76}', '🌡️'),
      ('Security Incidents', 'Security', 8, 'events', 'monthly', 'up', 33.3, '{"resolved": 6, "pending": 2}', '🔒'),
      ('Devices Online', 'System', 16, 'devices', 'current', 'stable', 0, '{"total": 18, "offline": 2}', '📱'),
      ('Automation Success Rate', 'Automation', 94.5, '%', 'weekly', 'up', 2.3, '{"total_runs": 200, "failed": 11}', '🤖'),
      ('Monthly Cost Savings', 'Energy', 45.30, 'USD', 'monthly', 'up', 15.8, '{"baseline": 320, "actual": 274.70}', '💰'),
      ('Voice Commands Used', 'AI', 342, 'commands', 'monthly', 'up', 28.5, '{"successful": 325, "failed": 17}', '🎤'),
      ('Network Bandwidth', 'Network', 125.6, 'GB', 'monthly', 'up', 8.2, '{"upload": 15.2, "download": 110.4}', '🌐'),
      ('Water Usage', 'Utility', 4250, 'gallons', 'monthly', 'down', -5.0, '{"indoor": 2800, "outdoor": 1450}', '🌊'),
      ('Air Quality Index', 'Health', 28, 'AQI', 'daily', 'stable', -2.0, '{"category": "Good", "pollutant": "PM2.5"}', '🌿'),
      ('Motion Events', 'Security', 1247, 'events', 'monthly', 'stable', 1.2, '{"indoor": 980, "outdoor": 267}', '👁️'),
      ('Lighting Hours', 'Energy', 186, 'hours', 'weekly', 'down', -8.0, '{"natural_light_offset": 42}', '💡'),
      ('Guest Visits', 'Profiles', 12, 'visits', 'monthly', 'up', 50.0, '{"unique_guests": 5, "repeat": 7}', '🏘️'),
      ('Maintenance Tasks', 'Maintenance', 6, 'tasks', 'monthly', 'down', -25.0, '{"completed": 4, "pending": 2}', '🔧'),
      ('Scene Activations', 'Scenes', 89, 'activations', 'weekly', 'up', 12.0, '{"most_used": "Goodnight", "count": 14}', '🎬'),
      ('System Uptime', 'System', 99.7, '%', 'monthly', 'stable', 0.1, '{"downtime_minutes": 129}', '⏱️')
    `);

    // Seed Recommendations (16 items)
    await client.query(`
      INSERT INTO recommendations (title, description, category, priority, potential_savings, difficulty, status, ai_confidence, icon) VALUES
      ('Optimize Thermostat Schedule', 'AI detected your thermostat runs during empty house hours.', 'Energy', 'high', 35.00, 'easy', 'pending', 0.92, '🌡️'),
      ('Replace Kitchen Lights with LED', 'Kitchen lights consume 40% more than LED alternatives.', 'Energy', 'medium', 18.00, 'easy', 'pending', 0.88, '💡'),
      ('Add Motion Sensor to Basement', 'Basement lights are often left on. A motion sensor would auto-control them.', 'Automation', 'medium', 12.00, 'medium', 'pending', 0.85, '👁️'),
      ('Enable Sleep Mode Network', 'Disable non-essential IoT devices between 1-5 AM.', 'Security', 'low', 8.00, 'easy', 'pending', 0.78, '🌙'),
      ('Upgrade AC Unit', 'Your AC unit efficiency is B+. A newer model could save 20%.', 'Energy', 'high', 180.00, 'hard', 'pending', 0.91, '❄️'),
      ('Smart Irrigation Schedule', 'Weather-based irrigation could reduce water usage by 30%.', 'Water', 'medium', 25.00, 'medium', 'accepted', 0.87, '🌱'),
      ('Add Door Sensor to Garage', 'Garage door occasionally left open. A sensor alert would help.', 'Security', 'high', 0.00, 'easy', 'completed', 0.94, '🚗'),
      ('Create Vacation Mode', 'An automated vacation scene could simulate presence while away.', 'Security', 'medium', 0.00, 'medium', 'pending', 0.82, '✈️'),
      ('Batch Device Updates', 'Schedule firmware updates during off-peak hours.', 'System', 'low', 0.00, 'easy', 'accepted', 0.90, '🔄'),
      ('Install Smart Power Strip', 'Entertainment center uses phantom power. Smart strip could help.', 'Energy', 'medium', 15.00, 'easy', 'pending', 0.86, '🔌'),
      ('Optimize Robot Vacuum Path', 'Vacuum covers redundant areas. Optimized path saves 20 min.', 'Automation', 'low', 5.00, 'easy', 'pending', 0.79, '🤖'),
      ('Add Air Purifier to Nursery', 'Nursery VOC levels occasionally spike.', 'Health', 'high', 0.00, 'medium', 'pending', 0.93, '🌿'),
      ('Solar Panel Assessment', 'Solar could offset 60% of your energy costs.', 'Energy', 'high', 450.00, 'hard', 'pending', 0.75, '☀️'),
      ('Smart Water Heater Timer', 'Water heater runs continuously. A timer could save 15%.', 'Energy', 'medium', 22.00, 'medium', 'pending', 0.84, '🚿'),
      ('Improve WiFi Coverage', 'Two devices show intermittent connectivity.', 'Network', 'medium', 0.00, 'medium', 'pending', 0.88, '📶'),
      ('Create Emergency Protocol', 'Set up automated emergency responses for fire, flood, intrusion.', 'Safety', 'critical', 0.00, 'hard', 'pending', 0.96, '🆘')
    `);

    // Seed AI Conversations
    await client.query(`
      INSERT INTO ai_conversations (user_message, ai_response, context, tokens_used, model) VALUES
      ('What is the temperature in the living room?', 'The living room is currently at 72.5F with 45% humidity.', 'devices', 150, 'anthropic/claude-haiku-4.5'),
      ('Turn on movie night mode', 'Movie Night scene activated. Lights dimmed to 10%, blinds closed.', 'scenes', 120, 'anthropic/claude-haiku-4.5'),
      ('How much energy did we use today?', 'Total energy consumption today is 67.4 kWh, 8% below average.', 'energy', 180, 'anthropic/claude-haiku-4.5'),
      ('Is everyone home?', 'Currently home: James, Sarah, Emma, and Baby Lily.', 'profiles', 130, 'anthropic/claude-haiku-4.5'),
      ('Any security concerns?', 'There are 4 unresolved alerts: camera offline, failed login, network intrusion, low battery.', 'security', 200, 'anthropic/claude-haiku-4.5')
    `);

    // ============================================
    // Seed data for new Home Life features
    // ============================================

    // Seed Weather Data
    await client.query(`
      INSERT INTO weather_data (location, date, temperature, feels_like, humidity, wind_speed, condition, forecast_high, forecast_low, uv_index, icon) VALUES
      ('Home - Outdoor', '2024-12-15', 45.2, 40.1, 55.0, 12.5, 'Partly Cloudy', 48.0, 32.0, 3, '⛅'),
      ('Home - Outdoor', '2024-12-16', 38.5, 33.2, 62.0, 18.3, 'Snow Flurries', 40.0, 28.0, 2, '🌨️'),
      ('Home - Outdoor', '2024-12-17', 42.0, 38.5, 48.0, 8.2, 'Sunny', 46.0, 30.0, 4, '☀️'),
      ('Home - Outdoor', '2024-12-18', 50.3, 47.8, 70.0, 15.0, 'Rainy', 52.0, 38.0, 1, '🌧️'),
      ('Home - Outdoor', '2024-12-19', 55.0, 52.0, 45.0, 6.5, 'Clear', 58.0, 40.0, 5, '🌤️'),
      ('Home - Outdoor', '2024-12-20', 35.8, 28.3, 58.0, 22.0, 'Windy', 38.0, 25.0, 2, '💨'),
      ('Home - Outdoor', '2024-12-21', 30.0, 22.5, 65.0, 25.0, 'Snowstorm', 32.0, 20.0, 1, '❄️'),
      ('Home - Outdoor', '2024-12-22', 40.5, 37.0, 50.0, 10.0, 'Overcast', 43.0, 33.0, 2, '☁️')
    `);

    // Seed Shopping Items
    await client.query(`
      INSERT INTO shopping_items (name, category, quantity, unit, store, estimated_price, is_purchased, priority, added_by, icon) VALUES
      ('Whole Milk', 'Dairy', 2, 'gallons', 'Costco', 5.99, false, 'high', 'Sarah', '🥛'),
      ('Chicken Breast', 'Meat', 3, 'lbs', 'Whole Foods', 12.99, false, 'high', 'James', '🍗'),
      ('Bananas', 'Fruit', 1, 'bunch', 'Trader Joes', 0.79, true, 'medium', 'Sarah', '🍌'),
      ('Bread', 'Bakery', 2, 'loaves', 'Costco', 4.49, false, 'medium', 'James', '🍞'),
      ('Paper Towels', 'Household', 1, 'pack', 'Costco', 18.99, false, 'low', 'Sarah', '🧻'),
      ('Dog Food', 'Pet', 1, 'bag', 'PetSmart', 42.99, false, 'high', 'Max', '🐕'),
      ('Laundry Detergent', 'Household', 1, 'bottle', 'Target', 11.99, true, 'medium', 'Sarah', '🧴'),
      ('Eggs', 'Dairy', 2, 'dozen', 'Costco', 6.99, false, 'high', 'Sarah', '🥚'),
      ('Apples', 'Fruit', 6, 'count', 'Whole Foods', 5.49, false, 'medium', 'Emma', '🍎'),
      ('Pasta', 'Pantry', 3, 'boxes', 'Target', 4.47, true, 'low', 'James', '🍝')
    `);

    // Seed Calendar Events
    await client.query(`
      INSERT INTO calendar_events (title, description, event_date, start_time, end_time, location, category, recurrence, assigned_to, is_all_day, reminder_minutes, icon) VALUES
      ('Family Dinner', 'Weekly family dinner night', '2024-12-20', '18:00', '20:00', 'Home - Dining Room', 'Family', 'weekly', 'Everyone', false, 60, '🍽️'),
      ('Max Soccer Practice', 'Soccer practice at the park', '2024-12-18', '16:00', '17:30', 'Central Park Field', 'Sports', 'weekly', 'Max', false, 30, '⚽'),
      ('Emma Piano Lesson', 'Piano lessons with Mrs. Chen', '2024-12-19', '15:00', '16:00', 'Music Academy', 'Education', 'weekly', 'Emma', false, 30, '🎹'),
      ('Vet Appointment', 'Annual checkup for Buddy', '2024-12-22', '10:00', '11:00', 'Happy Paws Vet', 'Pet', 'none', 'Sarah', false, 120, '🐕'),
      ('Holiday Party', 'Neighborhood holiday gathering', '2024-12-24', NULL, NULL, 'Neighbor Jake House', 'Social', 'none', 'Everyone', true, 1440, '🎄'),
      ('Dentist - James', 'Regular dental checkup', '2024-12-27', '09:00', '10:00', 'Smile Dental', 'Health', 'none', 'James', false, 120, '🦷'),
      ('House Cleaning', 'Monthly deep cleaning service', '2024-12-21', '09:00', '13:00', 'Home', 'Household', 'monthly', 'Cleaning Crew', false, 60, '🧹'),
      ('Date Night', 'James and Sarah date night', '2024-12-21', '19:00', '22:00', 'Downtown', 'Social', 'biweekly', 'James & Sarah', false, 120, '💕')
    `);

    // Seed Recipes
    await client.query(`
      INSERT INTO recipes (name, description, cuisine, category, prep_time_min, cook_time_min, servings, difficulty, instructions, calories, rating, is_favorite, icon) VALUES
      ('Spaghetti Bolognese', 'Classic Italian meat sauce pasta', 'Italian', 'Dinner', 15, 45, 6, 'easy', 'Brown meat, add sauce, simmer, cook pasta, serve.', 580, 4.5, true, '🍝'),
      ('Chicken Stir Fry', 'Quick and healthy Asian stir fry', 'Asian', 'Dinner', 20, 15, 4, 'easy', 'Cut veggies, cook chicken, stir fry, add sauce.', 420, 4.2, true, '🥘'),
      ('Pancakes', 'Fluffy buttermilk pancakes', 'American', 'Breakfast', 10, 15, 8, 'easy', 'Mix batter, cook on griddle, flip when bubbly.', 350, 4.8, true, '🥞'),
      ('Caesar Salad', 'Classic Caesar with homemade dressing', 'American', 'Lunch', 15, 0, 4, 'easy', 'Make dressing, chop romaine, toss, add croutons.', 280, 4.0, false, '🥗'),
      ('Beef Tacos', 'Seasoned ground beef tacos', 'Mexican', 'Dinner', 10, 20, 6, 'easy', 'Brown beef with seasoning, warm shells, assemble.', 450, 4.6, true, '🌮'),
      ('Banana Bread', 'Moist banana bread with walnuts', 'American', 'Dessert', 15, 60, 10, 'easy', 'Mash bananas, mix ingredients, bake at 350F.', 290, 4.7, true, '🍌'),
      ('Grilled Salmon', 'Lemon herb grilled salmon', 'American', 'Dinner', 10, 12, 4, 'medium', 'Marinate salmon, grill 6 min each side.', 380, 4.4, false, '🐟'),
      ('Tomato Soup', 'Creamy roasted tomato soup', 'American', 'Lunch', 15, 40, 6, 'easy', 'Roast tomatoes, blend with broth, add cream.', 220, 4.3, false, '🍅')
    `);

    // Seed Chores
    await client.query(`
      INSERT INTO chores (title, description, assigned_to, room_id, frequency, priority, status, due_date, completed_date, points, icon) VALUES
      ('Vacuum Living Room', 'Vacuum carpet and under furniture', 'Max', 1, 'weekly', 'medium', 'pending', '2024-12-20', NULL, 10, '🧹'),
      ('Do Dishes', 'Wash and dry all dishes', 'Emma', 3, 'daily', 'high', 'completed', '2024-12-17', '2024-12-17', 5, '🍽️'),
      ('Take Out Trash', 'Empty all trash cans and take to curb', 'Max', NULL, 'weekly', 'high', 'pending', '2024-12-19', NULL, 8, '🗑️'),
      ('Clean Bathroom', 'Scrub toilet, sink, and tub', 'James', 4, 'weekly', 'medium', 'in_progress', '2024-12-21', NULL, 15, '🚿'),
      ('Mow Lawn', 'Mow front and back yard', 'James', 12, 'biweekly', 'low', 'pending', '2024-12-28', NULL, 20, '🌱'),
      ('Feed Dog', 'Feed Buddy breakfast and dinner', 'Emma', 3, 'daily', 'high', 'completed', '2024-12-17', '2024-12-17', 3, '🐕'),
      ('Make Beds', 'Make all beds in the morning', 'Everyone', NULL, 'daily', 'medium', 'pending', '2024-12-18', NULL, 5, '🛏️'),
      ('Organize Garage', 'Sort and organize garage items', 'James', 6, 'monthly', 'low', 'pending', '2024-12-30', NULL, 25, '🚗'),
      ('Water Indoor Plants', 'Water all indoor potted plants', 'Sarah', NULL, 'biweekly', 'medium', 'pending', '2024-12-20', NULL, 5, '🌿'),
      ('Fold Laundry', 'Fold and put away clean laundry', 'Sarah', 10, 'weekly', 'medium', 'pending', '2024-12-19', NULL, 8, '👕')
    `);

    // Seed Pets
    await client.query(`
      INSERT INTO pets (name, species, breed, age_years, weight, vet_name, vet_phone, next_vet_visit, feeding_schedule, medications, notes, icon) VALUES
      ('Buddy', 'Dog', 'Golden Retriever', 5.0, 72.5, 'Dr. Martinez', '555-0101', '2024-12-22', '7 AM and 6 PM', 'Heartworm monthly', 'Loves fetch, afraid of thunder', '🐕'),
      ('Whiskers', 'Cat', 'Maine Coon', 3.5, 14.2, 'Dr. Martinez', '555-0101', '2025-03-15', '7 AM and 5 PM', NULL, 'Indoor only, loves window perch', '🐱'),
      ('Goldie', 'Fish', 'Goldfish', 2.0, 0.1, NULL, NULL, NULL, 'Once daily', NULL, 'Tank in living room, clean weekly', '🐟'),
      ('Coco', 'Hamster', 'Syrian', 1.5, 0.3, 'Dr. Small Pets', '555-0202', '2025-02-10', 'Evening', 'Vitamin drops weekly', 'Emmas pet, cage in kids room', '🐹')
    `);

    // Seed Plants
    await client.query(`
      INSERT INTO plants (name, species, location, sunlight_needs, water_frequency, last_watered, next_water, last_fertilized, health_status, notes, icon) VALUES
      ('Fiddle Leaf Fig', 'Ficus lyrata', 'Living Room', 'partial_sun', 'Weekly', '2024-12-14', '2024-12-21', '2024-11-15', 'healthy', 'Keep away from drafts', '🌿'),
      ('Snake Plant', 'Sansevieria', 'Home Office', 'shade', 'Biweekly', '2024-12-10', '2024-12-24', '2024-10-01', 'healthy', 'Very low maintenance', '🌱'),
      ('Basil', 'Ocimum basilicum', 'Kitchen Window', 'full_sun', 'Every 2 days', '2024-12-16', '2024-12-18', '2024-12-01', 'healthy', 'Harvest regularly for cooking', '🌿'),
      ('Orchid', 'Phalaenopsis', 'Master Bedroom', 'partial_sun', 'Weekly', '2024-12-13', '2024-12-20', '2024-11-20', 'needs_attention', 'Yellowing leaves, check drainage', '🌸'),
      ('Rose Bush', 'Rosa', 'Patio', 'full_sun', 'Every 3 days', '2024-12-15', '2024-12-18', '2024-11-01', 'dormant', 'Winter dormancy, prune in spring', '🌹'),
      ('Aloe Vera', 'Aloe barbadensis', 'Bathroom', 'partial_sun', 'Biweekly', '2024-12-08', '2024-12-22', NULL, 'healthy', 'Good for burns', '🪴'),
      ('Tomato Plant', 'Solanum lycopersicum', 'Patio', 'full_sun', 'Daily', '2024-12-17', '2024-12-18', '2024-12-10', 'healthy', 'Indoor for winter', '🍅'),
      ('Peace Lily', 'Spathiphyllum', 'Nursery', 'shade', 'Weekly', '2024-12-12', '2024-12-19', '2024-11-15', 'healthy', 'Air purifying, safe spot away from baby', '🪷')
    `);

    // Seed Guests
    await client.query(`
      INSERT INTO guests (name, relationship, phone, email, visit_date, departure_date, room_id, wifi_access, dietary_restrictions, notes, status, icon) VALUES
      ('Grandma Rose', 'Grandmother', '555-0301', 'rose@email.com', '2024-12-23', '2024-12-27', 8, true, 'Low sodium diet', 'Arriving by train at 2 PM', 'expected', '👵'),
      ('Uncle Bob', 'Uncle', '555-0302', 'bob@email.com', '2024-12-24', '2024-12-26', 8, true, NULL, 'Driving from Chicago', 'expected', '👴'),
      ('Aunt Lisa', 'Aunt', '555-0303', 'lisa@email.com', '2024-12-24', '2024-12-26', NULL, true, 'Vegetarian', 'Coming with Uncle Bob', 'expected', '👩‍🦰'),
      ('Cousin Mike', 'Cousin', '555-0304', 'mike@email.com', '2024-12-24', '2024-12-25', NULL, true, NULL, 'Sleeping on basement couch', 'expected', '🧑‍🦱'),
      ('Neighbor Jake', 'Neighbor', '555-0305', 'jake@email.com', '2024-12-24', '2024-12-24', NULL, false, NULL, 'Coming for holiday party only', 'expected', '🏘️'),
      ('Plumber Dan', 'Service', '555-0401', 'dan@plumbing.com', '2024-12-19', '2024-12-19', NULL, false, NULL, 'Fix bathroom faucet, 9 AM appointment', 'checked_out', '🔧')
    `);

    // Seed Inventory Items
    await client.query(`
      INSERT INTO inventory_items (name, category, quantity, unit, location, expiry_date, min_stock, barcode, status, icon) VALUES
      ('Rice', 'Grains', 3, 'lbs', 'Pantry', '2025-06-15', 1, NULL, 'in_stock', '🍚'),
      ('Canned Tomatoes', 'Canned', 8, 'cans', 'Pantry', '2025-12-01', 4, NULL, 'in_stock', '🍅'),
      ('Olive Oil', 'Cooking', 1, 'bottle', 'Pantry', '2025-03-20', 1, NULL, 'in_stock', '🫒'),
      ('Flour', 'Baking', 2, 'lbs', 'Pantry', '2025-04-10', 1, NULL, 'in_stock', '🌾'),
      ('Sugar', 'Baking', 1, 'lbs', 'Pantry', '2025-08-01', 1, NULL, 'low_stock', '🧂'),
      ('Coffee Beans', 'Beverages', 1, 'bag', 'Kitchen', '2025-02-15', 1, NULL, 'in_stock', '☕'),
      ('Paper Plates', 'Disposable', 15, 'count', 'Pantry', NULL, 20, NULL, 'low_stock', '🍽️'),
      ('Batteries AA', 'Supplies', 4, 'count', 'Garage', NULL, 8, NULL, 'low_stock', '🔋'),
      ('Light Bulbs', 'Supplies', 2, 'count', 'Garage', NULL, 4, NULL, 'low_stock', '💡'),
      ('Trash Bags', 'Household', 20, 'count', 'Laundry Room', NULL, 10, NULL, 'in_stock', '🗑️')
    `);

    // Seed Emergency Contacts
    await client.query(`
      INSERT INTO emergency_contacts (name, relationship, phone, alt_phone, email, address, type, priority, notes, icon) VALUES
      ('911 Emergency', 'Emergency Services', '911', NULL, NULL, NULL, 'police', 1, 'Fire, Police, Medical', '🚨'),
      ('Poison Control', 'Emergency Services', '1-800-222-1222', NULL, NULL, NULL, 'medical', 2, '24/7 poison emergency', '☠️'),
      ('Dr. Smith Family Practice', 'Family Doctor', '555-1001', '555-1002', 'drsmith@medical.com', '123 Medical Dr', 'medical', 3, 'Primary care physician', '👨‍⚕️'),
      ('Happy Paws Vet', 'Veterinarian', '555-0101', NULL, 'info@happypaws.com', '456 Pet Ave', 'medical', 4, 'For Buddy and Whiskers', '🐾'),
      ('Neighbor Jake', 'Neighbor', '555-0305', NULL, 'jake@email.com', '124 Oak Street', 'neighbor', 5, 'Has spare key, can check on house', '🏘️'),
      ('Home Insurance Co', 'Insurance', '800-555-0100', NULL, 'claims@insurance.com', NULL, 'utility', 6, 'Policy #HI-2024-789', '📋'),
      ('City Water Dept', 'Utility', '555-2001', NULL, NULL, NULL, 'utility', 7, 'For water emergencies', '💧'),
      ('Electric Company', 'Utility', '555-2002', '800-555-2003', NULL, NULL, 'utility', 8, 'Power outage reporting', '⚡')
    `);

    // Seed Intercom Messages
    await client.query(`
      INSERT INTO intercom_messages (from_room_id, to_room_id, from_room, to_room, sender, message, type, is_read, priority, icon, created_at) VALUES
      (3, 9, 'Kitchen', 'Dining Room', 'Sarah', 'Dinner is ready!', 'text', true, 'normal', '📢', NOW() - INTERVAL '2 hours'),
      (1, 7, 'Living Room', 'Kids Room', 'James', 'Time to come downstairs for homework!', 'text', true, 'normal', '📢', NOW() - INTERVAL '4 hours'),
      (2, NULL, 'Master Bedroom', 'All Rooms', 'Sarah', 'Good morning everyone! Breakfast in 15 minutes.', 'broadcast', true, 'normal', '📢', NOW() - INTERVAL '8 hours'),
      (13, 1, 'Hallway', 'Living Room', 'System', 'Visitor detected at front door', 'alert', false, 'urgent', '🚨', NOW() - INTERVAL '1 hour'),
      (5, 3, 'Home Office', 'Kitchen', 'James', 'Can you bring me a coffee please?', 'text', true, 'normal', '☕', NOW() - INTERVAL '3 hours'),
      (7, 1, 'Kids Room', 'Living Room', 'Max', 'Can I have a snack?', 'text', true, 'normal', '🍪', NOW() - INTERVAL '5 hours')
    `);

    // Seed Media Sessions
    await client.query(`
      INSERT INTO media_sessions (title, artist, album, media_type, source, room_id, device_id, volume, status, duration_sec, playlist, icon, created_at) VALUES
      ('Bohemian Rhapsody', 'Queen', 'A Night at the Opera', 'music', 'spotify', 1, 4, 45, 'playing', 354, 'Classic Rock Hits', '🎵', NOW()),
      ('Morning Jazz', 'Various Artists', 'Smooth Morning', 'music', 'spotify', 3, NULL, 30, 'playing', 0, 'Morning Vibes', '🎷', NOW()),
      ('Science Podcast', 'Neil deGrasse Tyson', 'StarTalk', 'podcast', 'apple_music', 5, NULL, 50, 'paused', 3600, NULL, '🎙️', NOW() - INTERVAL '1 hour'),
      ('Frozen Soundtrack', 'Various', 'Frozen OST', 'music', 'spotify', 7, NULL, 35, 'stopped', 0, 'Kids Favorites', '🎶', NOW() - INTERVAL '3 hours'),
      ('White Noise', 'Sleep Sounds', 'Baby Sleep', 'music', 'local', 16, NULL, 20, 'playing', 28800, NULL, '🔇', NOW()),
      ('Evening News', 'NPR', 'All Things Considered', 'podcast', 'radio', 1, 4, 40, 'stopped', 3600, NULL, '📻', NOW() - INTERVAL '6 hours')
    `);

    // Seed Laundry Loads
    await client.query(`
      INSERT INTO laundry_loads (label, load_type, machine, status, started_at, estimated_done, temperature, cycle_type, assigned_to, notes, icon) VALUES
      ('Whites Load', 'whites', 'washer', 'washing', NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '30 minutes', 'hot', 'normal', 'Sarah', 'Added bleach', '👕'),
      ('Dark Clothes', 'darks', 'dryer', 'drying', NOW() - INTERVAL '15 minutes', NOW() + INTERVAL '45 minutes', 'warm', 'normal', 'Sarah', NULL, '👖'),
      ('Kids Clothes', 'colors', 'washer', 'done', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 'warm', 'gentle', 'Sarah', 'Check for stains', '🧒'),
      ('Towels', 'towels', 'dryer', 'done', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours', 'hot', 'heavy', 'James', NULL, '🛁'),
      ('Bedding Master', 'bedding', 'washer', 'pending', NULL, NULL, 'warm', 'bulky', 'Sarah', 'Strip bed Saturday morning', '🛏️'),
      ('Delicates', 'delicates', 'washer', 'pending', NULL, NULL, 'cold', 'delicate', 'Sarah', 'Use mesh bags', '👗')
    `);

    // Seed Packages
    await client.query(`
      INSERT INTO packages (description, carrier, tracking_number, order_date, expected_delivery, actual_delivery, status, recipient, retailer, notes, icon) VALUES
      ('Smart Light Bulbs (4pk)', 'Amazon', '1Z999AA10123456784', '2024-12-14', '2024-12-18', NULL, 'in_transit', 'James', 'Amazon', 'For guest room', '💡'),
      ('Kids Winter Coat', 'FedEx', 'FX1234567890', '2024-12-12', '2024-12-17', '2024-12-17', 'delivered', 'Emma', 'Target', 'Blue size 8', '🧥'),
      ('Christmas Gifts', 'UPS', '1Z999AA10987654321', '2024-12-10', '2024-12-20', NULL, 'shipped', 'Sarah', 'Various', 'Hide in garage', '🎁'),
      ('Robot Vacuum Filters', 'USPS', '9400111899223100001', '2024-12-15', '2024-12-22', NULL, 'ordered', 'James', 'iRobot', 'Pack of 3 replacement filters', '🤖'),
      ('Dog Treats', 'Amazon', '1Z999AA10111222333', '2024-12-16', '2024-12-19', NULL, 'out_for_delivery', 'Sarah', 'Amazon', 'Buddys favorite brand', '🐕'),
      ('Holiday Decorations', 'UPS', '1Z999AA10444555666', '2024-12-08', '2024-12-13', '2024-12-13', 'delivered', 'James', 'Wayfair', 'Outdoor lights and wreath', '🎄')
    `);

    // Seed Warranties
    await client.query(`
      INSERT INTO warranties (item_name, type, provider, policy_number, start_date, end_date, coverage_amount, premium, deductible, status, contact_phone, notes, icon) VALUES
      ('Home Insurance', 'home_insurance', 'State Farm', 'HI-2024-789', '2024-01-01', '2025-01-01', 350000.00, 1200.00, 1000.00, 'active', '800-555-0100', 'Annual renewal in January', '🏠'),
      ('Nest Thermostat', 'warranty', 'Google', 'NT-2022-456', '2022-06-15', '2025-06-15', 249.00, 0.00, 0.00, 'active', '800-555-0200', 'Standard 3-year warranty', '🌡️'),
      ('Samsung Fridge', 'extended_warranty', 'Best Buy', 'BB-EW-2023-123', '2023-03-01', '2028-03-01', 2500.00, 299.00, 100.00, 'active', '888-555-0300', '5-year extended warranty', '🧊'),
      ('Ring Security System', 'warranty', 'Ring', 'RNG-2023-789', '2023-01-15', '2025-01-15', 500.00, 0.00, 0.00, 'active', '800-555-0400', 'Includes cameras and doorbell', '📷'),
      ('HVAC System', 'warranty', 'CoolAir HVAC', 'HVAC-2020-001', '2020-05-10', '2030-05-10', 8000.00, 0.00, 250.00, 'active', '555-0500', '10-year parts warranty', '❄️'),
      ('Washer/Dryer', 'appliance_insurance', 'LG', 'LG-WD-2022-555', '2022-08-20', '2025-08-20', 1800.00, 0.00, 0.00, 'active', '800-555-0600', 'Covers both units', '👕')
    `);

    // Seed Budget Entries
    await client.query(`
      INSERT INTO budget_entries (title, category, amount, type, date, payment_method, vendor, is_recurring, frequency, notes, icon) VALUES
      ('Mortgage Payment', 'Housing', 2200.00, 'expense', '2024-12-01', 'Bank Transfer', 'Wells Fargo', true, 'monthly', NULL, '🏠'),
      ('Electric Bill', 'Utilities', 145.00, 'expense', '2024-12-05', 'Auto Pay', 'Electric Co', true, 'monthly', 'Down from $165 last month', '⚡'),
      ('Water Bill', 'Utilities', 65.00, 'expense', '2024-12-05', 'Auto Pay', 'City Water', true, 'monthly', NULL, '💧'),
      ('Internet', 'Utilities', 79.99, 'expense', '2024-12-01', 'Credit Card', 'Comcast', true, 'monthly', '500 Mbps plan', '🌐'),
      ('Groceries', 'Food', 450.00, 'expense', '2024-12-15', 'Credit Card', 'Various', true, 'monthly', 'Budget for family of 5', '🛒'),
      ('Smart Home Devices', 'Home', 89.99, 'expense', '2024-12-12', 'Credit Card', 'Amazon', false, 'one_time', 'New smart plugs', '📱'),
      ('Salary - James', 'Income', 7500.00, 'income', '2024-12-01', 'Direct Deposit', 'Employer', true, 'monthly', 'After taxes', '💰'),
      ('Salary - Sarah', 'Income', 6200.00, 'income', '2024-12-01', 'Direct Deposit', 'Employer', true, 'monthly', 'Part-time', '💰'),
      ('Home Maintenance', 'Home', 150.00, 'budget', '2024-12-01', NULL, NULL, true, 'monthly', 'Monthly maintenance budget', '🔧'),
      ('Energy Savings', 'Savings', 45.30, 'income', '2024-12-15', 'Adjustment', 'Smart Home', false, 'one_time', 'Savings from automation', '💚')
    `);

    // ============================================
    // Seed data for Robot AI features
    // ============================================

    // Seed Voice Commands
    await client.query(`
      INSERT INTO voice_commands (command_text, intent, confidence, speaker, room_id, action_taken, status, response_text, processing_time_ms, icon, created_at) VALUES
      ('Hey home, turn on the lights', 'device_control', 0.95, 'James', 1, 'Turned on living room lights', 'processed', 'Living room lights are now on.', 120, '🎤', NOW() - INTERVAL '1 hour'),
      ('Set temperature to 72', 'climate_control', 0.92, 'Sarah', 2, 'Set thermostat to 72F', 'processed', 'Thermostat set to 72 degrees.', 95, '🎤', NOW() - INTERVAL '2 hours'),
      ('Lock all doors', 'security', 0.98, 'James', 1, 'Locked front door and garage', 'processed', 'All doors are now locked.', 150, '🎤', NOW() - INTERVAL '3 hours'),
      ('Play some jazz music', 'entertainment', 0.88, 'Sarah', 3, 'Started Jazz playlist on kitchen speaker', 'processed', 'Playing Smooth Jazz playlist.', 200, '🎤', NOW() - INTERVAL '4 hours'),
      ('What is the weather today', 'information', 0.91, 'Max', 7, 'Retrieved weather data', 'processed', 'Today is 45F, partly cloudy with winds at 12 mph.', 180, '🎤', NOW() - INTERVAL '5 hours'),
      ('Good night', 'scene_activation', 0.96, 'James', 2, 'Activated Goodnight scene', 'processed', 'Goodnight scene activated. Sweet dreams!', 110, '🎤', NOW() - INTERVAL '10 hours'),
      ('Remind me to water plants tomorrow', 'reminder', 0.85, 'Sarah', 3, 'Created reminder for tomorrow 9 AM', 'processed', 'Reminder set for tomorrow at 9 AM.', 160, '🎤', NOW() - INTERVAL '6 hours'),
      ('Who is at the door', 'security', 0.90, 'James', 1, 'Checked doorbell camera', 'processed', 'It appears to be a delivery person.', 350, '🎤', NOW() - INTERVAL '8 hours')
    `);

    // Seed Face Records
    await client.query(`
      INSERT INTO face_records (person_name, profile_id, confidence, location, camera_id, is_recognized, emotion, access_granted, image_ref, icon, created_at) VALUES
      ('James Wilson', 1, 0.98, 'Front Door', 18, true, 'neutral', true, 'face_001.jpg', '👤', NOW() - INTERVAL '1 hour'),
      ('Sarah Wilson', 2, 0.97, 'Kitchen', 3, true, 'happy', true, 'face_002.jpg', '👤', NOW() - INTERVAL '2 hours'),
      ('Max Wilson', 3, 0.95, 'Front Door', 18, true, 'neutral', true, 'face_003.jpg', '👤', NOW() - INTERVAL '4 hours'),
      ('Emma Wilson', 4, 0.96, 'Living Room', 3, true, 'happy', true, 'face_004.jpg', '👤', NOW() - INTERVAL '5 hours'),
      ('Unknown Person', NULL, 0.30, 'Front Door', 18, false, 'neutral', false, 'face_005.jpg', '⚠️', NOW() - INTERVAL '3 hours'),
      ('Delivery Person', NULL, 0.45, 'Front Door', 18, false, 'neutral', false, 'face_006.jpg', '📦', NOW() - INTERVAL '8 hours'),
      ('Grandma Rose', 5, 0.92, 'Front Door', 18, true, 'happy', true, 'face_007.jpg', '👤', NOW() - INTERVAL '72 hours'),
      ('Neighbor Jake', 11, 0.89, 'Patio', 3, true, 'neutral', true, 'face_008.jpg', '👤', NOW() - INTERVAL '48 hours')
    `);

    // Seed Patrol Rounds
    await client.query(`
      INSERT INTO patrol_rounds (name, route, schedule, status, started_at, completed_at, rooms_checked, anomalies_found, report, icon, created_at) VALUES
      ('Evening Perimeter', '["Front Yard","Backyard","Garage","Patio"]', 'Daily 10 PM', 'completed', NOW() - INTERVAL '14 hours', NOW() - INTERVAL '13.5 hours', 4, 0, 'All clear. No anomalies detected during evening patrol.', '🛡️', NOW() - INTERVAL '14 hours'),
      ('Morning Interior', '["Living Room","Kitchen","Hallway","Basement"]', 'Daily 6 AM', 'completed', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5.75 hours', 4, 1, 'Basement window slightly ajar. Notification sent.', '🛡️', NOW() - INTERVAL '6 hours'),
      ('Midnight Security', '["All Doors","Windows","Garage"]', 'Daily 12 AM', 'completed', NOW() - INTERVAL '18 hours', NOW() - INTERVAL '17.75 hours', 8, 0, 'All entry points secured. Systems nominal.', '🛡️', NOW() - INTERVAL '18 hours'),
      ('Afternoon Check', '["Kids Room","Nursery","Patio"]', 'Daily 3 PM', 'scheduled', NULL, NULL, 0, 0, NULL, '🛡️', NOW()),
      ('Weekend Full Scan', '["All Rooms","Exterior","Garage","Basement"]', 'Saturday 8 AM', 'in_progress', NOW() - INTERVAL '30 minutes', NULL, 6, 0, 'In progress - 6 of 16 rooms checked', '🛡️', NOW() - INTERVAL '30 minutes'),
      ('Emergency Patrol', '["All Entry Points"]', 'On demand', 'completed', NOW() - INTERVAL '48 hours', NOW() - INTERVAL '47.75 hours', 5, 1, 'Triggered by security alert. Unknown person at front door.', '🚨', NOW() - INTERVAL '48 hours')
    `);

    // Seed Detected Objects
    await client.query(`
      INSERT INTO detected_objects (object_name, category, confidence, location, room_id, camera_id, bounding_box, is_anomaly, action_taken, icon, created_at) VALUES
      ('Package', 'Delivery', 0.94, 'Front Porch', NULL, 18, '{"x": 120, "y": 340, "w": 200, "h": 150}', false, 'Notification sent to James', '📦', NOW() - INTERVAL '4 hours'),
      ('Cat', 'Animal', 0.89, 'Backyard', NULL, 3, '{"x": 450, "y": 200, "w": 100, "h": 80}', false, 'Logged - neighborhood cat', '🐱', NOW() - INTERVAL '6 hours'),
      ('Car', 'Vehicle', 0.96, 'Driveway', NULL, 18, '{"x": 50, "y": 100, "w": 400, "h": 250}', false, 'Family vehicle recognized', '🚗', NOW() - INTERVAL '2 hours'),
      ('Person', 'Human', 0.92, 'Front Door', NULL, 18, '{"x": 200, "y": 50, "w": 150, "h": 400}', true, 'Unknown person - alert triggered', '⚠️', NOW() - INTERVAL '3 hours'),
      ('Dog', 'Animal', 0.97, 'Living Room', 1, 3, '{"x": 300, "y": 250, "w": 200, "h": 150}', false, 'Buddy recognized', '🐕', NOW() - INTERVAL '1 hour'),
      ('Bicycle', 'Vehicle', 0.85, 'Garage', 6, NULL, '{"x": 100, "y": 150, "w": 300, "h": 200}', false, 'Normal garage item', '🚲', NOW() - INTERVAL '12 hours'),
      ('Water puddle', 'Hazard', 0.78, 'Bathroom', 4, NULL, '{"x": 200, "y": 300, "w": 100, "h": 50}', true, 'Water leak alert sent', '💧', NOW() - INTERVAL '24 hours'),
      ('Smoke', 'Hazard', 0.72, 'Kitchen', 3, 3, '{"x": 0, "y": 0, "w": 640, "h": 200}', true, 'False alarm - cooking steam', '💨', NOW() - INTERVAL '48 hours')
    `);

    // Seed Gesture Events
    await client.query(`
      INSERT INTO gesture_events (gesture_name, person, confidence, action_triggered, room_id, camera_id, status, icon, created_at) VALUES
      ('Wave', 'James', 0.92, 'Turned on living room lights', 1, 3, 'recognized', '👋', NOW() - INTERVAL '2 hours'),
      ('Thumbs Up', 'Sarah', 0.88, 'Confirmed thermostat setting', 3, 3, 'recognized', '👍', NOW() - INTERVAL '4 hours'),
      ('Stop Hand', 'Max', 0.85, 'Paused music playback', 7, NULL, 'recognized', '✋', NOW() - INTERVAL '5 hours'),
      ('Point Right', 'James', 0.80, 'Robot navigated to pointed direction', 1, 3, 'recognized', '👉', NOW() - INTERVAL '6 hours'),
      ('Clap', 'Emma', 0.75, 'Toggled party lights', 1, 3, 'recognized', '👏', NOW() - INTERVAL '8 hours'),
      ('Peace Sign', 'Max', 0.70, 'No action mapped', 7, NULL, 'recognized', '✌️', NOW() - INTERVAL '10 hours')
    `);

    // Seed Emotion Readings
    await client.query(`
      INSERT INTO emotion_readings (person, emotion, confidence, secondary_emotion, room_id, context, action_suggested, icon, created_at) VALUES
      ('James', 'happy', 0.88, 'excited', 1, 'Watching TV', 'None needed', '😊', NOW() - INTERVAL '1 hour'),
      ('Sarah', 'calm', 0.92, 'content', 3, 'Cooking dinner', 'Play relaxing music', '😌', NOW() - INTERVAL '2 hours'),
      ('Max', 'frustrated', 0.78, 'tired', 7, 'Doing homework', 'Suggest a break, offer snack', '😤', NOW() - INTERVAL '4 hours'),
      ('Emma', 'happy', 0.95, 'excited', 1, 'Playing with Buddy', 'None needed', '😄', NOW() - INTERVAL '3 hours'),
      ('Baby Lily', 'distressed', 0.82, 'hungry', 16, 'In crib', 'Alert Sarah - possible feeding time', '😢', NOW() - INTERVAL '5 hours'),
      ('James', 'stressed', 0.75, 'focused', 5, 'Working in office', 'Dim lights, play ambient sounds', '😰', NOW() - INTERVAL '8 hours'),
      ('Sarah', 'tired', 0.80, 'calm', 2, 'Reading in bed', 'Activate sleep scene in 15 min', '😴', NOW() - INTERVAL '12 hours'),
      ('Max', 'happy', 0.90, 'energetic', 11, 'Playing video games', 'None needed', '😁', NOW() - INTERVAL '6 hours')
    `);

    // Seed Navigation Logs
    await client.query(`
      INSERT INTO navigation_logs (destination, from_location, room_id, status, distance_meters, duration_sec, obstacles_avoided, map_version, path_data, icon, created_at) VALUES
      ('Kitchen', 'Living Room', 3, 'completed', 8.5, 15, 2, 'v2.1', '{"waypoints": ["hallway_1", "kitchen_entry"]}', '🗺️', NOW() - INTERVAL '2 hours'),
      ('Front Door', 'Kitchen', 13, 'completed', 12.0, 22, 1, 'v2.1', '{"waypoints": ["kitchen_exit", "hallway_1", "front_door"]}', '🗺️', NOW() - INTERVAL '4 hours'),
      ('Nursery', 'Living Room', 16, 'completed', 15.5, 35, 3, 'v2.1', '{"waypoints": ["stairs", "upstairs_hall", "nursery_door"]}', '🗺️', NOW() - INTERVAL '6 hours'),
      ('Charging Station', 'Patio', 1, 'completed', 20.0, 45, 0, 'v2.1', '{"waypoints": ["patio_door", "living_room", "charging_dock"]}', '🗺️', NOW() - INTERVAL '8 hours'),
      ('Garage', 'Hallway', 6, 'navigating', 10.0, NULL, 1, 'v2.1', '{"waypoints": ["hallway_2", "garage_door"]}', '🗺️', NOW() - INTERVAL '5 minutes'),
      ('Master Bedroom', 'Living Room', 2, 'failed', 14.0, NULL, 0, 'v2.1', '{"error": "stairs_blocked"}', '🗺️', NOW() - INTERVAL '12 hours')
    `);

    // Seed Robot Status
    await client.query(`
      INSERT INTO robot_status (robot_name, battery_level, status, current_location, cpu_usage, memory_usage, temperature_celsius, uptime_hours, last_charged, firmware_version, health_score, icon, created_at) VALUES
      ('HomeBot Alpha', 85, 'active', 'Living Room', 45.2, 62.1, 38.5, 168.5, NOW() - INTERVAL '4 hours', 'v3.2.1', 92, '🤖', NOW()),
      ('CleanBot', 78, 'cleaning', 'Kitchen', 72.0, 45.5, 41.2, 72.0, NOW() - INTERVAL '2 hours', 'v3.8.1', 88, '🧹', NOW()),
      ('GuardBot', 95, 'patrolling', 'Hallway', 35.8, 38.0, 36.8, 240.0, NOW() - INTERVAL '6 hours', 'v2.5.0', 95, '🛡️', NOW()),
      ('HomeBot Alpha', 20, 'charging', 'Charging Station', 5.0, 30.0, 35.0, 0.5, NOW(), 'v3.2.1', 92, '🔋', NOW() - INTERVAL '8 hours')
    `);

    // Seed Robot Tasks
    await client.query(`
      INSERT INTO robot_tasks (task_name, description, task_type, priority, status, assigned_robot, scheduled_at, started_at, completed_at, result, icon, created_at) VALUES
      ('Living Room Vacuum', 'Vacuum the living room carpet', 'cleaning', 'medium', 'completed', 'CleanBot', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2.5 hours', 'Completed successfully. 95% coverage.', '🧹', NOW() - INTERVAL '4 hours'),
      ('Evening Patrol', 'Patrol all entry points', 'security', 'high', 'in_progress', 'GuardBot', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes', NULL, NULL, '🛡️', NOW() - INTERVAL '1 hour'),
      ('Deliver Water', 'Bring water bottle to home office', 'delivery', 'low', 'queued', 'HomeBot Alpha', NOW() + INTERVAL '30 minutes', NULL, NULL, NULL, '🚰', NOW()),
      ('Check Baby', 'Navigate to nursery and check on baby', 'monitoring', 'high', 'queued', 'HomeBot Alpha', NOW() + INTERVAL '15 minutes', NULL, NULL, NULL, '👶', NOW()),
      ('Kitchen Mop', 'Mop the kitchen floor', 'cleaning', 'medium', 'queued', 'CleanBot', NOW() + INTERVAL '2 hours', NULL, NULL, NULL, '🧹', NOW()),
      ('Welcome Guest', 'Greet visitor at front door', 'social', 'medium', 'completed', 'HomeBot Alpha', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5.9 hours', 'Guest greeted. Escorted to living room.', '👋', NOW() - INTERVAL '7 hours'),
      ('Night Security Scan', 'Full security scan of all rooms', 'security', 'high', 'scheduled', 'GuardBot', NOW() + INTERVAL '8 hours', NULL, NULL, NULL, '🔒', NOW()),
      ('Morning Report', 'Deliver morning briefing to master bedroom', 'information', 'medium', 'scheduled', 'HomeBot Alpha', NOW() + INTERVAL '14 hours', NULL, NULL, NULL, '📋', NOW())
    `);

    // Seed Meal Plans
    await client.query(`
      INSERT INTO meal_plans (meal_name, meal_type, date, recipe_id, servings, calories, prep_time_min, dietary_tags, ai_suggested, status, notes, icon) VALUES
      ('Pancakes & Fruit', 'breakfast', '2024-12-18', 3, 6, 350, 25, 'vegetarian', false, 'prepared', 'With maple syrup', '🥞'),
      ('Caesar Salad', 'lunch', '2024-12-18', 4, 4, 280, 15, 'vegetarian', true, 'planned', 'Add grilled chicken for protein', '🥗'),
      ('Spaghetti Bolognese', 'dinner', '2024-12-18', 1, 6, 580, 60, NULL, false, 'planned', 'Family favorite', '🍝'),
      ('Chicken Stir Fry', 'dinner', '2024-12-19', 2, 4, 420, 35, 'gluten-free', true, 'planned', 'Use leftover veggies', '🥘'),
      ('Grilled Salmon', 'dinner', '2024-12-20', 7, 4, 380, 22, 'keto,gluten-free', true, 'planned', 'AI suggested based on health goals', '🐟'),
      ('Beef Tacos', 'dinner', '2024-12-21', 5, 6, 450, 30, NULL, false, 'planned', 'Taco night!', '🌮'),
      ('Banana Bread', 'snack', '2024-12-20', 6, 10, 290, 75, 'vegetarian', true, 'planned', 'Use overripe bananas from pantry', '🍌'),
      ('Tomato Soup & Grilled Cheese', 'lunch', '2024-12-19', 8, 4, 420, 55, 'vegetarian', false, 'planned', 'Comfort food for cold day', '🍅')
    `);

    // Seed Sleep Records
    await client.query(`
      INSERT INTO sleep_records (person, date, bedtime, wake_time, duration_hours, quality_score, deep_sleep_pct, rem_sleep_pct, disturbances, room_temperature, ai_recommendation, icon) VALUES
      ('James', '2024-12-17', '23:15', '06:30', 7.3, 78, 22.5, 18.0, 2, 70.0, 'Try going to bed 30 minutes earlier for optimal rest.', '😴'),
      ('Sarah', '2024-12-17', '22:45', '06:15', 7.5, 85, 25.0, 20.0, 1, 70.0, 'Great sleep quality! Keep consistent schedule.', '😴'),
      ('Max', '2024-12-17', '21:30', '07:00', 9.5, 92, 28.0, 22.0, 0, 71.0, 'Excellent sleep. Duration optimal for age.', '😴'),
      ('Emma', '2024-12-17', '20:00', '06:30', 10.5, 95, 30.0, 24.0, 0, 72.0, 'Perfect sleep pattern for a child.', '😴'),
      ('James', '2024-12-16', '00:30', '06:30', 6.0, 55, 15.0, 12.0, 4, 72.0, 'Late bedtime affected quality. Room was warm - try 68-70F.', '😴'),
      ('Sarah', '2024-12-16', '23:00', '06:00', 7.0, 80, 23.0, 19.0, 1, 70.0, 'Good sleep. Baby woke once at 3 AM.', '😴'),
      ('James', '2024-12-15', '23:00', '06:45', 7.8, 82, 24.0, 19.5, 1, 69.0, 'Good recovery from previous night. Keep this schedule.', '😴'),
      ('Sarah', '2024-12-15', '22:30', '06:30', 8.0, 88, 26.0, 21.0, 0, 69.0, 'Excellent sleep. White noise machine helping.', '😴')
    `);

    // Seed Companion Interactions
    await client.query(`
      INSERT INTO companion_interactions (interaction_type, person, content, category, duration_min, mood_before, mood_after, rating, room_id, icon, created_at) VALUES
      ('Storytelling', 'Emma', 'The Adventures of Princess Luna - Chapter 5', 'entertainment', 15, 'excited', 'happy', 5, 7, '📖', NOW() - INTERVAL '4 hours'),
      ('Game', 'Max', 'Trivia Quiz - Science Edition (Score: 8/10)', 'education', 20, 'bored', 'engaged', 4, 11, '🎮', NOW() - INTERVAL '6 hours'),
      ('Meditation', 'Sarah', 'Guided breathing exercise - 10 minutes', 'wellness', 10, 'stressed', 'calm', 5, 2, '🧘', NOW() - INTERVAL '8 hours'),
      ('Joke Telling', 'James', 'Told 5 dad jokes during dinner', 'entertainment', 5, 'neutral', 'happy', 3, 9, '😂', NOW() - INTERVAL '3 hours'),
      ('Homework Help', 'Max', 'Math homework - fractions and decimals', 'education', 30, 'frustrated', 'confident', 4, 7, '📚', NOW() - INTERVAL '5 hours'),
      ('Lullaby', 'Baby Lily', 'Played Twinkle Twinkle Little Star', 'comfort', 8, 'fussy', 'sleeping', 5, 16, '🎵', NOW() - INTERVAL '10 hours'),
      ('Exercise', 'James', 'Morning stretching routine guidance', 'wellness', 15, 'groggy', 'energized', 4, 1, '🏃', NOW() - INTERVAL '12 hours'),
      ('Reminder', 'Sarah', 'Reminded about Emmas piano lesson at 3 PM', 'utility', 1, 'busy', 'grateful', 5, 3, '⏰', NOW() - INTERVAL '7 hours')
    `);

    // Seed Anomalies
    await client.query(`
      INSERT INTO anomalies (title, type, severity, source, description, room_id, device_id, confidence, is_resolved, action_taken, icon, created_at) VALUES
      ('Unusual Energy Spike', 'energy', 'medium', 'Energy Monitor', 'AC unit consuming 40% more than normal for current temperature.', 2, 7, 0.87, false, 'Scheduled maintenance check', '⚡', NOW() - INTERVAL '2 hours'),
      ('Unexpected Motion', 'security', 'high', 'Motion Sensor', 'Motion detected in basement at 3:15 AM with no one home.', 11, 14, 0.92, true, 'Reviewed camera - cat entered through pet door', '👁️', NOW() - INTERVAL '48 hours'),
      ('Network Traffic Anomaly', 'network', 'critical', 'Network Monitor', 'Smart fridge sending unusual amount of data to unknown IP.', 3, 9, 0.95, false, 'Blocked suspicious IP, firmware update recommended', '🌐', NOW() - INTERVAL '1 hour'),
      ('Temperature Drift', 'climate', 'low', 'Thermostat', 'Living room temperature drifting 3 degrees above setpoint.', 1, 2, 0.78, true, 'Thermostat recalibrated', '🌡️', NOW() - INTERVAL '24 hours'),
      ('Door Lock Battery Drain', 'device', 'medium', 'Battery Monitor', 'Front door lock battery draining 3x faster than normal.', 13, 5, 0.85, false, 'Battery replacement scheduled', '🔋', NOW() - INTERVAL '6 hours'),
      ('Unusual Login Pattern', 'security', 'high', 'Auth System', 'Multiple login attempts from unfamiliar IP at 2 AM.', NULL, NULL, 0.91, false, 'IP blocked, password change recommended', '🔒', NOW() - INTERVAL '4 hours'),
      ('Water Usage Spike', 'utility', 'medium', 'Water Sensor', 'Bathroom water usage 200% above daily average.', 4, 16, 0.82, true, 'Running toilet identified and fixed', '💧', NOW() - INTERVAL '72 hours'),
      ('Sound Anomaly', 'environment', 'low', 'Noise Sensor', 'Unusual buzzing detected in garage late at night.', 6, NULL, 0.68, true, 'Identified as garage door motor vibration', '🔊', NOW() - INTERVAL '36 hours')
    `);

    // Seed Predictive Maintenance
    await client.query(`
      INSERT INTO predictive_maintenance (device_name, device_id, predicted_issue, failure_probability, predicted_date, severity, recommendation, estimated_cost, status, ai_model, icon, created_at) VALUES
      ('AC Unit', 7, 'Compressor wear', 0.78, '2025-03-15', 'high', 'Schedule professional inspection. Compressor showing signs of reduced efficiency.', 450.00, 'predicted', 'maintenance-ai-v2', '❄️', NOW() - INTERVAL '1 day'),
      ('Smart Fridge', 9, 'Thermostat sensor drift', 0.65, '2025-02-20', 'medium', 'Monitor internal temperature. Sensor may need recalibration.', 120.00, 'monitoring', 'maintenance-ai-v2', '🧊', NOW() - INTERVAL '2 days'),
      ('Door Lock', 5, 'Motor mechanism wear', 0.52, '2025-04-10', 'medium', 'Lock mechanism showing increased friction. Lubricate or replace motor.', 85.00, 'predicted', 'maintenance-ai-v2', '🔒', NOW() - INTERVAL '3 days'),
      ('Robot Vacuum', 11, 'Battery degradation', 0.88, '2025-01-30', 'high', 'Battery capacity at 72% of original. Replace within 6 weeks.', 65.00, 'action_needed', 'maintenance-ai-v2', '🤖', NOW() - INTERVAL '1 day'),
      ('Garage Door', 12, 'Spring tension loss', 0.45, '2025-06-01', 'low', 'Garage door spring showing normal wear. Monitor for increased noise.', 200.00, 'predicted', 'maintenance-ai-v2', '🚗', NOW() - INTERVAL '5 days'),
      ('Smart Blinds', 17, 'Motor bearing failure', 0.71, '2025-02-15', 'medium', 'Motor making intermittent noise. Schedule bearing replacement.', 95.00, 'scheduled', 'maintenance-ai-v2', '🪟', NOW() - INTERVAL '4 days'),
      ('Thermostat', 2, 'Display burnout', 0.35, '2025-08-01', 'low', 'Display brightness declining slightly. No immediate action needed.', 0.00, 'predicted', 'maintenance-ai-v2', '🌡️', NOW() - INTERVAL '7 days'),
      ('Doorbell', 18, 'Battery swelling', 0.60, '2025-03-01', 'high', 'Battery showing signs of swelling. Replace preventatively.', 25.00, 'action_needed', 'maintenance-ai-v2', '🔔', NOW() - INTERVAL '2 days')
    `);

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully with all data!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed error:', err.message);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
}

seed();
