
import { KPIMetric, ActiveCall, Lead, Event, Call, Agent, WhatsAppTemplate, Theme, Alert } from './types';

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
    value: '₹4.20',
    target: '<₹5.60',
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

export const activeCalls: ActiveCall[] = [
  {
    id: 'call-1',
    customerId: 'cust-123',
    customerName: 'Jennifer Williams',
    agentId: 'agent-5',
    agentName: 'AI Agent 5',
    duration: 345,
    sentiment: 'positive',
    sentimentScore: 88,
    topic: 'Booking Inquiry',
    status: 'active',
    startTime: new Date('2024-05-21T10:05:00Z')
  },
  {
    id: 'call-2',
    customerId: 'cust-456',
    customerName: 'Michael Brown',
    agentId: 'agent-human-2',
    agentName: 'Jessica Davis',
    duration: 521,
    sentiment: 'neutral',
    sentimentScore: 55,
    topic: 'Pricing Question',
    status: 'on-hold',
    startTime: new Date('2024-05-21T10:02:00Z')
  },
  {
    id: 'call-3',
    customerId: 'cust-789',
    customerName: 'Linda Martinez',
    agentId: 'agent-8',
    agentName: 'AI Agent 8',
    duration: 123,
    sentiment: 'negative',
    sentimentScore: 23,
    topic: 'Complaint',
    status: 'active',
    startTime: new Date('2024-05-21T10:08:00Z')
  },
    {
    id: 'call-4',
    customerId: 'cust-234',
    customerName: 'Robert Jones',
    agentId: 'agent-2',
    agentName: 'AI Agent 2',
    duration: 276,
    sentiment: 'positive',
    sentimentScore: 92,
    topic: 'Date Availability',
    status: 'transferring',
    startTime: new Date('2024-05-21T10:06:00Z')
  }
];


export const recentBookings = Array.from({ length: 30 }, (_, i) => {
  const createdAt = new Date(Date.now() - (i * 86400000 * 1.5));
  return {
    id: `booking-${i + 1}`,
    customerId: `cust-${(i % 20) + 1}`,
    customerName: ['Linda Robinson', 'John Doe', 'Mary Smith'][i % 3],
    eventType: ['Wedding', 'Conference', 'Birthday Party'][i % 3],
    eventDate: new Date(Date.now() + (i * 86400000 * 5)),
    guestCount: 50 + (i * 5),
    value: 5000 + (i * 1500),
    status: i % 4 === 0 ? 'cancelled' : i % 3 === 0 ? 'pending' : 'confirmed',
    paymentMethod: i % 2 === 0 ? 'credit' : 'bank',
    paymentStatus: i % 3 === 0 ? 'pending' : 'paid',
    createdAt,
    modifiedAt: i % 5 === 0 ? new Date(createdAt.getTime() + 86400000 * 2) : undefined
  };
});

const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const companies = ['Tech Corp', 'Global Enterprises', 'Innovation Inc', 'Future Solutions', 'Prime Industries'];
const eventTypes = ['Wedding', 'Corporate Event', 'Birthday Party', 'Conference', 'Product Launch', 'Gala Dinner'];
const leadTypes = ['new', 'contacted', 'qualified','converted', 'lost'];
const venues = ['Grand Ballroom', 'Riverside Garden', 'Metropolitan Hall', 'Skyline Terrace', 'Harbor View Center'];
const topics = ['Booking Inquiry', 'Pricing Question', 'Date Availability', 'Menu Options', 'Payment Issue'];
const leadSources = ['Website', 'Referral', 'Social Media', 'Email Campaign', 'Cold Call'];
const statuses = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
const priorities = ['High', 'Medium', 'Low'];



export const leads: Lead[] = Array.from({ length: 150 }, (_, i) => ({
  lead_id: i + 1,
  name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
  email: `lead${i + 1}@example.com`,
  phone_number: `+91-987-654-32${(i + 10).toString().padStart(2, '0')}`,
  source: leadSources[i % leadSources.length],
  status: statuses[i % statuses.length],
  lead_type: leadTypes[i % leadTypes.length],
  priority: priorities[i % priorities.length],
  notes: i % 4 === 0 ? null : 'Initial contact made. Follow up required.',
  last_notified: i % 3 === 0 ? null : new Date(Date.now() - i * 3600000).toISOString(),
  created_at: new Date(Date.now() - i * 86400000).toISOString(),
}));

