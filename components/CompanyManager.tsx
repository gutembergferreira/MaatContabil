import React, { useState, useEffect } from 'react';
import { Company } from '../types';
import { getCompanies, addCompany, updateCompany, deleteCompany, getObligations, getApiUrl } from '../services/mockData';
import { Edit2, Trash2, Plus, Building } from 'lucide-react';

const UF_OPTIONS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const onlyDigits = (value: string) => value.replace(/\D/g, '');
const maskCep = (value: string) => {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const CompanyManager: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [availableObligations, setAvailableObligations] = useState<Array<{ id: string; name: string }>>([]);
  const [isCepLoading, setIsCepLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<Company>>({
    name: '',
    cnpj: '',
    address: '',
    contact: '',
    legalName: '',
    tradeName: '',
    nickname: '',
    active: true,
    taxRegime: 'Indefinido',
    companyGroup: 'Geral',
    honorarium: '',
    companyCode: '',
    addressStreet: '',
    addressNumber: '',
    addressComplement: '',
    addressZip: '',
    addressDistrict: '',
    addressCity: '',
    addressState: '',
    stateRegistration: '',
    stateRegistrationDate: '',
    stateRegistrationUf: '',
    stateExempt: false,
    nire: '',
    otherIdentifiers: '',
    phones: '',
    website: '',
    municipalRegistration: '',
    municipalRegistrationDate: '',
    notes: '',
    tags: '',
    contacts: [],
    obligations: []
  });
  const [contactDraft, setContactDraft] = useState({ name: '', role: '', phone: '', email: '' });

  useEffect(() => {
    setCompanies(getCompanies());
  }, []);

  useEffect(() => {
    setAvailableObligations(getObligations());
  }, [isModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const addressSummary = [
      formData.addressStreet,
      formData.addressNumber,
      formData.addressDistrict,
      formData.addressCity,
      formData.addressState
    ].filter(Boolean).join(' - ');
    const contactSummary = formData.phones || formData.contact || '';
    const payload: Company = {
      ...formData,
      id: editingId || createId(),
      name: formData.legalName || formData.name || '',
      cnpj: formData.cnpj || '',
      address: addressSummary,
      contact: contactSummary
    } as Company;
    if (editingId) {
       await updateCompany({ ...payload, id: editingId });
    } else {
       await addCompany(payload);
    }
    setCompanies(getCompanies());
    closeModal();
  };

  const openEdit = (c: Company) => {
     const mappedObligations = (c.obligations || []).map((item) => {
        const found = availableObligations.find((ob) => ob.id === item || ob.name === item);
        return found ? found.id : item;
     });
     setFormData({
        name: c.name || '',
        cnpj: c.cnpj || '',
        address: c.address || '',
        contact: c.contact || '',
        legalName: c.legalName || c.name || '',
        tradeName: c.tradeName || '',
        nickname: c.nickname || '',
        active: c.active ?? true,
        taxRegime: c.taxRegime || 'Indefinido',
        companyGroup: c.companyGroup || 'Geral',
        honorarium: c.honorarium || '',
        companyCode: c.companyCode || '',
        addressStreet: c.addressStreet || '',
        addressNumber: c.addressNumber || '',
        addressComplement: c.addressComplement || '',
        addressZip: c.addressZip || '',
        addressDistrict: c.addressDistrict || '',
        addressCity: c.addressCity || '',
        addressState: c.addressState || '',
        stateRegistration: c.stateRegistration || '',
        stateRegistrationDate: c.stateRegistrationDate || '',
        stateRegistrationUf: c.stateRegistrationUf || '',
        stateExempt: !!c.stateExempt,
        nire: c.nire || '',
        otherIdentifiers: c.otherIdentifiers || '',
        phones: c.phones || '',
        website: c.website || '',
        municipalRegistration: c.municipalRegistration || '',
        municipalRegistrationDate: c.municipalRegistrationDate || '',
        notes: c.notes || '',
        tags: c.tags || '',
        contacts: c.contacts || [],
        obligations: mappedObligations
     });
     setEditingId(c.id);
     setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
     if(confirm('Tem certeza que deseja excluir esta empresa?')) {
        await deleteCompany(id);
        setCompanies(getCompanies());
     }
  };

  const closeModal = () => {
     setIsModalOpen(false);
     setEditingId(null);
     setCurrentStep(0);
     setFormData({
        name: '',
        cnpj: '',
        address: '',
        contact: '',
        legalName: '',
        tradeName: '',
        nickname: '',
        active: true,
        taxRegime: 'Indefinido',
        companyGroup: 'Geral',
        honorarium: '',
        companyCode: '',
        addressStreet: '',
        addressNumber: '',
        addressComplement: '',
        addressZip: '',
        addressDistrict: '',
        addressCity: '',
        addressState: '',
        stateRegistration: '',
        stateRegistrationDate: '',
        stateRegistrationUf: '',
        stateExempt: false,
        nire: '',
        otherIdentifiers: '',
        phones: '',
        website: '',
        municipalRegistration: '',
        municipalRegistrationDate: '',
        notes: '',
        tags: '',
        contacts: [],
        obligations: []
     });
     setContactDraft({ name: '', role: '', phone: '', email: '' });
  };

  const handleAddContact = () => {
    if (!contactDraft.name && !contactDraft.role && !contactDraft.phone && !contactDraft.email) {
      return;
    }
    const newContact = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()),
      ...contactDraft
    };
    setFormData({ ...formData, contacts: [...(formData.contacts || []), newContact] });
    setContactDraft({ name: '', role: '', phone: '', email: '' });
  };

  const handleRemoveContact = (index: number) => {
    const next = [...(formData.contacts || [])];
    next.splice(index, 1);
    setFormData({ ...formData, contacts: next });
  };

  const toggleObligation = (id: string) => {
    const current = formData.obligations || [];
    const exists = current.includes(id);
    const next = exists ? current.filter(item => item !== id) : [...current, id];
    setFormData({ ...formData, obligations: next });
  };

  const handleCepLookup = async () => {
    const cepDigits = onlyDigits(String(formData.addressZip || ''));
    if (cepDigits.length !== 8) return;
    setIsCepLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/cep/${cepDigits}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.erro) return;
      setFormData((prev) => ({
        ...prev,
        addressStreet: data.logradouro || prev.addressStreet || '',
        addressDistrict: data.bairro || prev.addressDistrict || '',
        addressCity: data.localidade || prev.addressCity || '',
        addressState: data.uf || prev.addressState || ''
      }));
      setTimeout(() => {
        const numberInput = document.getElementById('companyAddressNumber') as HTMLInputElement | null;
        if (numberInput) numberInput.focus();
      }, 50);
    } finally {
      setIsCepLoading(false);
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Gestao de Empresas</h2>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
             <Plus size={18} /> Nova Empresa
          </button>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm text-left">
             <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                <tr>
                   <th className="px-6 py-4">Nome</th>
                   <th className="px-6 py-4">CNPJ</th>
                   <th className="px-6 py-4">Contato</th>
                   <th className="px-6 py-4 text-right">Acoes</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {companies.map(c => (
                   <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                         <div className="p-2 bg-blue-100 text-blue-600 rounded"><Building size={16}/></div>
                         {c.name}
                      </td>
                      <td className="px-6 py-4">{c.cnpj}</td>
                      <td className="px-6 py-4">{c.contact || c.phones}</td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                         <button onClick={() => openEdit(c)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded">
                            <Edit2 size={16} />
                         </button>
                         <button onClick={() => handleDelete(c.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded">
                            <Trash2 size={16} />
                         </button>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>

       {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
             <div className="bg-white rounded-xl p-6 w-full max-w-5xl my-8 shadow-lg">
                <h3 className="text-lg font-bold mb-4">{editingId ? 'Editar Empresa' : 'Nova Empresa'}</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                   {['Dados', 'Endereco', 'Inscricoes', 'Comentarios', 'Contatos', 'Obrigacoes'].map((label, index) => (
                      <button
                         key={label}
                         type="button"
                         onClick={() => setCurrentStep(index)}
                         className={`px-3 py-1 rounded-full text-sm border ${
                           currentStep === index
                             ? 'bg-blue-600 text-white border-blue-600'
                             : 'text-slate-600 border-slate-200 hover:border-blue-400'
                         }`}
                      >
                         {label}
                      </button>
                   ))}
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                   {currentStep === 0 && (
                   <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Dados da Empresa</h4>
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700">CNPJ/CPF/CAEPF</label>
                            <input required type="text" value={formData.cnpj || ''} onChange={e => setFormData({...formData, cnpj: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                         </div>
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700">Razao Social</label>
                            <input required type="text" value={formData.legalName || ''} onChange={e => setFormData({...formData, legalName: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                         </div>
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700">Nome Fantasia</label>
                            <input type="text" value={formData.tradeName || ''} onChange={e => setFormData({...formData, tradeName: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                         </div>
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700">Regime tributario</label>
                            <select value={formData.taxRegime || 'Indefinido'} onChange={e => setFormData({...formData, taxRegime: e.target.value})} className="w-full border rounded-lg p-2 mt-1">
                               <option value="Indefinido">Indefinido</option>
                               <option value="Simples Nacional">Simples Nacional</option>
                               <option value="Lucro Presumido">Lucro Presumido</option>
                               <option value="Lucro Real">Lucro Real</option>
                               <option value="MEI">MEI</option>
                            </select>
                         </div>
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700">Grupo de empresas</label>
                            <input type="text" value={formData.companyGroup || ''} onChange={e => setFormData({...formData, companyGroup: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                         </div>
                         <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700">Ativa?</label>
                            <select value={formData.active ? 'true' : 'false'} onChange={e => setFormData({...formData, active: e.target.value === 'true'})} className="w-full border rounded-lg p-2 mt-1">
                               <option value="true">Sim</option>
                               <option value="false">Nao</option>
                            </select>
                         </div>
                         <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700">ID Empresa</label>
                            <input type="text" value={formData.companyCode || ''} onChange={e => setFormData({...formData, companyCode: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                         </div>
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700">Honorario</label>
                            <input type="text" value={formData.honorarium || ''} onChange={e => setFormData({...formData, honorarium: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                         </div>
                      </div>
                   </div>
                   )}

                   {currentStep === 1 && (
                   <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Endereco</h4>
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700">CEP</label>
                            <input
                              type="text"
                              value={formData.addressZip || ''}
                              onChange={e => setFormData({...formData, addressZip: maskCep(e.target.value)})}
                              onBlur={handleCepLookup}
                              className="w-full border rounded-lg p-2 mt-1"
                            />
                            {isCepLoading && <p className="text-xs text-slate-400 mt-1">Buscando CEP...</p>}
                         </div>
                         <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-slate-700">Endereco</label>
                            <input type="text" value={formData.addressStreet || ''} onChange={e => setFormData({...formData, addressStreet: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                         </div>
                         <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700">Numero</label>
                            <input id="companyAddressNumber" type="text" value={formData.addressNumber || ''} onChange={e => setFormData({...formData, addressNumber: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                         </div>
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700">Complemento</label>
                            <input type="text" value={formData.addressComplement || ''} onChange={e => setFormData({...formData, addressComplement: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                         </div>
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700">Bairro</label>
                            <input type="text" value={formData.addressDistrict || ''} onChange={e => setFormData({...formData, addressDistrict: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                         </div>
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700">Cidade</label>
                            <input type="text" value={formData.addressCity || ''} onChange={e => setFormData({...formData, addressCity: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                         </div>
                         <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700">UF</label>
                            <select value={formData.addressState || ''} onChange={e => setFormData({...formData, addressState: e.target.value})} className="w-full border rounded-lg p-2 mt-1">
                               <option value="">Selecione</option>
                               {UF_OPTIONS.map(uf => (
                                  <option key={uf} value={uf}>{uf}</option>
                               ))}
                            </select>
                         </div>
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700">Telefone(s)</label>
                            <input type="text" value={formData.phones || ''} onChange={e => setFormData({...formData, phones: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                         </div>
                         <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-slate-700">Website da empresa</label>
                            <input type="text" value={formData.website || ''} onChange={e => setFormData({...formData, website: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                         </div>
                      </div>
                   </div>
                   )}

                   {currentStep === 2 && (
                   <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Inscricoes</h4>
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700">Inscricao Estadual</label>
                            <input type="text" value={formData.stateRegistration || ''} onChange={e => setFormData({...formData, stateRegistration: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                         </div>
                         <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700">Data</label>
                            <input type="date" value={formData.stateRegistrationDate || ''} onChange={e => setFormData({...formData, stateRegistrationDate: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                         </div>
                         <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700">UF</label>
                            <select value={formData.stateRegistrationUf || ''} onChange={e => setFormData({...formData, stateRegistrationUf: e.target.value})} className="w-full border rounded-lg p-2 mt-1">
                               <option value="">Selecione</option>
                               {UF_OPTIONS.map(uf => (
                                  <option key={uf} value={uf}>{uf}</option>
                               ))}
                            </select>
                         </div>
                         <div className="md:col-span-2 flex items-end">
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                               <input type="checkbox" checked={!!formData.stateExempt} onChange={e => setFormData({...formData, stateExempt: e.target.checked})} className="rounded border-slate-300" />
                               Empresa isenta
                            </label>
                         </div>
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700">NIRE</label>
                            <input type="text" value={formData.nire || ''} onChange={e => setFormData({...formData, nire: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                         </div>
                         <div className="md:col-span-4">
                            <label className="block text-sm font-medium text-slate-700">Outros identificadores</label>
                            <input type="text" value={formData.otherIdentifiers || ''} onChange={e => setFormData({...formData, otherIdentifiers: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                         </div>
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700">Inscricao Municipal</label>
                            <input type="text" value={formData.municipalRegistration || ''} onChange={e => setFormData({...formData, municipalRegistration: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                         </div>
                         <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700">Data</label>
                            <input type="date" value={formData.municipalRegistrationDate || ''} onChange={e => setFormData({...formData, municipalRegistrationDate: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                         </div>
                      </div>
                   </div>
                   )}

                   {currentStep === 3 && (
                   <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Comentarios e Anotacoes</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700">Comentarios/Anotacoes gerais</label>
                            <textarea value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full border rounded-lg p-2 mt-1 min-h-[90px]" />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700">Tags da empresa</label>
                            <input type="text" value={formData.tags || ''} onChange={e => setFormData({...formData, tags: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                         </div>
                      </div>
                   </div>
                   )}

                   {currentStep === 4 && (
                   <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Contatos na empresa</h4>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                         <div className="md:col-span-2">
                            <input placeholder="Nome" type="text" value={contactDraft.name} onChange={e => setContactDraft({ ...contactDraft, name: e.target.value })} className="w-full border rounded-lg p-2" />
                         </div>
                         <div>
                            <input placeholder="Cargo" type="text" value={contactDraft.role} onChange={e => setContactDraft({ ...contactDraft, role: e.target.value })} className="w-full border rounded-lg p-2" />
                         </div>
                         <div>
                            <input placeholder="Celular" type="text" value={contactDraft.phone} onChange={e => setContactDraft({ ...contactDraft, phone: e.target.value })} className="w-full border rounded-lg p-2" />
                         </div>
                         <div>
                            <input placeholder="E-mail" type="email" value={contactDraft.email} onChange={e => setContactDraft({ ...contactDraft, email: e.target.value })} className="w-full border rounded-lg p-2" />
                         </div>
                         <div className="flex items-center">
                            <button type="button" onClick={handleAddContact} className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700">Adicionar</button>
                         </div>
                      </div>
                      {(formData.contacts || []).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                          {(formData.contacts || []).map((contact, index) => (
                            <div key={contact.id || index} className="border rounded-lg p-3 flex items-start justify-between">
                              <div className="text-sm">
                                <div className="font-semibold text-slate-800">{contact.name || 'Contato'}</div>
                                <div className="text-slate-500">{contact.role}</div>
                                <div className="text-slate-500">{contact.phone}</div>
                                <div className="text-slate-500">{contact.email}</div>
                              </div>
                              <button type="button" onClick={() => handleRemoveContact(index)} className="text-red-500 hover:text-red-700">Remover</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 mt-3">Nenhum contato adicionado.</p>
                      )}
                   </div>
                   )}

                   {currentStep === 5 && (
                   <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Obrigacoes dessa empresa</h4>
                      <div className="space-y-3">
                        {availableObligations.length === 0 ? (
                          <p className="text-sm text-slate-500">Nenhuma obrigacao cadastrada. Cadastre obrigacoes em Rotinas Mensais.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {availableObligations.map(obligation => {
                              const checked = (formData.obligations || []).includes(obligation.id);
                              return (
                                <label key={obligation.id} className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm cursor-pointer hover:border-blue-400">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleObligation(obligation.id)}
                                    className="rounded border-slate-300"
                                  />
                                  <span className="text-slate-700">{obligation.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                   </div>
                   )}

                   <div className="flex flex-wrap justify-between gap-2 pt-4 border-t">
                      <div className="flex gap-2">
                         <button
                            type="button"
                            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            disabled={currentStep === 0}
                         >
                            Voltar
                         </button>
                         <button
                            type="button"
                            onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            disabled={currentStep === 5}
                         >
                            Avancar
                         </button>
                      </div>
                      <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
                   </div>
                </form>
             </div>
          </div>
       )}
    </div>
  );
};

export default CompanyManager;
