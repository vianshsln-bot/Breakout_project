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
    
    // Customers
    total_customers: number;
    new_customers: number;
    avg_spend_per_customer: number;
    top_customer_locations: string;
    
    // Leads
    total_leads_generated: number;
    lead_conversion_rate_pct: number;
    lead_response_time_sec: number;
    lead_source_effectiveness: string;
    qualified_lead_ratio_pct: number;

    // Bookings
    total_bookings: number;
    booking_conversion_rate_pct: number;
    avg_booking_value: number;
    cancellation_rate_pct: number;
    repeat_booking_rate_pct: number;

    // Payment Analytics
    total_revenue_collected: number;
    pending_payments: number;
    avg_payment_value: number;
    revenue_growth_rate_pct: number;
    refund_chargeback_rate_pct: number;
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
  booking_id: string;
  event_id: string;
  theme_id: string;
  start_time: string;
  end_time: string;
  customer_id: string;
  status: 'active' | 'confirmed' | 'cancelled' | 'completed';
  creation_time: string;
  conv_id: string | null;
}


export interface Customer {
  Name: string;
  Email: string;
  PhoneNumber: string;
  Original_Lead_ID: number;
  Customer_ID: number;
  CustomerSince: string;
}

export interface CustomerListItem {
  customer_id: string;
  name: string;
  email: string;
  phone_number: string;
  created_at: String;
}

export interface Lead {
  Name: string;
  Email: string;
  PhoneNumber: string;
  Status: string;
  LeadType: string;
  Priority: string;
  Source: string;
  Notes: string | null;
  LastNotified: string | null;
  Lead_ID: number;
  CreatedAt: string;
}

export interface Event {
  Event_ID: string;
  Event_type: string;
  Proposed_date: Date;
  Status: 'proposed' | 'confirmed' | 'completed' | 'cancelled';
  Guest_count: number;
  Agent_ID:number
  Customer_ID: string;
  Notes: string;
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