export const events: Event[] = Array.from({ length: 100 }, (_, i) => ({
  id: `event-${i + 1}`,
  name: `${eventTypes[i % eventTypes.length]} ${i + 1}`,
  type: eventTypes[i % eventTypes.length],
  venue: venues[i % venues.length],
  date: new Date(Date.now() + (i * 86400000 * 2)),
  status: ['planned', 'confirmed', 'in-progress', 'completed', 'cancelled'][i % 5] as any,
  capacity: 50 + (i % 10) * 20,
  booked: 20 + (i % 10) * 15,
  revenue: 5000 + (i % 20) * 2500,
  customerId: `cust-${i + 1}`,
  customerName: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`
}));

// export const calls: Call[] = Array.from({ length: 2000 }, (_, i) => {
//   const startTime = new Date(Date.now() - i * 3600000);
//   const duration = 60 + (i % 1140);
//   const isAI = i % 3 !== 0;

//   return {
//     id: `call-${i + 1}`,
//     customerId: `cust-${(i % 500) + 1}`,
//     customerName: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
//     agentId: `agent-${(i % 25) + 1}`,
//     agentName: isAI ? `AI Agent ${(i % 15) + 1}` : `${firstNames[(i+5) % firstNames.length]} ${lastNames[(i+5) % lastNames.length]}`,
//     agentType: isAI ? 'ai' : 'human',
//     direction: i % 2 === 0 ? 'inbound' : 'outbound',
//     duration,
//     outcome: ['resolved', 'transferred', 'callback', 'abandoned'][i % 4] as any,
//     sentiment: i % 5 === 0 ? 'negative' : i % 2 === 0 ? 'neutral' : 'positive',
//     sentimentJourney: Array.from({ length: 10 }, (_, j) => 50 + Math.sin(i + j) * 40 + (i%10)),
//     topics: [topics[i % topics.length], topics[(i+1) % topics.length]],
//     intentRecognized: i % 10 !== 0,
//     intentAccuracy: 80 + (i % 20),
//     transcript: 'Customer inquired about availability for wedding in June. Discussed package options and pricing. Scheduled follow-up call.',
//     startTime,
//     endTime: new Date(startTime.getTime() + duration * 1000),
//     cost: isAI ? 0.5 + (i % 10) * 0.15 : 2 + (i % 20) * 0.3,
//     qualityScore: 80 + (i % 20)
//   };
// });


export const agents: Agent[] = [
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `agent-${i + 1}`,
    name: `AI Agent ${i + 1}`,
    type: 'ai' as const,
    status: ['available', 'busy', 'away'][i % 3] as any,
    skills: ['Booking', 'Sales', 'Support', 'Technical', 'Complaints'].slice(i%3, i%3 + 3),
    performanceMetrics: {
      fcr: 70 + (i % 15),
      acd: 4 + (i % 3),
      csat: 80 + (i % 15),
      qualityScore: 80 + (i % 15),
      utilization: 70 + (i % 20),
      callsToday: 10 + (i % 40)
    },
    currentCall: i % 3 === 1 ? `call-${i*2 + 1}` : undefined
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `agent-${i + 16}`,
    name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
    type: 'human' as const,
    status: ['available', 'busy', 'away', 'offline'][i % 4] as any,
    skills: ['Booking', 'Sales', 'Support'].slice(i%2, i%2 + 2),
    performanceMetrics: {
      fcr: 70 + (i % 15),
      acd: 5 + (i % 4),
      csat: 75 + (i % 15),
      qualityScore: 75 + (i % 15),
      utilization: 65 + (i % 20),
      callsToday: 5 + (i % 35)
    },
    currentCall: i % 4 === 1 ? `call-${i*3 + 1}` : undefined
  }))
];

export const whatsappTemplates: WhatsAppTemplate[] = Array.from({ length: 20 }, (_, i) => ({
  id: `template-${i + 1}`,
  name: `Template ${i + 1}`,
  category: ['Marketing', 'Transactional', 'Authentication', 'Utility'][i % 4],
  content: 'Hello {{name}}, your booking for {{event}} on {{date}} is confirmed!',
  status: i % 10 < 8 ? 'active' : (i % 2 === 0 ? 'pending' : 'rejected'),
  read: 85 + i * 5,
  sent: 100 + i * 500,
  language: 'en',
  metrics: {
    sent: 100 + i * 500,
    delivered: 96 + i * 480,
    read: 85 + i * 445,
    clicked: 10 + i * 64,
    converted: 5 + i * 22
  },
  createdAt: new Date(Date.now() - i * 86400000 * 4.5)
}));

// export const themes: Theme[] = Array.from({ length: 25 }, (_, i) => ({
//   id: `theme-${i + 1}`,
//   name: `${['Classic', 'Modern', 'Luxury', 'Rustic', 'Garden', 'Beach', 'Urban', 'Vintage'][i % 8]} Package ${i + 1}`,
//   description: 'Complete event package with venue, catering, and decoration',
//   basePrice: 1000 + (i % 10) * 500,
//   category: ['Wedding', 'Corporate', 'Birthday', 'Conference'][i % 4],
//   features: ['Venue', 'Catering', 'Decoration', 'Photography', 'Entertainment'],
//   status: i % 10 !== 0 ? 'active' : 'inactive',
//   popularity: 10 + (i % 90),
//   bookings: 1 + (i % 50),
//   revenue: 5000 + (i % 20) * 5000,
//   seasonalMultiplier: i % 3 === 0 ? 1 + (i % 5) * 0.1 : undefined
// }));

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

export const callVolumeData = [
    { name: '12am', calls: 30 },
    { name: '3am', calls: 45 },
    { name: '6am', calls: 60 },
    { name: '9am', calls: 80 },
    { name: '12pm', calls: 100 },
    { name: '3pm', calls: 85 },
    { name: '6pm', calls: 65 },
    { name: '9pm', calls: 40 },
];
  
export const sentimentDistributionData = [
    { name: 'Positive', value: 68, fill: 'hsl(var(--color-emerald))' },
    { name: 'Neutral', value: 22, fill: 'hsl(var(--color-gray))' },
    { name: 'Negative', value: 10, fill: 'hsl(var(--color-red))' },
];

export const agentData = [
  { id: 1, name: 'AI Agent 1', isAI: true, status: 'online', fcr: 92, csat: 88, callsToday: 42, avatar: ''},
  { id: 2, name: 'Sarah Miller', isAI: false, status: 'busy', fcr: 85, csat: 91, callsToday: 28, avatar: '/avatars/01.png' },
  { id: 3, name: 'AI Agent 2', isAI: true, status: 'online', fcr: 94, csat: 89, callsToday: 51, avatar: '' },
  { id: 4, name: 'David Chen', isAI: false, status: 'offline', fcr: 88, csat: 93, callsToday: 31, avatar: '/avatars/02.png' },
];

export const eventThemes = [
  { id: 1, name: 'Vintage Wedding', basePrice: 15000, bookings: 42, revenue: 630000, popularity: 'High' },
  { id: 2, name: 'Tech Conference', basePrice: 25000, bookings: 18, revenue: 450000, popularity: 'Medium' },
  { id: 3, name: 'Garden Party', basePrice: 8000, bookings: 65, revenue: 520000, popularity: 'High' },
  { id: 4, name: 'Product Launch', basePrice: 30000, bookings: 12, revenue: 360000, popularity: 'Low' },
];

export const systemHealth = [
    {id: 1, name: 'API Latency', value: '52ms', status: 'healthy'},
    {id: 2, name: 'Database CPU', value: '48%', status: 'healthy'},
    {id: 3, name: 'AI Model Accuracy', value: '94.2%', status: 'healthy'},
    {id: 4, name: 'Error Rate', value: '1.3%', status: 'warning'},
];

export const recentAudits = [
    {id: 1, area: 'PCI Compliance', result: 'passed', timestamp: '2024-05-20T10:00:00Z'},
    {id: 2, area: 'GDPR Data Check', result: 'passed', timestamp: '2024-05-18T14:30:00Z'},
    {id: 3, area: 'Security Pen-test', result: 'failed', timestamp: '2024-05-15T09:00:00Z'},
    {id: 4, area: 'Agent Script Adh', result: 'passed', timestamp: '2024-05-12T11:00:00Z'},
];
