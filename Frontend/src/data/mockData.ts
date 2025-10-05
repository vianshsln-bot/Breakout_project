import { KPIMetric, ActiveCall, Booking, Customer, Lead, Event, Call, Agent, WhatsAppTemplate, Theme, Alert } from '../types';

export const kpiMetrics: KPIMetric[] = [
  {
    id: 'fcr',
    label: 'First Call Resolution',
    value: '78%',
    target: '75-85%',
    trend: 'up',
    status: 'good',
    sparklineData: [72, 74, 76, 75, 77, 78, 79, 78]
  },
  {
    id: 'acd',
    label: 'Avg Call Duration',
    value: '6.2 min',
    target: '4-8 min',
    trend: 'down',
    status: 'good',
    sparklineData: [6.8, 6.5, 6.4, 6.3, 6.2, 6.1, 6.2, 6.2]
  },
  {
    id: 'abandonment',
    label: 'Abandonment Rate',
    value: '6.8%',
    target: '<8%',
    trend: 'stable',
    status: 'warning',
    sparklineData: [7.2, 6.9, 6.8, 7.0, 6.8, 6.7, 6.8, 6.8]
  },
  {
    id: 'csat',
    label: 'Customer Satisfaction',
    value: '87%',
    target: '>85%',
    trend: 'up',
    status: 'good',
    sparklineData: [83, 84, 85, 86, 86, 87, 88, 87]
  },
  {
    id: 'ces',
    label: 'Customer Effort Score',
    value: '2.3',
    target: '<3.0',
    trend: 'down',
    status: 'good',
    sparklineData: [2.8, 2.7, 2.6, 2.5, 2.4, 2.3, 2.2, 2.3]
  },
  {
    id: 'sentiment',
    label: 'Live Positive Sentiment',
    value: '68%',
    target: '≥65%',
    trend: 'up',
    status: 'good',
    sparklineData: [64, 65, 66, 67, 68, 69, 68, 68]
  },
  {
    id: 'cost',
    label: 'Cost per Contact',
    value: '$4.20',
    target: '<$5.60',
    trend: 'down',
    status: 'good',
    sparklineData: [4.8, 4.7, 4.6, 4.5, 4.3, 4.2, 4.1, 4.2]
  },
  {
    id: 'utilization',
    label: 'Agent Utilization',
    value: '82.4%',
    target: '75-85%',
    trend: 'stable',
    status: 'good',
    sparklineData: [80, 81, 82, 83, 82, 82, 83, 82]
  }
];

const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
  'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen',
  'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra',
  'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle'];

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];

const companies = ['Tech Corp', 'Global Enterprises', 'Innovation Inc', 'Future Solutions', 'Prime Industries'];

const eventTypes = ['Wedding', 'Corporate Event', 'Birthday Party', 'Conference', 'Product Launch', 'Gala Dinner',
  'Team Building', 'Anniversary', 'Networking Event', 'Award Ceremony'];

const venues = ['Grand Ballroom', 'Riverside Garden', 'Metropolitan Hall', 'Skyline Terrace', 'Harbor View Center',
  'Crystal Palace', 'Heritage Mansion', 'Downtown Convention', 'Lakeside Pavilion', 'Plaza Hotel'];

const topics = ['Booking Inquiry', 'Pricing Question', 'Date Availability', 'Menu Options', 'Payment Issue',
  'Modification Request', 'Cancellation', 'Complaint', 'Follow-up', 'General Question'];

const leadSources = ['Website', 'Referral', 'Social Media', 'Email Campaign', 'Cold Call', 'Trade Show', 'Partner'];

export const activeCalls: ActiveCall[] = Array.from({ length: 12 }, (_, i) => ({
  id: `call-${i + 1}`,
  customerId: `cust-${Math.floor(Math.random() * 500) + 1}`,
  customerName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
  agentId: `agent-${Math.floor(Math.random() * 25) + 1}`,
  agentName: Math.random() > 0.4 ? `AI Agent ${Math.floor(Math.random() * 15) + 1}` : `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
  duration: Math.floor(Math.random() * 600) + 30,
  sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as 'positive' | 'neutral' | 'negative',
  sentimentScore: Math.random() * 100,
  topic: topics[Math.floor(Math.random() * topics.length)],
  status: ['active', 'on-hold', 'transferring'][Math.floor(Math.random() * 3)] as 'active' | 'on-hold' | 'transferring',
  startTime: new Date(Date.now() - Math.random() * 600000)
}));

export const recentBookings: Booking[] = Array.from({ length: 30 }, (_, i) => {
  const createdAt = new Date(Date.now() - Math.random() * 86400000 * 7);
  return {
    id: `booking-${i + 1}`,
    customerId: `cust-${Math.floor(Math.random() * 500) + 1}`,
    customerName: Math.random() > 0.3
      ? `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
      : companies[Math.floor(Math.random() * companies.length)],
    eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
    eventDate: new Date(Date.now() + Math.random() * 86400000 * 180),
    guestCount: Math.floor(Math.random() * 300) + 20,
    value: Math.floor(Math.random() * 5000) + 500,
    status: ['pending', 'confirmed', 'completed', 'cancelled'][Math.floor(Math.random() * 4)] as any,
    paymentMethod: ['credit', 'debit', 'wallet', 'bank'][Math.floor(Math.random() * 4)] as any,
    paymentStatus: ['paid', 'pending', 'failed'][Math.floor(Math.random() * 10) < 9 ? 0 : Math.floor(Math.random() * 2) + 1] as any,
    createdAt,
    modifiedAt: Math.random() > 0.7 ? new Date(createdAt.getTime() + Math.random() * 86400000 * 3) : undefined
  };
});

