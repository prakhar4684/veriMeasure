import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { StatusBadge } from '../../components/Badge';
import { Gauge, Plus, Search, Filter, ShieldCheck, MapPin, ArrowUpRight } from 'lucide-react';

export const InstrumentListPage: React.FC = () => {
  const [instruments, setInstruments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    loadInstruments();
  }, []);

  async function loadInstruments() {
    try {
      const data = await apiFetch('/instruments');
      setInstruments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = instruments.filter(
    (i) =>
      i.meter_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">MeterID – Digital Instrument Passport Registry</h1>
            <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">{instruments.length} Instruments</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Central statutory registry for regulated weighing & measuring instruments across India.</p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Instrument</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center space-x-3 shadow-sm">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by MeterID (e.g. LM-2026-EWI), Serial Number, Manufacturer..."
          className="w-full text-xs bg-transparent focus:outline-none text-slate-900 placeholder-slate-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="responsive-table-container overflow-x-auto">
          <table className="responsive-data-table w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">MeterID Passport</th>
                <th className="py-3.5 px-4">Type & Category</th>
                <th className="py-3.5 px-4">Manufacturer & Serial</th>
                <th className="py-3.5 px-4">Location Jurisdiction</th>
                <th className="py-3.5 px-4">Compliance State</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((inst) => (
                <tr key={inst.id} className="hover:bg-slate-50/80 transition-colors">
                  <td data-label="MeterID Passport" className="py-3.5 px-4">
                    <Link to={`/instruments/${inst.id}`} className="font-mono font-bold text-slate-900 hover:text-amber-600 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{inst.meter_id}</span>
                    </Link>
                  </td>
                  <td data-label="Type & Category" className="py-3.5 px-4 font-medium text-slate-700">
                    <div>{inst.instrument_type_name}</div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{inst.category}</span>
                  </td>
                  <td data-label="Manufacturer & Serial" className="py-3.5 px-4 text-slate-600">
                    <div>{inst.manufacturer}</div>
                    <div className="text-[10px] font-mono text-slate-400">{inst.serial_number}</div>
                  </td>
                  <td data-label="Location Jurisdiction" className="py-3.5 px-4 text-slate-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{inst.district}, {inst.state}</span>
                    </div>
                  </td>
                  <td data-label="Compliance State" className="py-3.5 px-4">
                    <StatusBadge status={inst.compliance_status} />
                  </td>
                  <td data-label="Actions" className="py-3.5 px-4 text-right">
                    <Link
                      to={`/instruments/${inst.id}`}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-amber-500 hover:text-slate-950 rounded-lg text-xs font-bold text-slate-700 transition-colors"
                    >
                      <span>Passport</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showRegisterModal && (
        <RegisterModal onClose={() => setShowRegisterModal(false)} onSuccess={loadInstruments} />
      )}
    </div>
  );
};

const RegisterModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [types, setTypes] = useState<any[]>([]);
  const [typeId, setTypeId] = useState('');
  const [serial, setSerial] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch('/instruments/types').then(setTypes).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/instruments', {
        method: 'POST',
        body: JSON.stringify({
          instrument_type_id: typeId || types[0]?.id,
          serial_number: serial,
          manufacturer,
          model_number: model,
          location_address: address,
          capacity_specs: { min_capacity: 10, max_capacity: 50000, unit: 'g' }
        })
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Register New Regulated Instrument</h3>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700">Instrument Category Type</label>
            <select
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
              className="mt-1 block w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
            >
              {types.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Serial Number</label>
              <input
                type="text"
                required
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                placeholder="SN-99410"
                className="mt-1 block w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Manufacturer Name</label>
              <input
                type="text"
                required
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="Avery India / Essae"
                className="mt-1 block w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700">Model Number</label>
            <input
              type="text"
              required
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="EWI-50K-PRO"
              className="mt-1 block w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700">Installation Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Warehouse 4, Lawrence Road Industrial Area, Delhi"
              className="mt-1 block w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-amber-500 font-bold text-slate-950 rounded-xl">Generate MeterID Passport</button>
          </div>
        </form>
      </div>
    </div>
  );
};
