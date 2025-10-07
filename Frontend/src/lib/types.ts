import { ReactNode } from "react";




export interface ApiCall {
  customer_id: number;
  transcript: string;
  date_time: string;
  duration: number;
  call_intent: string;
  credits_consumed: number;
  conv_id: string;
}


export interface KPIMetric {
  id: string;
  label: string;
  value: string;
  target: string;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  sparklineData: number[];
}

export interface KpiApiResponse {
  status: string;
  kpis: {
    total_calls: number;
    analyzed_calls: number;
    first_call_resolution_pct: number;
    avg_call_duration_sec: number;
    positive_sentiment_rate_pct: number;
    call_abandon_rate_pct: number;
    missed_calls: number;
    customer_conversion_rate_pct: number;
    overall_quality_score: number;
    customer_satisfaction_avg_rating: number;
  };
}

export interface ActiveCall {
  id: string;
  customerId: string;
  customerName: string;
  agentId: string;
  agentName: string;
  duration: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  topic: string;
  status: 'active' | 'on-hold' | 'transferring';
  startTime: Date;
}

export interface Booking {
  booking_id: number;
  booking_date: string;
  slot_id: number;
  customer_id: number;
  booking_status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_id: number;
  conv_id: string;
  guest_count: number;
}


export interface Customer {
  name: string;
  email: string;
  phone_number: string;
  original_lead_id: number;
  Customer_id: number;
  customer_since: string;
}

export interface CustomerListItem {
  customer_id: string;
  name: string;
  email: string;
  phone_number: string;
  created_at: String;
}

export interface Lead {
  name: string;
  email: string;
  phone_number: string;
  status: string;
  lead_type: string;
  priority: string;
  source: string;
  notes: string | null;
  last_notified: string | null;
  lead_id: number;
  created_at: string;
}

export interface Event {
  id: string;
  name: string;
  type: string;
  venue: string;
  date: Date;
  status: 'planned' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  capacity: number;
  booked: number;
  revenue: number;
  customerId: string;
  customerName: string;
}

export interface Call {
  id: string;
  customer_id: string;
  customerName: string;
  agent_id: string;
  agentName: string;
  agentType: 'ai' | 'human';
  direction: 'inbound' | 'outbound';
  duration: number;
  outcome: 'resolved' | 'transferred' | 'callback' | 'abandoned';
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentJourney: number[];
  topics: string[];
  intentRecognized: boolean;
  intentAccuracy: number;
  transcript: string;
  recordingUrl?: string;
  startTime: Date;
  endTime: Date;
  cost: number;
  qualityScore: number;
}

export interface Agent {
  id: string;
  name: string;
  type: 'ai' | 'human';
  status: 'available' | 'busy' | 'away' | 'offline';
  skills: string[];
  performanceMetrics: {
    fcr: number;
    acd: number;
    csat: number;
    qualityScore: number;
    utilization: number;
    callsToday: number;
  };
  currentCall?: string;
  avatar?: string;
}

export interface WhatsAppTemplate {
  read: number;
  sent: number;
  id: string;
  name: string;
  category: string;
  content: string;
  status: 'active' | 'pending' | 'rejected' | 'approved';
  language: string;
  metrics: {
    sent: number;
    delivered: number;
    read: number;
    clicked: number;
    converted: number;
  };
  createdAt: Date;
}

export interface Theme {
    Name: string;
    Description: string;
    Duration: number;
    Minimum_players: number;
    Trailers: string | null;
    Price_per_person: number;
    Theme_ID: number;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}