export const customers: Customer[] = Array.from({ length: 500 }, (_, i) => ({
  id: `cust-${i + 1}`,
  name: Math.random() > 0.3
    ? `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
    : companies[Math.floor(Math.random() * companies.length)],
  email: `customer${i + 1}@example.com`,
  phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
  type: Math.random() > 0.3 ? 'individual' : 'corporate',
  status: Math.random() > 0.1 ? 'active' : 'inactive',
  totalBookings: Math.floor(Math.random() * 10) + 1,
  totalValue: Math.floor(Math.random() * 20000) + 1000,
  lifetime: Math.floor(Math.random() * 730) + 30,
  lastContact: new Date(Date.now() - Math.random() * 86400000 * 90),
  sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 10) < 7 ? 0 : Math.floor(Math.random() * 2) + 1] as any,
  tags: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () =>
    ['VIP', 'Frequent', 'Corporate', 'Referral', 'At-Risk', 'High-Value'][Math.floor(Math.random() * 6)]
  ),
  createdAt: new Date(Date.now() - Math.random() * 86400000 * 730)
}));

export const leads: Lead[] = Array.from({ length: 150 }, (_, i) => ({
  id: `lead-${i + 1}`,
  name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
  email: `lead${i + 1}@example.com`,
  phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
  source: leadSources[Math.floor(Math.random() * leadSources.length)],
  status: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'][Math.floor(Math.random() * 7)] as any,
  score: Math.floor(Math.random() * 100),
  eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
  expectedValue: Math.floor(Math.random() * 10000) + 500,
  followUpDate: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 86400000 * 30) : undefined,
  assignedAgent: Math.random() > 0.3 ? `agent-${Math.floor(Math.random() * 10) + 1}` : undefined,
  notes: 'Initial contact made. Interested in premium package.',
  createdAt: new Date(Date.now() - Math.random() * 86400000 * 60)
}));

export const events: Event[] = Array.from({ length: 100 }, (_, i) => ({
  id: `event-${i + 1}`,
  name: `${eventTypes[Math.floor(Math.random() * eventTypes.length)]} ${i + 1}`,
  type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
  venue: venues[Math.floor(Math.random() * venues.length)],
  date: new Date(Date.now() + Math.random() * 86400000 * 180 - Math.random() * 86400000 * 90),
  status: ['planned', 'confirmed', 'in-progress', 'completed', 'cancelled'][Math.floor(Math.random() * 5)] as any,
  capacity: Math.floor(Math.random() * 300) + 50,
  booked: Math.floor(Math.random() * 250) + 20,
  revenue: Math.floor(Math.random() * 50000) + 5000,
  customerId: `cust-${Math.floor(Math.random() * 500) + 1}`,
  customerName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
}));

export const calls: Call[] = Array.from({ length: 2000 }, (_, i) => {
  const startTime = new Date(Date.now() - Math.random() * 86400000 * 180);
  const duration = Math.floor(Math.random() * 1200) + 60;
  const isAI = Math.random() > 0.4;

  return {
    id: `call-${i + 1}`,
    customerId: `cust-${Math.floor(Math.random() * 500) + 1}`,
    customerName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
    agentId: `agent-${Math.floor(Math.random() * 25) + 1}`,
    agentName: isAI ? `AI Agent ${Math.floor(Math.random() * 15) + 1}` : `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
    agentType: isAI ? 'ai' : 'human',
    direction: Math.random() > 0.4 ? 'inbound' : 'outbound',
    duration,
    outcome: ['resolved', 'transferred', 'callback', 'abandoned'][Math.floor(Math.random() * 4)] as any,
    sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 10) < 7 ? 0 : Math.floor(Math.random() * 2) + 1] as any,
    sentimentJourney: Array.from({ length: 10 }, () => Math.random() * 100),
    topics: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () =>
      topics[Math.floor(Math.random() * topics.length)]
    ),
    intentRecognized: Math.random() > 0.05,
    intentAccuracy: Math.random() * 20 + 80,
    transcript: 'Customer inquired about availability for wedding in June. Discussed package options and pricing. Scheduled follow-up call.',
    startTime,
    endTime: new Date(startTime.getTime() + duration * 1000),
    cost: isAI ? Math.random() * 2 + 0.5 : Math.random() * 8 + 2,
    qualityScore: Math.random() * 20 + 80
  };
});

