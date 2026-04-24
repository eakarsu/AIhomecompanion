import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import AIAssistant from './pages/AIAssistant';
import Sidebar from './components/Sidebar';

const API = 'http://localhost:3001/api';

export const AppContext = React.createContext();

function AppLayout() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <AppContext.Provider value={{ token, API }}>
      <div className="app-layout">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard setCurrentPage={setCurrentPage} />} />

            {/* Smart Home */}
            <Route path="/devices" element={<FeaturePage feature="devices" title="Smart Devices" icon="📱" columns={['icon','name','type','brand','model','room_name','status']} fields={[
              {name:'name',label:'Name',required:true},{name:'type',label:'Type',required:true},{name:'brand',label:'Brand'},{name:'model',label:'Model'},
              {name:'room_id',label:'Room ID',type:'number'},{name:'status',label:'Status',type:'select',options:['online','offline','standby']},
              {name:'ip_address',label:'IP Address'},{name:'firmware',label:'Firmware'},{name:'battery_level',label:'Battery %',type:'number'},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/rooms" element={<FeaturePage feature="rooms" title="Rooms" icon="🏠" columns={['icon','name','floor','type','size_sqft','temperature','humidity','occupancy']} fields={[
              {name:'name',label:'Name',required:true},{name:'floor',label:'Floor'},{name:'type',label:'Type'},{name:'size_sqft',label:'Size (sqft)',type:'number'},
              {name:'temperature',label:'Temperature',type:'number'},{name:'humidity',label:'Humidity',type:'number'},{name:'icon',label:'Icon'},{name:'color',label:'Color'}
            ]} />} />
            <Route path="/automations" element={<FeaturePage feature="automations" title="Automations" icon="⚡" columns={['icon','name','trigger_type','trigger_value','action_type','is_active']} fields={[
              {name:'name',label:'Name',required:true},{name:'description',label:'Description',type:'textarea',fullWidth:true},
              {name:'trigger_type',label:'Trigger Type',type:'select',options:['time','sensor','presence','device','voice','weather','timer']},
              {name:'trigger_value',label:'Trigger Value'},{name:'action_type',label:'Action Type',type:'select',options:['device','scene','security','notification','multi','emergency','report']},
              {name:'action_value',label:'Action Value'},{name:'room_id',label:'Room ID',type:'number'},{name:'is_active',label:'Active',type:'select',options:['true','false']},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/scenes" element={<FeaturePage feature="scenes" title="Scenes" icon="🎬" columns={['icon','name','room_name','mood','is_active']} fields={[
              {name:'name',label:'Name',required:true},{name:'description',label:'Description',type:'textarea',fullWidth:true},
              {name:'room_id',label:'Room ID',type:'number'},{name:'mood',label:'Mood'},{name:'icon',label:'Icon'},{name:'color',label:'Color'}
            ]} />} />
            <Route path="/energy" element={<FeaturePage feature="energy" title="Energy Monitor" icon="⚡" columns={['device_name','consumption_kwh','cost_usd','date','peak_watts','category','efficiency_rating']} fields={[
              {name:'device_name',label:'Device Name',required:true},{name:'device_id',label:'Device ID',type:'number'},
              {name:'consumption_kwh',label:'Consumption (kWh)',type:'number'},{name:'cost_usd',label:'Cost ($)',type:'number'},
              {name:'date',label:'Date',type:'date'},{name:'peak_watts',label:'Peak Watts',type:'number'},
              {name:'category',label:'Category'},{name:'efficiency_rating',label:'Rating'}
            ]} />} />
            <Route path="/security" element={<FeaturePage feature="security" title="Security Alerts" icon="🔒" columns={['icon','type','severity','message','location','is_resolved']} fields={[
              {name:'type',label:'Alert Type',required:true},{name:'severity',label:'Severity',type:'select',options:['low','medium','high','critical']},
              {name:'message',label:'Message',type:'textarea',fullWidth:true},{name:'location',label:'Location'},
              {name:'device_id',label:'Device ID',type:'number'},{name:'is_resolved',label:'Resolved',type:'select',options:['true','false']},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/sensors" element={<FeaturePage feature="sensors" title="Sensors" icon="📡" columns={['icon','name','type','room_name','value','unit','status','battery_level']} fields={[
              {name:'name',label:'Name',required:true},{name:'type',label:'Type'},{name:'room_id',label:'Room ID',type:'number'},
              {name:'value',label:'Value',type:'number'},{name:'unit',label:'Unit'},{name:'min_threshold',label:'Min Threshold',type:'number'},
              {name:'max_threshold',label:'Max Threshold',type:'number'},{name:'status',label:'Status',type:'select',options:['normal','warning','critical','good','moderate']},
              {name:'battery_level',label:'Battery %',type:'number'},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/schedules" element={<FeaturePage feature="schedules" title="Schedules" icon="⏰" columns={['icon','name','cron_expression','action_type','is_active']} fields={[
              {name:'name',label:'Name',required:true},{name:'description',label:'Description',type:'textarea',fullWidth:true},
              {name:'cron_expression',label:'Cron Expression'},{name:'action_type',label:'Action Type'},
              {name:'action_value',label:'Action Value'},{name:'device_id',label:'Device ID',type:'number'},
              {name:'room_id',label:'Room ID',type:'number'},{name:'is_active',label:'Active',type:'select',options:['true','false']},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/notifications" element={<FeaturePage feature="notifications" title="Notifications" icon="🔔" columns={['icon','title','type','priority','source','is_read']} fields={[
              {name:'title',label:'Title',required:true},{name:'message',label:'Message',type:'textarea',fullWidth:true},
              {name:'type',label:'Type',type:'select',options:['info','warning','error','success']},
              {name:'priority',label:'Priority',type:'select',options:['low','medium','high','critical']},
              {name:'source',label:'Source'},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/maintenance" element={<FeaturePage feature="maintenance" title="Maintenance" icon="🔧" columns={['icon','device_name','type','status','scheduled_date','priority','cost']} fields={[
              {name:'device_name',label:'Device Name',required:true},{name:'device_id',label:'Device ID',type:'number'},
              {name:'type',label:'Type'},{name:'description',label:'Description',type:'textarea',fullWidth:true},
              {name:'status',label:'Status',type:'select',options:['pending','scheduled','in_progress','completed']},
              {name:'scheduled_date',label:'Scheduled Date',type:'date'},{name:'completed_date',label:'Completed Date',type:'date'},
              {name:'cost',label:'Cost ($)',type:'number'},{name:'technician',label:'Technician'},
              {name:'priority',label:'Priority',type:'select',options:['low','medium','high']},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/analytics" element={<FeaturePage feature="analytics" title="Analytics" icon="📊" columns={['icon','metric_name','category','value','unit','period','trend','change_percent']} fields={[
              {name:'metric_name',label:'Metric Name',required:true},{name:'category',label:'Category'},
              {name:'value',label:'Value',type:'number'},{name:'unit',label:'Unit'},{name:'period',label:'Period'},
              {name:'trend',label:'Trend',type:'select',options:['up','down','stable']},
              {name:'change_percent',label:'Change %',type:'number'},{name:'icon',label:'Icon'}
            ]} />} />

            {/* Home Life */}
            <Route path="/profiles" element={<FeaturePage feature="profiles" title="Family Profiles" icon="👨‍👩‍👧‍👦" columns={['avatar','name','role','relation','age','is_home']} fields={[
              {name:'name',label:'Name',required:true},{name:'role',label:'Role'},{name:'avatar',label:'Avatar'},{name:'voice_id',label:'Voice ID'},
              {name:'age',label:'Age',type:'number'},{name:'relation',label:'Relation'},{name:'is_home',label:'Home',type:'select',options:['true','false']}
            ]} />} />
            <Route path="/calendar" element={<FeaturePage feature="calendar" title="Family Calendar" icon="📅" columns={['icon','title','event_date','start_time','end_time','location','category','assigned_to']} fields={[
              {name:'title',label:'Title',required:true},{name:'description',label:'Description',type:'textarea',fullWidth:true},
              {name:'event_date',label:'Date',type:'date'},{name:'start_time',label:'Start Time'},{name:'end_time',label:'End Time'},
              {name:'location',label:'Location'},{name:'category',label:'Category'},
              {name:'recurrence',label:'Recurrence',type:'select',options:['none','daily','weekly','biweekly','monthly','yearly']},
              {name:'assigned_to',label:'Assigned To'},{name:'is_all_day',label:'All Day',type:'select',options:['true','false']},
              {name:'reminder_minutes',label:'Reminder (min)',type:'number'},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/shopping" element={<FeaturePage feature="shopping" title="Shopping List" icon="🛒" columns={['icon','name','category','quantity','unit','store','estimated_price','is_purchased','priority']} fields={[
              {name:'name',label:'Name',required:true},{name:'category',label:'Category'},
              {name:'quantity',label:'Quantity',type:'number'},{name:'unit',label:'Unit'},{name:'store',label:'Store'},
              {name:'estimated_price',label:'Est. Price ($)',type:'number'},
              {name:'priority',label:'Priority',type:'select',options:['low','medium','high']},
              {name:'is_purchased',label:'Purchased',type:'select',options:['true','false']},
              {name:'added_by',label:'Added By'},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/recipes" element={<FeaturePage feature="recipes" title="Recipes" icon="🍳" columns={['icon','name','cuisine','category','prep_time_min','cook_time_min','servings','difficulty','rating']} fields={[
              {name:'name',label:'Name',required:true},{name:'description',label:'Description',type:'textarea',fullWidth:true},
              {name:'cuisine',label:'Cuisine'},{name:'category',label:'Category'},
              {name:'prep_time_min',label:'Prep Time (min)',type:'number'},{name:'cook_time_min',label:'Cook Time (min)',type:'number'},
              {name:'servings',label:'Servings',type:'number'},{name:'difficulty',label:'Difficulty',type:'select',options:['easy','medium','hard']},
              {name:'instructions',label:'Instructions',type:'textarea',fullWidth:true},
              {name:'calories',label:'Calories',type:'number'},{name:'rating',label:'Rating',type:'number'},
              {name:'is_favorite',label:'Favorite',type:'select',options:['true','false']},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/mealplan" element={<FeaturePage feature="mealplan" title="Meal Planning" icon="🍽️" columns={['icon','meal_name','meal_type','date','servings','calories','dietary_tags','ai_suggested','status']} fields={[
              {name:'meal_name',label:'Meal Name',required:true},{name:'meal_type',label:'Meal Type',type:'select',options:['breakfast','lunch','dinner','snack']},
              {name:'date',label:'Date',type:'date'},{name:'recipe_id',label:'Recipe ID',type:'number'},
              {name:'servings',label:'Servings',type:'number'},{name:'calories',label:'Calories',type:'number'},
              {name:'prep_time_min',label:'Prep Time (min)',type:'number'},{name:'dietary_tags',label:'Dietary Tags'},
              {name:'ai_suggested',label:'AI Suggested',type:'select',options:['true','false']},
              {name:'status',label:'Status',type:'select',options:['planned','prepared','skipped']},
              {name:'notes',label:'Notes',type:'textarea',fullWidth:true},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/chores" element={<FeaturePage feature="chores" title="Chores" icon="✅" columns={['icon','title','assigned_to','room_name','frequency','priority','status','due_date']} fields={[
              {name:'title',label:'Title',required:true},{name:'description',label:'Description',type:'textarea',fullWidth:true},
              {name:'assigned_to',label:'Assigned To'},{name:'room_id',label:'Room ID',type:'number'},
              {name:'frequency',label:'Frequency',type:'select',options:['daily','weekly','biweekly','monthly']},
              {name:'priority',label:'Priority',type:'select',options:['low','medium','high']},
              {name:'status',label:'Status',type:'select',options:['pending','in_progress','completed']},
              {name:'due_date',label:'Due Date',type:'date'},{name:'points',label:'Points',type:'number'},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/budget" element={<FeaturePage feature="budget" title="Budget" icon="💰" columns={['icon','title','category','amount','type','date','payment_method','is_recurring']} fields={[
              {name:'title',label:'Title',required:true},{name:'category',label:'Category'},
              {name:'amount',label:'Amount ($)',type:'number'},{name:'type',label:'Type',type:'select',options:['expense','income','budget']},
              {name:'date',label:'Date',type:'date'},{name:'payment_method',label:'Payment Method'},
              {name:'vendor',label:'Vendor'},{name:'is_recurring',label:'Recurring',type:'select',options:['true','false']},
              {name:'frequency',label:'Frequency',type:'select',options:['one_time','weekly','monthly','yearly']},
              {name:'notes',label:'Notes',type:'textarea',fullWidth:true},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/inventory" element={<FeaturePage feature="inventory" title="Pantry" icon="🥫" columns={['icon','name','category','quantity','unit','location','expiry_date','status']} fields={[
              {name:'name',label:'Name',required:true},{name:'category',label:'Category'},
              {name:'quantity',label:'Quantity',type:'number'},{name:'unit',label:'Unit'},{name:'location',label:'Location'},
              {name:'expiry_date',label:'Expiry Date',type:'date'},{name:'min_stock',label:'Min Stock',type:'number'},
              {name:'barcode',label:'Barcode'},{name:'status',label:'Status',type:'select',options:['in_stock','low_stock','out_of_stock','expired']},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/weather" element={<FeaturePage feature="weather" title="Weather" icon="🌤️" columns={['icon','location','date','temperature','condition','humidity','wind_speed','forecast_high','forecast_low']} fields={[
              {name:'location',label:'Location',required:true},{name:'date',label:'Date',type:'date'},
              {name:'temperature',label:'Temperature',type:'number'},{name:'feels_like',label:'Feels Like',type:'number'},
              {name:'humidity',label:'Humidity',type:'number'},{name:'wind_speed',label:'Wind Speed',type:'number'},
              {name:'condition',label:'Condition'},{name:'forecast_high',label:'High',type:'number'},
              {name:'forecast_low',label:'Low',type:'number'},{name:'uv_index',label:'UV Index',type:'number'},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/pets" element={<FeaturePage feature="pets" title="Pet Care" icon="🐾" columns={['icon','name','species','breed','age_years','weight','next_vet_visit','feeding_schedule']} fields={[
              {name:'name',label:'Name',required:true},{name:'species',label:'Species'},{name:'breed',label:'Breed'},
              {name:'age_years',label:'Age (years)',type:'number'},{name:'weight',label:'Weight (lbs)',type:'number'},
              {name:'vet_name',label:'Vet Name'},{name:'vet_phone',label:'Vet Phone'},
              {name:'next_vet_visit',label:'Next Vet Visit',type:'date'},{name:'feeding_schedule',label:'Feeding Schedule'},
              {name:'medications',label:'Medications',type:'textarea',fullWidth:true},{name:'notes',label:'Notes',type:'textarea',fullWidth:true},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/plants" element={<FeaturePage feature="plants" title="Plants" icon="🌱" columns={['icon','name','species','location','sunlight_needs','water_frequency','last_watered','next_water','health_status']} fields={[
              {name:'name',label:'Name',required:true},{name:'species',label:'Species'},{name:'location',label:'Location'},
              {name:'sunlight_needs',label:'Sunlight',type:'select',options:['full_sun','partial_sun','shade']},
              {name:'water_frequency',label:'Water Freq'},{name:'last_watered',label:'Last Watered',type:'date'},
              {name:'next_water',label:'Next Water',type:'date'},{name:'last_fertilized',label:'Last Fertilized',type:'date'},
              {name:'health_status',label:'Health',type:'select',options:['healthy','needs_attention','wilting','dormant']},
              {name:'notes',label:'Notes',type:'textarea',fullWidth:true},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/guests" element={<FeaturePage feature="guests" title="Guests" icon="🏠" columns={['icon','name','relationship','visit_date','departure_date','room_name','wifi_access','status']} fields={[
              {name:'name',label:'Name',required:true},{name:'relationship',label:'Relationship'},
              {name:'phone',label:'Phone'},{name:'email',label:'Email'},
              {name:'visit_date',label:'Visit Date',type:'date'},{name:'departure_date',label:'Departure',type:'date'},
              {name:'room_id',label:'Room ID',type:'number'},{name:'wifi_access',label:'WiFi',type:'select',options:['true','false']},
              {name:'dietary_restrictions',label:'Dietary',type:'textarea',fullWidth:true},
              {name:'notes',label:'Notes',type:'textarea',fullWidth:true},
              {name:'status',label:'Status',type:'select',options:['expected','checked_in','checked_out']},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/media" element={<FeaturePage feature="media" title="Media" icon="🎵" columns={['icon','title','artist','media_type','source','room_name','volume','status']} fields={[
              {name:'title',label:'Title',required:true},{name:'artist',label:'Artist'},{name:'album',label:'Album'},
              {name:'media_type',label:'Type',type:'select',options:['music','podcast','audiobook','radio','tv']},
              {name:'source',label:'Source',type:'select',options:['spotify','apple_music','youtube','local','radio']},
              {name:'room_id',label:'Room ID',type:'number'},{name:'device_id',label:'Device ID',type:'number'},
              {name:'volume',label:'Volume',type:'number'},{name:'status',label:'Status',type:'select',options:['playing','paused','stopped']},
              {name:'duration_sec',label:'Duration (sec)',type:'number'},{name:'playlist',label:'Playlist'},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/laundry" element={<FeaturePage feature="laundry" title="Laundry" icon="👕" columns={['icon','label','load_type','machine','status','started_at','estimated_done','assigned_to']} fields={[
              {name:'label',label:'Label',required:true},
              {name:'load_type',label:'Type',type:'select',options:['whites','darks','colors','delicates','towels','bedding']},
              {name:'machine',label:'Machine',type:'select',options:['washer','dryer']},
              {name:'status',label:'Status',type:'select',options:['pending','washing','drying','done','folded']},
              {name:'temperature',label:'Temperature',type:'select',options:['cold','warm','hot']},
              {name:'cycle_type',label:'Cycle'},{name:'assigned_to',label:'Assigned To'},
              {name:'notes',label:'Notes',type:'textarea',fullWidth:true},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/packages" element={<FeaturePage feature="packages" title="Packages" icon="📦" columns={['icon','description','carrier','tracking_number','expected_delivery','status','recipient']} fields={[
              {name:'description',label:'Description',required:true},{name:'carrier',label:'Carrier'},
              {name:'tracking_number',label:'Tracking #'},{name:'order_date',label:'Order Date',type:'date'},
              {name:'expected_delivery',label:'Expected Delivery',type:'date'},{name:'actual_delivery',label:'Actual Delivery',type:'date'},
              {name:'status',label:'Status',type:'select',options:['ordered','shipped','in_transit','out_for_delivery','delivered','returned']},
              {name:'recipient',label:'Recipient'},{name:'retailer',label:'Retailer'},
              {name:'notes',label:'Notes',type:'textarea',fullWidth:true},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/warranty" element={<FeaturePage feature="warranty" title="Warranty" icon="📋" columns={['icon','item_name','type','provider','start_date','end_date','coverage_amount','status']} fields={[
              {name:'item_name',label:'Item Name',required:true},
              {name:'type',label:'Type',type:'select',options:['warranty','home_insurance','appliance_insurance','extended_warranty']},
              {name:'provider',label:'Provider'},{name:'policy_number',label:'Policy #'},
              {name:'start_date',label:'Start Date',type:'date'},{name:'end_date',label:'End Date',type:'date'},
              {name:'coverage_amount',label:'Coverage ($)',type:'number'},{name:'premium',label:'Premium ($)',type:'number'},
              {name:'deductible',label:'Deductible ($)',type:'number'},
              {name:'status',label:'Status',type:'select',options:['active','expired','claimed','cancelled']},
              {name:'contact_phone',label:'Phone'},{name:'notes',label:'Notes',type:'textarea',fullWidth:true},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/emergency" element={<FeaturePage feature="emergency" title="Emergency Contacts" icon="🚨" columns={['icon','name','relationship','phone','type','priority']} fields={[
              {name:'name',label:'Name',required:true},{name:'relationship',label:'Relationship'},
              {name:'phone',label:'Phone',required:true},{name:'alt_phone',label:'Alt Phone'},
              {name:'email',label:'Email'},{name:'address',label:'Address',type:'textarea',fullWidth:true},
              {name:'type',label:'Type',type:'select',options:['medical','fire','police','family','neighbor','utility','other']},
              {name:'priority',label:'Priority',type:'number'},{name:'notes',label:'Notes',type:'textarea',fullWidth:true},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/intercom" element={<FeaturePage feature="intercom" title="Intercom" icon="📢" columns={['icon','sender','from_room','to_room','message','type','is_read','priority']} fields={[
              {name:'sender',label:'Sender'},{name:'from_room_id',label:'From Room ID',type:'number'},
              {name:'to_room_id',label:'To Room ID',type:'number'},{name:'from_room',label:'From Room'},{name:'to_room',label:'To Room'},
              {name:'message',label:'Message',type:'textarea',fullWidth:true,required:true},
              {name:'type',label:'Type',type:'select',options:['text','voice','broadcast','alert']},
              {name:'priority',label:'Priority',type:'select',options:['normal','urgent']},{name:'icon',label:'Icon'}
            ]} />} />

            {/* Robot AI */}
            <Route path="/robotstatus" element={<FeaturePage feature="robotstatus" title="Robot Status" icon="🤖" columns={['icon','robot_name','battery_level','status','current_location','cpu_usage','health_score','uptime_hours']} fields={[
              {name:'robot_name',label:'Robot Name',required:true},{name:'battery_level',label:'Battery %',type:'number'},
              {name:'status',label:'Status',type:'select',options:['idle','active','charging','cleaning','patrolling','error']},
              {name:'current_location',label:'Location'},{name:'cpu_usage',label:'CPU %',type:'number'},
              {name:'memory_usage',label:'Memory %',type:'number'},{name:'temperature_celsius',label:'Temp (C)',type:'number'},
              {name:'uptime_hours',label:'Uptime (hrs)',type:'number'},{name:'firmware_version',label:'Firmware'},
              {name:'health_score',label:'Health Score',type:'number'},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/robottasks" element={<FeaturePage feature="robottasks" title="Robot Tasks" icon="📋" columns={['icon','task_name','task_type','priority','status','assigned_robot','scheduled_at']} fields={[
              {name:'task_name',label:'Task Name',required:true},{name:'description',label:'Description',type:'textarea',fullWidth:true},
              {name:'task_type',label:'Type',type:'select',options:['cleaning','security','delivery','monitoring','social','information']},
              {name:'priority',label:'Priority',type:'select',options:['low','medium','high']},
              {name:'status',label:'Status',type:'select',options:['queued','in_progress','completed','failed','scheduled']},
              {name:'assigned_robot',label:'Assigned Robot'},{name:'result',label:'Result',type:'textarea',fullWidth:true},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/voice" element={<FeaturePage feature="voice" title="Voice Commands" icon="🎤" columns={['icon','command_text','intent','confidence','speaker','room_name','status']} fields={[
              {name:'command_text',label:'Command',required:true},{name:'intent',label:'Intent'},
              {name:'confidence',label:'Confidence',type:'number'},{name:'speaker',label:'Speaker'},
              {name:'room_id',label:'Room ID',type:'number'},{name:'action_taken',label:'Action Taken'},
              {name:'status',label:'Status',type:'select',options:['processed','failed','pending']},
              {name:'response_text',label:'Response',type:'textarea',fullWidth:true},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/faces" element={<FeaturePage feature="faces" title="Face Recognition" icon="👤" columns={['icon','person_name','confidence','location','is_recognized','emotion','access_granted']} fields={[
              {name:'person_name',label:'Person',required:true},{name:'profile_id',label:'Profile ID',type:'number'},
              {name:'confidence',label:'Confidence',type:'number'},{name:'location',label:'Location'},
              {name:'camera_id',label:'Camera ID',type:'number'},
              {name:'is_recognized',label:'Recognized',type:'select',options:['true','false']},
              {name:'emotion',label:'Emotion'},{name:'access_granted',label:'Access',type:'select',options:['true','false']},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/emotions" element={<FeaturePage feature="emotions" title="Emotions" icon="😊" columns={['icon','person','emotion','confidence','secondary_emotion','room_name','context']} fields={[
              {name:'person',label:'Person',required:true},{name:'emotion',label:'Emotion'},
              {name:'confidence',label:'Confidence',type:'number'},{name:'secondary_emotion',label:'Secondary Emotion'},
              {name:'room_id',label:'Room ID',type:'number'},{name:'context',label:'Context'},
              {name:'action_suggested',label:'Action Suggested',type:'textarea',fullWidth:true},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/gestures" element={<FeaturePage feature="gestures" title="Gestures" icon="🤚" columns={['icon','gesture_name','person','confidence','action_triggered','room_name','status']} fields={[
              {name:'gesture_name',label:'Gesture',required:true},{name:'person',label:'Person'},
              {name:'confidence',label:'Confidence',type:'number'},{name:'action_triggered',label:'Action Triggered'},
              {name:'room_id',label:'Room ID',type:'number'},{name:'camera_id',label:'Camera ID',type:'number'},
              {name:'status',label:'Status',type:'select',options:['recognized','unrecognized','processing']},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/objects" element={<FeaturePage feature="objects" title="Object Detection" icon="🔍" columns={['icon','object_name','category','confidence','location','room_name','is_anomaly']} fields={[
              {name:'object_name',label:'Object',required:true},{name:'category',label:'Category'},
              {name:'confidence',label:'Confidence',type:'number'},{name:'location',label:'Location'},
              {name:'room_id',label:'Room ID',type:'number'},{name:'camera_id',label:'Camera ID',type:'number'},
              {name:'is_anomaly',label:'Anomaly',type:'select',options:['true','false']},
              {name:'action_taken',label:'Action Taken',type:'textarea',fullWidth:true},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/patrol" element={<FeaturePage feature="patrol" title="Robot Patrol" icon="🛡️" columns={['icon','name','schedule','status','started_at','completed_at','rooms_checked','anomalies_found']} fields={[
              {name:'name',label:'Name',required:true},{name:'schedule',label:'Schedule'},
              {name:'status',label:'Status',type:'select',options:['scheduled','in_progress','completed','cancelled']},
              {name:'rooms_checked',label:'Rooms Checked',type:'number'},{name:'anomalies_found',label:'Anomalies',type:'number'},
              {name:'report',label:'Report',type:'textarea',fullWidth:true},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/navigation" element={<FeaturePage feature="navigation" title="Navigation" icon="🗺️" columns={['icon','destination','from_location','status','distance_meters','duration_sec','obstacles_avoided']} fields={[
              {name:'destination',label:'Destination',required:true},{name:'from_location',label:'From'},
              {name:'room_id',label:'Room ID',type:'number'},
              {name:'status',label:'Status',type:'select',options:['navigating','completed','failed','cancelled']},
              {name:'distance_meters',label:'Distance (m)',type:'number'},{name:'duration_sec',label:'Duration (sec)',type:'number'},
              {name:'obstacles_avoided',label:'Obstacles Avoided',type:'number'},{name:'map_version',label:'Map Version'},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/companion" element={<FeaturePage feature="companion" title="Companion" icon="🧸" columns={['icon','interaction_type','person','category','duration_min','mood_before','mood_after','rating']} fields={[
              {name:'interaction_type',label:'Type',required:true,type:'select',options:['Storytelling','Game','Meditation','Joke Telling','Homework Help','Lullaby','Exercise','Reminder']},
              {name:'person',label:'Person'},{name:'content',label:'Content',type:'textarea',fullWidth:true},
              {name:'category',label:'Category',type:'select',options:['entertainment','education','wellness','comfort','utility']},
              {name:'duration_min',label:'Duration (min)',type:'number'},
              {name:'mood_before',label:'Mood Before'},{name:'mood_after',label:'Mood After'},
              {name:'rating',label:'Rating',type:'number'},{name:'room_id',label:'Room ID',type:'number'},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/sleep" element={<FeaturePage feature="sleep" title="Sleep Analysis" icon="😴" columns={['icon','person','date','bedtime','wake_time','duration_hours','quality_score','disturbances']} fields={[
              {name:'person',label:'Person',required:true},{name:'date',label:'Date',type:'date'},
              {name:'bedtime',label:'Bedtime'},{name:'wake_time',label:'Wake Time'},
              {name:'duration_hours',label:'Duration (hrs)',type:'number'},{name:'quality_score',label:'Quality Score',type:'number'},
              {name:'deep_sleep_pct',label:'Deep Sleep %',type:'number'},{name:'rem_sleep_pct',label:'REM Sleep %',type:'number'},
              {name:'disturbances',label:'Disturbances',type:'number'},{name:'room_temperature',label:'Room Temp',type:'number'},
              {name:'ai_recommendation',label:'AI Recommendation',type:'textarea',fullWidth:true},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/anomalies" element={<FeaturePage feature="anomalies" title="Anomalies" icon="⚠️" columns={['icon','title','type','severity','source','confidence','is_resolved']} fields={[
              {name:'title',label:'Title',required:true},{name:'type',label:'Type'},
              {name:'severity',label:'Severity',type:'select',options:['low','medium','high','critical']},
              {name:'source',label:'Source'},{name:'description',label:'Description',type:'textarea',fullWidth:true},
              {name:'room_id',label:'Room ID',type:'number'},{name:'device_id',label:'Device ID',type:'number'},
              {name:'confidence',label:'Confidence',type:'number'},
              {name:'is_resolved',label:'Resolved',type:'select',options:['true','false']},
              {name:'action_taken',label:'Action Taken',type:'textarea',fullWidth:true},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/predictive" element={<FeaturePage feature="predictive" title="Predictive AI" icon="🔮" columns={['icon','device_name','predicted_issue','failure_probability','predicted_date','severity','estimated_cost','status']} fields={[
              {name:'device_name',label:'Device',required:true},{name:'device_id',label:'Device ID',type:'number'},
              {name:'predicted_issue',label:'Issue'},{name:'failure_probability',label:'Probability',type:'number'},
              {name:'predicted_date',label:'Predicted Date',type:'date'},
              {name:'severity',label:'Severity',type:'select',options:['low','medium','high','critical']},
              {name:'recommendation',label:'Recommendation',type:'textarea',fullWidth:true},
              {name:'estimated_cost',label:'Est. Cost ($)',type:'number'},
              {name:'status',label:'Status',type:'select',options:['predicted','monitoring','action_needed','scheduled','resolved']},
              {name:'ai_model',label:'AI Model'},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/recommendations" element={<FeaturePage feature="recommendations" title="AI Recommendations" icon="💡" columns={['icon','title','category','priority','potential_savings','difficulty','status','ai_confidence']} fields={[
              {name:'title',label:'Title',required:true},{name:'description',label:'Description',type:'textarea',fullWidth:true},
              {name:'category',label:'Category'},{name:'priority',label:'Priority',type:'select',options:['low','medium','high','critical']},
              {name:'potential_savings',label:'Savings ($)',type:'number'},{name:'difficulty',label:'Difficulty',type:'select',options:['easy','medium','hard']},
              {name:'status',label:'Status',type:'select',options:['pending','accepted','completed','rejected']},
              {name:'ai_confidence',label:'AI Confidence',type:'number'},{name:'icon',label:'Icon'}
            ]} />} />
            <Route path="/ai" element={<AIAssistant />} />
          </Routes>
        </main>
      </div>
    </AppContext.Provider>
  );
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
