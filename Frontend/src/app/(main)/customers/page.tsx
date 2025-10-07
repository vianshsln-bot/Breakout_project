
'use client';
import { useState, useEffect } from 'react';
import { Users, Calendar, TrendingUp, Search, Filter, Download } from 'lucide-react';
import { Customer, Lead, Event } from '@/lib/types';
import { API_BASE_URL } from '@/lib/config';

// Mock data will be used for events until APIs are ready
// import { events as staticEvents } from '@/lib/data';


type TabType = 'customers' | 'leads' | 'events';

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
    const fetchData = async () => {
      // Log when the data fetching starts
      console.log('Attempting to fetch customers and leads...');
      
      setLoadingCustomers(true);
      setLoadingLeads(true);
      setError(null);

      try {
        const [customersResponse, leadsResponse, eventsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/customers/?skip=0&limit=100`),
          fetch(`${API_BASE_URL}/leads/?skip=0&limit=100`),
          fetch(`${API_BASE_URL}/events/?skip=0&limit=100`)
        ]);

        // Log the raw responses to check status, headers, etc.
        console.log('Customers API Response:', customersResponse);
        console.log('Leads API Response:', leadsResponse);
        console.log('Events API Response:', eventsResponse);

        if (!customersResponse.ok) {
          // Log the specific error before throwing
          console.error('Customer fetch failed with status:', customersResponse.status);
          throw new Error(`HTTP error! Status: ${customersResponse.status} on customers`);
        }
        const customersData = await customersResponse.json();
        
        // Log the actual data if retrieval is successful
        console.log('Successfully retrieved Customers Data:', customersData);
        setCustomers(customersData);
        setLoadingCustomers(false);
        
        if (!leadsResponse.ok) {
          // Log the specific error before throwing
          console.error('Leads fetch failed with status:', leadsResponse.status);
          throw new Error(`HTTP error! Status: ${leadsResponse.status} on leads`);
        }
        const leadsData = await leadsResponse.json();
        
        
        // Log the actual data if retrieval is successful
        console.log('Successfully retrieved Leads Data:', leadsData);
        setLeads(leadsData);
        setLoadingLeads(false);


        if (!eventsResponse.ok) {
          // Log the specific error before throwing
          console.error('Leads fetch failed with status:', leadsResponse.status);
          throw new Error(`HTTP error! Status: ${leadsResponse.status} on leads`);
        }
        const eventsdata = await eventsResponse.json();
        
        
        // Log the actual data if retrieval is successful
        console.log('Successfully retrieved events Data:', eventsdata); 
        setEvents(eventsdata);
        setLoadingEvents(false);
        // customersData.forEach((c: { name: any; email: any; }) => {
        //   if (!c.name || !c.email) console.log("Bad customer:", c);
        //   else console.log("good",c)
        // });
        // leadsData.forEach((l: { name: any; email: any; }) => {
        //   if (!l.name || !l.email) console.log("Bad lead:", l);
        //   else console.log("good",l)

        // });
        // eventsdata.forEach((e: { event_type: any; notes: any; }) => {
        //   if (!e.event_type || !e.notes) console.log("Bad event:", e);
        //   else console.log("good",e)
        // });

      } catch (err) {
        // Log the full error object to the console for detailed inspection
        console.error('An error occurred during the fetch process:', err);
        
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred');
        }

        setLoadingEvents(false)
        setLoadingCustomers(false);
        setLoadingLeads(false);
      }
    };

    fetchData();
  }, []);

  const filteredCustomers = customers.filter(c =>
    c.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.Email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLeads = leads.filter(l =>
    l.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.Email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEvents = events.filter(e =>
    e.Event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.Notes.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 50);
  

  const renderContent = () => {
    const loading = activeTab === 'customers' ? loadingCustomers : activeTab === 'leads' ? loadingLeads : false;

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
              {filteredCustomers.map((customer) => (
                <tr key={customer.Customer_ID} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{customer.Name}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{customer.Email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{customer.PhoneNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{customer.Original_Lead_ID}</td>
                  <td className="px-4 py-3 text-sm">{new Date(customer.CustomerSince).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (activeTab === 'leads') {
      const leadsByStatus = leads.reduce((acc, lead) => {
        acc[lead.Status] = (acc[lead.Status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return (
        <div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {Object.entries(leadsByStatus).map(([status, count]) => (
              <div key={status} className="p-4 bg-gray-50 rounded-lg text-center">
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
                  {filteredLeads.map((lead) => (
                    <tr key={lead.Lead_ID} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{lead.Name}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div>
                          <p>{lead.Email}</p>
                          <p className="text-xs text-gray-500">{lead.PhoneNumber}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lead.Source}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lead.LeadType}</td>
                       <td className="px-4 py-3 text-sm text-gray-600">{lead.Priority}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          lead.Status === 'won' ? 'bg-emerald-100 text-emerald-800' :
                          lead.Status === 'lost' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {lead.Status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              {filteredEvents.map((event) => (
                <tr key={event.Event_ID} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3 font-medium text-gray-900">{event.Customer_ID}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{event.Event_type}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{event.Notes}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(event.Proposed_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{event.Guest_count} </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{event.Agent_ID} </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      event.Status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                      event.Status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      event.Status === 'proposed' ? 'bg-gray-100 text-gray-800' :
                      event.Status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {event.Status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }

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
                activeTab === 'customers'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Customers ({customers.length})
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'leads'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Leads ({leads.length})
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'events'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
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
