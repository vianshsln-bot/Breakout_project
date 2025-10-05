import { useEffect, useState } from 'react';
import { Users, Calendar, TrendingUp, Search, Filter, Download } from 'lucide-react';
import { customers, leads, events } from '../data/mockData';
import {Customer} from '../types';
type TabType = 'customers' | 'leads' | 'events';



export type CustomerListItem = Pick<Customer, 'customer_id' | 'name' | 'email' | 'phone_number' | 'created_at'>;

export function CustomersHub() {
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  const fetchCustomers = async () => {
    try {
      console.log("1. Effect is running. Starting fetch..."); // Check if this appears in the console
      
      const response = await fetch('http://localhost:8000/customers');
      console.log("2. Response received:", response); // Check if the response object looks okay (e.g., status: 200)

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("3. Data parsed as JSON:", data); // Check if 'data' has a 'customers' property

      // IMPORTANT: Check if data.customers exists. If your API just returns an array,
      // you should use setCustomers(data) instead.
      setCustomers(data); 
      
    } catch (err) {
      console.error("4. Error caught during fetch:", err); // Check if an error was caught
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      console.log("5. Fetch process finished."); // This should always run
      setLoading(false);
    }
  };

  fetchCustomers();
}, []); // The empty array ensures this runs only once


  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 50);

  const filteredLeads = leads.filter(l =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 50);

  const filteredEvents = events.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 50);

  const leadsByStatus = {
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    proposal: leads.filter(l => l.status === 'proposal').length,
    negotiation: leads.filter(l => l.status === 'negotiation').length,
    won: leads.filter(l => l.status === 'won').length,
    lost: leads.filter(l => l.status === 'lost').length
  };
  // if (loading) {
  //   return (
  //   // This container centers the spinner
  //   <div className="flex justify-center items-center h-64">
  //     {/* This is the spinner element */}
  //     <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
  //   </div>
  //   );
  // }

  // if (error) {
  //   return <div>Error: {error}</div>; // Show an error message if something went wrong
  // }
  
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

          {activeTab === 'customers' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th> */}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sentiment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th> */}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.customer_id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          
                        </div>
                      </td>
                      {/* <td className="px-4 py-3 text-sm text-gray-600 capitalize">{customer.type}</td> */}
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div>
                          <p>{customer.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div>
                          <p>{customer.phone_number}</p>
                        </div>
                      </td>
                      {/* <td className="px-4 py-3 text-sm font-medium text-gray-900">{customer.totalBookings}</td> */}
                      {/* <td className="px-4 py-3 text-sm font-bold text-emerald-600">
                        ${customer.totalValue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          customer.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-800' :
                          customer.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.sentiment}
                        </span>
                      </td> */}
                      {/* <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          customer.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.status}
                        </span> */}
                      {/* </td> */}
                      <td className="px-4 py-3 text-sm ">
                        <div>
                          <p>{customer.created_at}</p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'leads' && (
            <div>
              <div className="grid grid-cols-7 gap-4 mb-6">
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{lead.name}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div>
                            <p>{lead.email}</p>
                            <p className="text-xs text-gray-500">{lead.phone}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{lead.source}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{lead.eventType}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  lead.score > 70 ? 'bg-emerald-500' :
                                  lead.score > 40 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${lead.score}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{lead.score}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-emerald-600">
                          ${lead.expectedValue.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            lead.status === 'won' ? 'bg-emerald-100 text-emerald-800' :
                            lead.status === 'lost' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venue</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-4 py-3 font-medium text-gray-900">{event.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{event.type}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{event.venue}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(event.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{event.customerName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {event.booked} / {event.capacity}
                        <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600"
                            style={{ width: `${(event.booked / event.capacity) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-emerald-600">
                        ${event.revenue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          event.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          event.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