export const agents: Agent[] = [
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `agent-${i + 1}`,
    name: `AI Agent ${i + 1}`,
    type: 'ai' as const,
    status: ['available', 'busy', 'away'][Math.floor(Math.random() * 3)] as any,
    skills: Array.from({ length: Math.floor(Math.random() * 4) + 2 }, () =>
      ['Booking', 'Sales', 'Support', 'Technical', 'Complaints'][Math.floor(Math.random() * 5)]
    ),
    performanceMetrics: {
      fcr: Math.random() * 15 + 70,
      acd: Math.random() * 3 + 4,
      csat: Math.random() * 15 + 80,
      qualityScore: Math.random() * 15 + 80,
      utilization: Math.random() * 20 + 70,
      callsToday: Math.floor(Math.random() * 50) + 10
    },
    currentCall: Math.random() > 0.5 ? `call-${Math.floor(Math.random() * 12) + 1}` : undefined
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `agent-${i + 16}`,
    name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
    type: 'human' as const,
    status: ['available', 'busy', 'away', 'offline'][Math.floor(Math.random() * 4)] as any,
    skills: Array.from({ length: Math.floor(Math.random() * 3) + 2 }, () =>
      ['Booking', 'Sales', 'Support', 'Technical', 'Complaints'][Math.floor(Math.random() * 5)]
    ),
    performanceMetrics: {
      fcr: Math.random() * 15 + 70,
      acd: Math.random() * 4 + 5,
      csat: Math.random() * 15 + 75,
      qualityScore: Math.random() * 15 + 75,
      utilization: Math.random() * 20 + 65,
      callsToday: Math.floor(Math.random() * 40) + 5
    },
    currentCall: Math.random() > 0.6 ? `call-${Math.floor(Math.random() * 12) + 1}` : undefined
  }))
];

export const whatsappTemplates: WhatsAppTemplate[] = Array.from({ length: 20 }, (_, i) => ({
  id: `template-${i + 1}`,
  name: `Template ${i + 1}`,
  category: ['Marketing', 'Transactional', 'Authentication', 'Utility'][Math.floor(Math.random() * 4)],
  content: 'Hello {{name}}, your booking for {{event}} on {{date}} is confirmed!',
  status: ['active', 'pending', 'rejected'][Math.floor(Math.random() * 10) < 8 ? 0 : Math.floor(Math.random() * 2) + 1] as any,
  language: 'en',
  metrics: {
    sent: Math.floor(Math.random() * 10000) + 100,
    delivered: Math.floor(Math.random() * 9600) + 96,
    read: Math.floor(Math.random() * 8900) + 85,
    clicked: Math.floor(Math.random() * 1280) + 10,
    converted: Math.floor(Math.random() * 450) + 5
  },
  createdAt: new Date(Date.now() - Math.random() * 86400000 * 90)
}));

export const themes: Theme[] = Array.from({ length: 25 }, (_, i) => ({
  id: `theme-${i + 1}`,
  name: `${['Classic', 'Modern', 'Luxury', 'Rustic', 'Garden', 'Beach', 'Urban', 'Vintage'][Math.floor(Math.random() * 8)]} Package ${i + 1}`,
  description: 'Complete event package with venue, catering, and decoration',
  basePrice: Math.floor(Math.random() * 5000) + 1000,
  category: ['Wedding', 'Corporate', 'Birthday', 'Conference'][Math.floor(Math.random() * 4)],
  features: ['Venue', 'Catering', 'Decoration', 'Photography', 'Entertainment'],
  status: Math.random() > 0.1 ? 'active' : 'inactive',
  popularity: Math.random() * 100,
  bookings: Math.floor(Math.random() * 50) + 1,
  revenue: Math.floor(Math.random() * 100000) + 5000,
  seasonalMultiplier: Math.random() > 0.5 ? Math.random() * 0.5 + 1 : undefined
}));

export const alerts: Alert[] = [
  {
    id: 'alert-1',
    type: 'critical',
    title: 'Queue Wait Time Exceeded',
    message: 'Average wait time is now 8 minutes, exceeding the 5-minute threshold',
    timestamp: new Date(Date.now() - 300000),
    read: false
  },
  {
    id: 'alert-2',
    type: 'warning',
    title: 'High Call Volume',
    message: '15% increase in call volume compared to last hour',
    timestamp: new Date(Date.now() - 600000),
    read: false
  },
  {
    id: 'alert-3',
    type: 'info',
    title: 'Agent Shift Change',
    message: '3 agents going on break in 10 minutes',
    timestamp: new Date(Date.now() - 900000),
    read: true
  }
];
