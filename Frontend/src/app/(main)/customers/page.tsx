'use client';
import { useState, useEffect } from 'react';
import { Users, Calendar, TrendingUp, Search, Filter, Download } from 'lucide-react';
import { Customer, Lead, Event } from '@/lib/types';
import { API_BASE_URL } from '@/lib/config';

type TabType = 'customers' | 'leads' | 'events';

/**
 * Normalizers: convert API objects (possibly snake_case) -> shapes our UI expects.
 * They are defensive: handle missing keys, nulls and multiple possible key names.
 */
function pickString(obj: any, ...keys: string[]) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v) !== '') return String(v);
  }
  return '';
}

function pickNumber(obj: any, ...keys: string[]) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v === undefined || v === null || v === '') continue;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

function safeDateString(value: any) {
  try {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value); // fallback to raw string
    return d.toLocaleDateString();
  } catch {
    return String(value ?? '');
  }
}

function normalizeCustomer(apiObj: any): Customer {
  // map various possible key names to our Customer type fields
  return {
    Customer_ID:
      pickNumber(apiObj, 'customer_id', 'Customer_ID', 'id', 'customerId') ?? undefined,
    Name: pickString(apiObj, 'name', 'Name', 'full_name', 'fullName'),
    Email: pickString(apiObj, 'email', 'Email', 'email_address'),
    PhoneNumber: pickString(apiObj, 'phone_number', 'phonenumber', 'PhoneNumber', 'phone'),
    Original_Lead_ID:
      pickNumber(apiObj, 'original_lead_id', 'Original_Lead_ID', 'originalLeadId', 'lead_id') ??
      undefined,
    CustomerSince: pickString(apiObj, 'customer_since', 'CustomerSince', 'customer_since_at', 'created_at') || '',
    // keep raw object in case you later need additional fields
    _raw: apiObj,
  } as any;
}

function normalizeLead(apiObj: any): Lead {
  return {
    Lead_ID: pickNumber(apiObj, 'lead_id', 'Lead_ID', 'id') ?? undefined,
    Name: pickString(apiObj, 'name', 'Name', 'full_name'),
    Email: pickString(apiObj, 'email', 'Email', 'email_address'),
    PhoneNumber: pickString(apiObj, 'phone_number', 'phonenumber', 'PhoneNumber', 'phone'),
    Status: pickString(apiObj, 'status', 'Status').toLowerCase() || 'unknown',
    LeadType: pickString(apiObj, 'lead_type', 'LeadType', 'type'),
    Priority: pickString(apiObj, 'priority', 'Priority'),
    Source: pickString(apiObj, 'source', 'Source'),
    Notes: pickString(apiObj, 'notes', 'Notes'),
    CreatedAt: pickString(apiObj, 'created_at', 'CreatedAt', 'createdAt'),
    _raw: apiObj,
  } as any;
}

function normalizeEvent(apiObj: any): Event {
  return {
    Event_ID: pickNumber(apiObj, 'event_id', 'Event_ID', 'id') ?? undefined,
    Customer_ID: pickNumber(apiObj, 'customer_id', 'Customer_ID') ?? undefined,
    Event_type: pickString(apiObj, 'event_type', 'Event_type', 'type'),
    Notes: pickString(apiObj, 'notes', 'Notes', 'description'),
    Proposed_date: pickString(apiObj, 'proposed_date', 'Proposed_date', 'proposedDate', 'date'),
    Guest_count: pickNumber(apiObj, 'guest_count', 'Guest_count', 'guestCount') ?? undefined,
    Agent_ID: pickNumber(apiObj, 'agent_id', 'Agent_ID', 'agentId') ?? undefined,
    Status: pickString(apiObj, 'status', 'Status').toLowerCase() || 'unknown',
    _raw: apiObj,
  } as any;
}

