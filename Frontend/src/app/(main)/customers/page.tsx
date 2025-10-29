
'use client';
import { useState, useEffect, useMemo } from 'react';
import { Users, Calendar, TrendingUp, Search, Filter, Download, ArrowDown, ArrowUp } from 'lucide-react';
import { Customer, Lead, Event } from '@/lib/types';
import { API_BASE_URL } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { format, subDays } from 'date-fns';


type TabType = 'customers' | 'leads' | 'events';
type SortDirection = 'ascending' | 'descending';
const ITEMS_PER_PAGE = 10;

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
  
  // Filter states - Retaining for potential future use, though UI is removed.
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection } | null>({ key: 'Name', direction: 'ascending' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  const [loading, setLoading] = useState({
      customers: true,
      leads: true,
      events: true,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading({ customers: true, leads: true, events: true });

      try {
        const [customersResponse, leadsResponse, eventsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/customers/?skip=0&limit=100`),
          fetch(`${API_BASE_URL}/leads/?skip=0&limit=100`),
          fetch(`${API_BASE_URL}/events/?skip=0&limit=100`),
        ]);

        if (!customersResponse.ok) throw new Error(`HTTP error on customers: ${customersResponse.status} ${await customersResponse.text() || customersResponse.statusText}`);
        if (!leadsResponse.ok) throw new Error(`HTTP error on leads: ${leadsResponse.status} ${await leadsResponse.text() || leadsResponse.statusText}`);
        if (!eventsResponse.ok) throw new Error(`HTTP error on events: ${eventsResponse.status} ${await eventsResponse.text() || eventsResponse.statusText}`);

        const [customersDataRaw, leadsDataRaw, eventsDataRaw] = await Promise.all([
          customersResponse.json(),
          leadsResponse.json(),
          eventsResponse.json(),
        ]);

        if (cancelled) return;
        
        setError(null);

        const customersArray = Array.isArray(customersDataRaw) ? customersDataRaw : [customersDataRaw];
        const leadsArray = Array.isArray(leadsDataRaw) ? leadsDataRaw : [leadsDataRaw];
        const eventsArray = Array.isArray(eventsDataRaw) ? eventsDataRaw : [eventsDataRaw];

        setCustomers(customersArray.map(normalizeCustomer));
        setLeads(leadsArray.map(normalizeLead));
        setEvents(eventsArray.map(normalizeEvent));

      } catch (err) {
        console.error('❌ Error fetching data:', err);
        if (!cancelled) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred while fetching data.');
        }
      } finally {
        if (!cancelled) {
            setLoading({ customers: false, leads: false, events: false });
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, leadStatusFilter, dateFilter, customDateRange]);

  const requestSort = (key: string) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const { filteredCustomers, filteredLeads, filteredEvents } = useMemo(() => {
    const q = String(searchTerm ?? '').toLowerCase();
    
    const dateFilterFunc = (dateString: string) => {
        if (!dateString) return true;
        const itemDate = new Date(dateString);
        if (isNaN(itemDate.getTime())) return true;
        
        const now = new Date();
        if (dateFilter === 'today') return itemDate.toDateString() === now.toDateString();
        if (dateFilter === '7d') return itemDate >= subDays(now, 7) && itemDate <= now;
        if (dateFilter === '30d') return itemDate >= subDays(now, 30) && itemDate <= now;
        if (dateFilter === 'custom' && customDateRange?.from && customDateRange?.to) {
            return itemDate >= customDateRange.from && itemDate <= customDateRange.to;
        }
        return true;
    }

    let sortedCustomers = [...customers];
    let sortedLeads = [...leads];
    let sortedEvents = [...events];
    
    if (sortConfig !== null) {
        const key = sortConfig.key as keyof (Customer | Lead | Event);
        const direction = sortConfig.direction === 'ascending' ? 1 : -1;

        const sortFn = (a: any, b: any) => {
            const valA = a[key];
            const valB = b[key];
            if (valA < valB) return -1 * direction;
            if (valA > valB) return 1 * direction;
            return 0;
        };
        sortedCustomers.sort(sortFn);
        sortedLeads.sort(sortFn);
        sortedEvents.sort(sortFn);
    }
    
    const filteredCustomers = sortedCustomers.filter((c) => {
        const name = String(c?.Name ?? '').toLowerCase();
        const email = String(c?.Email ?? '').toLowerCase();
        const phone = String(c?.PhoneNumber ?? '').toLowerCase();
        return (name.includes(q) || email.includes(q) || phone.includes(q)) && dateFilterFunc(c.CustomerSince);
    });

    const filteredLeads = sortedLeads.filter((l) => {
        const name = String(l?.Name ?? '').toLowerCase();
        const email = String(l?.Email ?? '').toLowerCase();
        const phone = String(l?.PhoneNumber ?? '').toLowerCase();
        const notes = String(l?.Notes ?? '').toLowerCase();
        const statusMatch = leadStatusFilter === 'all' || (l.Status || 'unknown').toLowerCase() === leadStatusFilter;
        const searchMatch = name.includes(q) || email.includes(q) || phone.includes(q) || notes.includes(q);
        return statusMatch && searchMatch && dateFilterFunc(l.CreatedAt);
    });

    const filteredEvents = sortedEvents.filter((e) => {
        const type = String(e?.Event_type ?? '').toLowerCase();
        const notes = String(e?.Notes ?? '').toLowerCase();
        const agent = String(e?.Agent_ID ?? '').toLowerCase();
        return (type.includes(q) || notes.includes(q) || agent.includes(q)) && dateFilterFunc(e.Proposed_date);
    });

    return { filteredCustomers, filteredLeads, filteredEvents };
  }, [customers, leads, events, searchTerm, sortConfig, leadStatusFilter, dateFilter, customDateRange]);

  const { currentData, totalPages } = useMemo(() => {
    let data;
    switch(activeTab) {
      case 'customers': data = filteredCustomers; break;
      case 'leads': data = filteredLeads; break;
      case 'events': data = filteredEvents; break;
    }
    const total = Math.ceil(data.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return {
      currentData: data.slice(startIndex, startIndex + ITEMS_PER_PAGE),
      totalPages: total,
    };
  }, [activeTab, currentPage, filteredCustomers, filteredLeads, filteredEvents]);


  const exportData = () => {
    let dataToExport;
    let filename;
    switch (activeTab) {
      case 'customers':
        dataToExport = filteredCustomers;
        filename = 'customers.csv';
        break;
      case 'leads':
        dataToExport = filteredLeads;
        filename = 'leads.csv';
        break;
      case 'events':
        dataToExport = filteredEvents;
        filename = 'events.csv';
        break;
      default:
        return;
    }

    if (dataToExport.length === 0) {
      console.warn("No data to export.");
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [Object.keys(dataToExport[0]).join(","), ...dataToExport.map(item => Object.values(item).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const SortableHeader = ({ sortKey, children }: { sortKey: string, children: React.ReactNode }) => (
    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestSort(sortKey)}>
      <div className="flex items-center">
        {children}
        {getSortIcon(sortKey)}
      </div>
    </th>
  );
  
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex justify-between items-center mt-4">
            <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
            <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
            <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
        </div>
    )
  }


  const renderContent = () => {
    const isLoading =
      activeTab === 'customers' ? loading.customers : activeTab === 'leads' ? loading.leads : loading.events;
    
    const hasData = activeTab === 'customers' ? customers.length > 0 : activeTab === 'leads' ? leads.length > 0 : events.length > 0;

    if (isLoading && !hasData) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      );
    }

    if (error && !hasData) {
      return (
        <div className="flex justify-center items-center h-64 bg-red-50 rounded-lg">
          <div className="text-red-600 text-center">
            <p className="font-bold">Failed to load data.</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      );
    }

    const paginatedCustomers = currentData as Customer[];
    const paginatedLeads = currentData as Lead[];
    const paginatedEvents = currentData as Event[];

    if (activeTab === 'customers') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <SortableHeader sortKey="Name">Name</SortableHeader>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <SortableHeader sortKey="Original_Lead_ID">Lead ID</SortableHeader>
                <SortableHeader sortKey="CustomerSince">Customer Since</SortableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedCustomers.map((customer, idx) => (
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
          {renderPagination()}
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
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(leadsByStatus).map(([status, count]) => (
              <div key={status} className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-600 mt-1 capitalize">{status}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <SortableHeader sortKey="Name">Name</SortableHeader>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <SortableHeader sortKey="Source">Source</SortableHeader>
                  <SortableHeader sortKey="LeadType">Lead Type</SortableHeader>
                  <SortableHeader sortKey="Priority">Priority</SortableHeader>
                  <SortableHeader sortKey="Status">Status</SortableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedLeads.map((lead, idx) => (
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
            {renderPagination()}
          </div>
        </div>
      );
    }

    if (activeTab === 'events') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <SortableHeader sortKey="Customer_ID">Customer ID</SortableHeader>
                <SortableHeader sortKey="Event_type">Type</SortableHeader>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                <SortableHeader sortKey="Proposed_date">Proposed Date</SortableHeader>
                <SortableHeader sortKey="Guest_count">Guest Count</SortableHeader>
                <SortableHeader sortKey="Agent_ID">Agent ID</SortableHeader>
                <SortableHeader sortKey="Status">Status</SortableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedEvents.map((event, idx) => (
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
          {renderPagination()}
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
        <button onClick={exportData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
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
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 relative min-w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-4">
                 <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option value="all">All Dates</option>
                      <option value="today">Today</option>
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                      <option value="custom">Custom Range</option>
                  </select>
                  {dateFilter === 'custom' && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className="w-[240px] justify-start text-left font-normal"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {customDateRange?.from ? (
                                    customDateRange.to ? (
                                        `${format(customDateRange.from, 'LLL dd, y')} - ${format(customDateRange.to, 'LLL dd, y')}`
                                    ) : (
                                        format(customDateRange.from, 'LLL dd, y')
                                    )
                                ) : (
                                    <span>Pick a date range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <CalendarPicker
                                initialFocus
                                mode="range"
                                defaultMonth={customDateRange?.from}
                                selected={customDateRange}
                                onSelect={setCustomDateRange}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                  )}
            </div>
          </div>
          
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

    