export default function CustomersHubPage() {
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [searchTerm, setSearchTerm] = useState('');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setError(null);
      setLoadingCustomers(true);
      setLoadingLeads(true);
      setLoadingEvents(true);

      try {
        const [customersResponse, leadsResponse, eventsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/customers/?skip=0&limit=100`),
          fetch(`${API_BASE_URL}/leads/?skip=0&limit=100`),
          fetch(`${API_BASE_URL}/events/?skip=0&limit=100`),
        ]);

        if (!customersResponse.ok) throw new Error(`HTTP ${customersResponse.status} on customers`);
        if (!leadsResponse.ok) throw new Error(`HTTP ${leadsResponse.status} on leads`);
        if (!eventsResponse.ok) throw new Error(`HTTP ${eventsResponse.status} on events`);

        const [customersDataRaw, leadsDataRaw, eventsDataRaw] = await Promise.all([
          customersResponse.json(),
          leadsResponse.json(),
          eventsResponse.json(),
        ]);

        if (cancelled) return;

        // Defensive: if API returns single object instead of array, coerce to array
        const customersArray = Array.isArray(customersDataRaw) ? customersDataRaw : [customersDataRaw];
        const leadsArray = Array.isArray(leadsDataRaw) ? leadsDataRaw : [leadsDataRaw];
        const eventsArray = Array.isArray(eventsDataRaw) ? eventsDataRaw : [eventsDataRaw];

        const normalizedCustomers = customersArray.map(normalizeCustomer);
        const normalizedLeads = leadsArray.map(normalizeLead);
        const normalizedEvents = eventsArray.map(normalizeEvent);

        setCustomers(normalizedCustomers);
        setLeads(normalizedLeads);
        setEvents(normalizedEvents);

        setLoadingCustomers(false);
        setLoadingLeads(false);
        setLoadingEvents(false);
      } catch (err) {
        console.error('❌ Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Unexpected error');
        setLoadingCustomers(false);
        setLoadingLeads(false);
        setLoadingEvents(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const q = String(searchTerm ?? '').toLowerCase();

  const filteredCustomers = customers.filter((c) => {
    const name = String(c?.Name ?? '').toLowerCase();
    const email = String(c?.Email ?? '').toLowerCase();
    const phone = String(c?.PhoneNumber ?? '').toLowerCase();
    return name.includes(q) || email.includes(q) || phone.includes(q);
  });

  const filteredLeads = leads.filter((l) => {
    const name = String(l?.Name ?? '').toLowerCase();
    const email = String(l?.Email ?? '').toLowerCase();
    const phone = String(l?.PhoneNumber ?? '').toLowerCase();
    const notes = String(l?.Notes ?? '').toLowerCase();
    return name.includes(q) || email.includes(q) || phone.includes(q) || notes.includes(q);
  });

  const filteredEvents = events
    .filter((e) => {
      const type = String(e?.Event_type ?? '').toLowerCase();
      const notes = String(e?.Notes ?? '').toLowerCase();
      const agent = String(e?.Agent_ID ?? '').toLowerCase();
      return type.includes(q) || notes.includes(q) || agent.includes(q);
    })
    .slice(0, 50);

  const renderContent = () => {
    const loading =
      activeTab === 'customers' ? loadingCustomers : activeTab === 'leads' ? loadingLeads : loadingEvents;

    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500 text-center">
            <p>Failed to load data.</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      );
    }

    if (activeTab === 'customers') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((customer, idx) => (
                <tr
                  key={customer.Customer_ID ?? `customer-${customer.Email ?? idx}-${idx}`}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{customer.Name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{customer.Email || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{customer.PhoneNumber || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {customer.Original_Lead_ID ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {customer.CustomerSince ? safeDateString(customer.CustomerSince) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCustomers.length === 0 && <p className="text-center text-gray-500 mt-4">No customers found.</p>}
        </div>
      );
    }

    if (activeTab === 'leads') {
      const leadsByStatus = leads.reduce((acc: Record<string, number>, lead) => {
        const st = (lead.Status || 'unknown').toLowerCase();
        acc[st] = (acc[st] || 0) + 1;
        return acc;
      }, {});

      return (
        <div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {Object.entries(leadsByStatus).map(([status, count], idx) => (
              <div key={status ?? `lead-status-${idx}`} className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-600 mt-1 capitalize">{status}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeads.map((lead, idx) => (
                  <tr key={lead.Lead_ID ?? `lead-${lead.Email ?? idx}-${idx}`} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3 font-medium text-gray-900">{lead.Name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>
                        <p>{lead.Email || '—'}</p>
                        <p className="text-xs text-gray-500">{lead.PhoneNumber || '—'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{lead.Source || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{lead.LeadType || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{lead.Priority || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          lead.Status === 'won'
                            ? 'bg-emerald-100 text-emerald-800'
                            : lead.Status === 'lost'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {lead.Status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLeads.length === 0 && <p className="text-center text-gray-500 mt-4">No leads found.</p>}
          </div>
        </div>
      );
    }

    if (activeTab === 'events') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proposed Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest Count</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEvents.map((event, idx) => (
                <tr
                  key={event.Event_ID ?? `event-${event.Customer_ID ?? idx}-${idx}`}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{event.Customer_ID ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{event.Event_type || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{event.Notes || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {event.Proposed_date ? safeDateString(event.Proposed_date) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{event.Guest_count ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{event.Agent_ID ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        event.Status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : event.Status === 'confirmed'
                          ? 'bg-blue-100 text-blue-800'
                          : event.Status === 'proposed'
                          ? 'bg-gray-100 text-gray-800'
                          : event.Status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {event.Status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEvents.length === 0 && <p className="text-center text-gray-500 mt-4">No events found.</p>}
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enterprise Data Hub</h1>
          <p className="text-gray-500 mt-1">Manage customers, leads, and events</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Data
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'customers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Customers ({customers.length})
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'leads' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Leads ({leads.length})
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'events' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Events ({events.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
