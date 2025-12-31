import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, FileText, MessageSquare, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { User, TimeSheet, TimeEntry } from '../types';
import { getEmployees, getEmployeeTimeSheets, getTimeEntries, addTimeSheet, updateTimeSheet, addTimeEntry, getTimeComments, addTimeComment, signTimeSheet, getEmployeePayrolls, getHrAttachments, getApiUrl, getCompanies, fetchInitialData } from '../services/mockData';

interface EmployeePortalProps {
    currentUser: User;
    initialTab?: 'clock' | 'sheet' | 'holerites';
}

const createId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const formatMonthLabel = (date: Date) =>
    date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase();

const EmployeePortal: React.FC<EmployeePortalProps> = ({ currentUser, initialTab = 'clock' }) => {
    const [active, setActive] = useState<'clock' | 'sheet' | 'holerites'>(initialTab);
    const [monthCursor, setMonthCursor] = useState(new Date());
    const [timeSheet, setTimeSheet] = useState<TimeSheet | null>(null);
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [commentMessage, setCommentMessage] = useState('');
    const [clockNow, setClockNow] = useState(new Date());
    const [toast, setToast] = useState<string | null>(null);
    const [punchRows, setPunchRows] = useState<Array<{ id: string; time: string; use: string; origin: string; justification: string }>>([]);
    const [entryObservation, setEntryObservation] = useState('');
    const [dataLoaded, setDataLoaded] = useState(false);

    useEffect(() => {
        setActive(initialTab);
    }, [initialTab]);

    useEffect(() => {
        let mounted = true;
        fetchInitialData()
            .catch(() => null)
            .finally(() => {
                if (mounted) setDataLoaded(true);
            });
        return () => {
            mounted = false;
        };
    }, [currentUser.id]);

    useEffect(() => {
        const timer = setInterval(() => setClockNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 2500);
        return () => clearTimeout(timer);
    }, [toast]);

    const employee = useMemo(() => {
        const all = getEmployees(currentUser.companyId || '');
        return all.find(e => e.id === currentUser.employeeId || e.cpf === currentUser.cpf);
    }, [currentUser, dataLoaded]);
    const company = useMemo(() => {
        const all = getCompanies();
        return all.find(c => c.id === currentUser.companyId);
    }, [currentUser]);

    const periodStart = useMemo(() => new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1), [monthCursor]);
    const periodEnd = useMemo(() => new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0), [monthCursor]);
    const toLocalDateKey = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().slice(0, 10);
    const parseDateSafe = (value?: string) => {
        if (!value) return null;
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) return parsed;
        const fallback = new Date(`${value}T00:00:00`);
        return Number.isNaN(fallback.getTime()) ? null : fallback;
    };

    useEffect(() => {
        if (!employee) return;
        const list = getEmployeeTimeSheets(employee.id);
        const current = list.find(s => {
            const start = parseDateSafe(s.periodStart);
            if (!start) return false;
            return start.getFullYear() === periodStart.getFullYear() && start.getMonth() === periodStart.getMonth();
        }) || list.find(s => s.periodStart === toLocalDateKey(periodStart));
        if (current) {
            setTimeSheet(current);
            return;
        }
        const created: TimeSheet = {
            id: createId(),
            employeeId: employee.id,
            companyId: employee.companyId,
            periodStart: toLocalDateKey(periodStart),
            periodEnd: toLocalDateKey(periodEnd),
            status: 'Em Edicao',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        addTimeSheet(created).then(() => {
            setTimeSheet(created);
            setEntries([]);
        });
    }, [employee, periodStart, periodEnd]);

    useEffect(() => {
        if (!timeSheet) return;
        setEntries(getTimeEntries(timeSheet.id));
    }, [timeSheet?.id, active]);

    const canEdit = timeSheet?.status === 'Em Edicao' || timeSheet?.status === 'Pendencia';

    const days = useMemo(() => {
        const list: Date[] = [];
        const start = new Date(periodStart);
        while (start <= periodEnd) {
            list.push(new Date(start));
            start.setDate(start.getDate() + 1);
        }
        return list;
    }, [periodStart, periodEnd]);

    const findEntry = (date: Date) => {
        const key = toLocalDateKey(date);
        return entries.find(e => (e.entryDate || '').slice(0, 10) === key);
    };

    const parseEntryMeta = (value?: string) => {
        if (!value) return { justifications: {}, origins: {}, uses: {}, observation: '' };
        try {
            const parsed = JSON.parse(value);
            return {
                justifications: parsed.justifications || {},
                origins: parsed.origins || {},
                uses: parsed.uses || {},
                observation: parsed.observation || ''
            };
        } catch {
            return { justifications: {}, origins: {}, uses: {}, observation: value };
        }
    };

    const handleOpenEdit = (date: Date) => {
        const existing = findEntry(date);
        const initialEntry = existing || {
            id: createId(),
            timeSheetId: timeSheet?.id || '',
            entryDate: toLocalDateKey(date),
            punches: [],
            situations: [],
            updatedAt: new Date().toISOString()
        };
        setSelectedEntry(initialEntry);
        const meta = parseEntryMeta(initialEntry.notes);
        setEntryObservation(meta.observation || '');
        const rows = (initialEntry.punches || []).map((punch) => ({
            id: createId(),
            time: punch,
            use: meta.uses[punch] || '2 - Marcação de Ponto',
            origin: meta.origins[punch] || 'D',
            justification: meta.justifications[punch] || '1 - Esquecimento'
        }));
        setPunchRows(rows);
        setShowEditModal(true);
    };

    const handleRegisterPunch = async () => {
        if (!timeSheet || !employee) return;
        if (!canEdit) {
            alert('Folha em revisão. Aguarde a devolução para editar.');
            return;
        }
        const today = new Date();
        const entryDate = toLocalDateKey(today);
        const timeValue = today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const existing = findEntry(today);
        const punches = existing ? [...(existing.punches || [])] : [];
        if (punches.includes(timeValue)) {
            setToast('Ponto ja registrado neste minuto.');
            return;
        }
        punches.push(timeValue);
        const payload: TimeEntry = {
            id: existing?.id || createId(),
            timeSheetId: timeSheet.id,
            entryDate,
            punches,
            situations: existing?.situations || [],
            notes: existing?.notes || '',
            updatedAt: new Date().toISOString()
        };
        await addTimeEntry(payload);
        setEntries(getTimeEntries(timeSheet.id));
        setToast('Ponto registrado com sucesso.');
    };

    const recentPunches = useMemo(() => {
        const list: { key: string; label: string }[] = [];
        entries.forEach(entry => {
            const baseDate = entry.entryDate || '';
            const dateObj = parseDateSafe(baseDate) || new Date(`${baseDate}T00:00:00`);
            const dateLabel = Number.isNaN(dateObj.getTime())
                ? baseDate
                : dateObj.toLocaleDateString('pt-BR');
            (entry.punches || []).forEach((punch, idx) => {
                const key = `${entry.id}-${idx}`;
                list.push({ key, label: `${dateLabel} - ${punch}` });
            });
        });
        return list.slice(-5).reverse();
    }, [entries]);

    const buildPrintHtml = () => {
        if (!employee || !timeSheet) return '';
        const headerDate = `${new Date(timeSheet.periodStart).toLocaleDateString('pt-BR')} a ${new Date(timeSheet.periodEnd).toLocaleDateString('pt-BR')}`;
        const rows = days.map(day => {
            const entry = findEntry(day);
            const dateLabel = day.toLocaleDateString('pt-BR');
            const weekDay = day.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
            const punches = entry?.punches?.join(' ') || '';
            const situations = entry?.situations?.join(', ') || '';
            const meta = parseEntryMeta(entry?.notes);
            const notes = meta.observation || '';
            return `
                <tr>
                    <td>${dateLabel}</td>
                    <td>${weekDay}</td>
                    <td>${punches}</td>
                    <td>${situations}</td>
                    <td>${notes}</td>
                </tr>
            `;
        }).join('');
        return `
            <html>
            <head>
                <title>Espelho de Ponto</title>
                <style>
                    body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
                    h1 { font-size: 18px; margin: 0 0 8px 0; }
                    h2 { font-size: 14px; margin: 0 0 16px 0; font-weight: normal; }
                    .meta { font-size: 12px; margin-bottom: 12px; }
                    .meta strong { display: inline-block; width: 140px; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    th, td { border: 1px solid #333; padding: 4px 6px; text-align: left; }
                    th { background: #f2f2f2; }
                    .signature { margin-top: 24px; font-size: 12px; }
                </style>
            </head>
            <body>
                <h1>Cartao Ponto</h1>
                <h2>Periodo: ${headerDate}</h2>
                <div class="meta">
                    <div><strong>Empresa:</strong> ${company?.name || '-'}</div>
                    <div><strong>Empregado:</strong> ${employee.name}</div>
                    <div><strong>CPF:</strong> ${employee.cpf}</div>
                    <div><strong>Cargo:</strong> ${employee.role}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Dia</th>
                            <th>Marcacoes</th>
                            <th>Situacoes</th>
                            <th>Observacoes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
                <div class="signature">
                    <div>Assinado digitalmente em ${new Date().toLocaleString('pt-BR')}</div>
                </div>
            </body>
            </html>
        `;
    };

    const handlePrintTimesheet = () => {
        const html = buildPrintHtml();
        if (!html) return;
        const win = window.open('', '_blank');
        if (!win) {
            setToast('Permita popups para gerar o PDF.');
            return;
        }
        win.document.open();
        win.document.write(html);
        win.document.close();
        win.focus();
        win.print();
    };

    const handleSaveEntry = async (entry?: TimeEntry) => {
        const target = entry || selectedEntry;
        if (!target || !timeSheet) return;
        await addTimeEntry({ ...target, timeSheetId: timeSheet.id, updatedAt: new Date().toISOString() });
        setEntries(getTimeEntries(timeSheet.id));
        setShowEditModal(false);
    };

    const handleSendForApproval = async () => {
        if (!timeSheet) return;
        await updateTimeSheet({ ...timeSheet, status: 'Enviado', updatedAt: new Date().toISOString() });
        setTimeSheet({ ...timeSheet, status: 'Enviado' });
    };

    const handleSign = async () => {
        if (!timeSheet) return;
        await signTimeSheet(timeSheet.id);
        setTimeSheet({ ...timeSheet, status: 'Assinado', signedAt: new Date().toISOString() });
    };

    const handleAddComment = async () => {
        if (!selectedEntry || !commentMessage.trim()) return;
        await addTimeComment({
            id: createId(),
            timeEntryId: selectedEntry.id,
            authorId: currentUser.id,
            authorRole: 'employee',
            message: commentMessage.trim(),
            createdAt: new Date().toISOString()
        });
        setCommentMessage('');
    };

    const comments = selectedEntry ? getTimeComments(selectedEntry.id) : [];
    const payrolls = employee ? getEmployeePayrolls(employee.id) : [];
    const getAttachmentDownloadUrl = (id: string) => `${getApiUrl()}/hr/attachment/file/${id}`;

    if (!dataLoaded) {
        return (
            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <p className="text-sm text-slate-500">Carregando dados do funcionário...</p>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <p className="text-sm text-slate-500">Funcionário não encontrado para este acesso.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {active === 'clock' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Marcação de ponto</h2>
                            <p className="text-xs text-slate-400">Registre sua batida de ponto</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Marcar o ponto</h3>
                                <p className="text-sm text-slate-400">Olá, {employee?.name}. Registre seu ponto.</p>
                            </div>
                            <div className="text-center">
                                <div className="text-5xl font-bold text-slate-800">
                                    {clockNow.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    <span className="text-xl text-slate-400 ml-2">{clockNow.toLocaleTimeString('pt-BR', { second: '2-digit' })}</span>
                                </div>
                                <div className="text-sm text-slate-500 mt-1">
                                    {clockNow.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </div>
                                <button
                                    onClick={handleRegisterPunch}
                                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700"
                                >
                                    Registrar ponto
                                </button>
                            </div>
                        </div>
                        <div className="mt-6 border-t border-slate-100 pt-4">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Últimas batidas</p>
                            {recentPunches.length === 0 ? (
                                <p className="text-sm text-slate-400">Nenhuma batida registrada.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {recentPunches.map(item => (
                                        <span key={item.key} className="px-3 py-1 text-xs bg-slate-100 rounded-full text-slate-600">
                                            {item.label}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {active === 'sheet' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Meus acertos de ponto</h2>
                                <p className="text-xs text-slate-400">Acompanhe e ajuste suas marcações</p>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <button onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))} className="p-2 rounded hover:bg-slate-100">
                                    <ChevronLeft size={16} />
                                </button>
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} />
                                    <span className="font-semibold">{formatMonthLabel(monthCursor)}</span>
                                </div>
                                <button onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))} className="p-2 rounded hover:bg-slate-100">
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 p-5">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{employee?.name}</p>
                                    <p className="text-xs text-slate-400">{employee?.role}</p>
                                </div>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${timeSheet?.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-700' : timeSheet?.status === 'Assinado' ? 'bg-indigo-100 text-indigo-700' : timeSheet?.status === 'Enviado' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {timeSheet?.status || 'Em Edicao'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-700">Dias apurados</h3>
                                <div className="flex gap-2">
                                    {canEdit && (
                                        <button onClick={handleSendForApproval} className="bg-slate-900 text-white text-xs px-4 py-2 rounded-lg font-bold">
                                            Enviar para aprovação
                                        </button>
                                    )}
                                    {timeSheet?.status === 'Aprovado' && (
                                        <button onClick={handleSign} className="bg-emerald-600 text-white text-xs px-4 py-2 rounded-lg font-bold">
                                            Assinar folha
                                        </button>
                                    )}
                                    {timeSheet?.status === 'Assinado' && (
                                        <button onClick={handlePrintTimesheet} className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg font-bold">
                                            Gerar PDF
                                        </button>
                                    )}
                                </div>
                            </div>
                            {timeSheet?.status === 'Assinado' && (
                                <div className="mt-4 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold px-4 py-3 rounded-lg">
                                    Ponto assinado. Edição bloqueada.
                                </div>
                            )}
                            {timeSheet?.status === 'Enviado' && (
                                <div className="mt-4 bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold px-4 py-3 rounded-lg">
                                    Aguardando validação do cliente.
                                </div>
                            )}
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Data</th>
                                        <th className="px-4 py-3 text-left">Marcações</th>
                                        <th className="px-4 py-3 text-left">Situações</th>
                                        <th className="px-4 py-3 text-left">Avisos</th>
                                        <th className="px-4 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {days.map(day => {
                                        const entry = findEntry(day);
                                        return (
                                            <tr key={day.toISOString()} className="border-t">
                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-slate-800">{day.getDate().toString().padStart(2, '0')}/{(day.getMonth()+1).toString().padStart(2,'0')}</div>
                                                    <div className="text-xs text-slate-400">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {entry?.punches?.length ? (
                                                        entry.punches.join(' ')
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEdit(day)}
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            Inserir marcações
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {entry?.situations?.length ? (
                                                        entry.situations.join(', ')
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEdit(day)}
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            Inserir situação
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {!canEdit && (
                                                        <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-slate-200 text-slate-600">
                                                            Edição bloqueada
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => { setSelectedEntry(entry || null); setShowCommentModal(true); }} className="p-2 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
                                                            <MessageSquare size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenEdit(day)}
                                                            disabled={!canEdit}
                                                            className={`px-3 py-1.5 text-xs font-bold border rounded-lg flex items-center gap-1 ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        >
                                                            <Pencil size={12}/> Editar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            {active === 'holerites' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Holerites</h2>
                            <p className="text-xs text-slate-400">Folhas de pagamento mensais</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Competência</th>
                                        <th className="px-6 py-3 text-left">Status</th>
                                        <th className="px-6 py-3 text-right">Arquivo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payrolls.map(p => {
                                        const attachments = getHrAttachments('payroll', p.id);
                                        return (
                                            <tr key={p.id} className="border-t">
                                                <td className="px-6 py-3 font-bold text-slate-800">{p.competence}</td>
                                                <td className="px-6 py-3 text-slate-500">{p.status}</td>
                                                <td className="px-6 py-3 text-right">
                                                    {attachments.map(att => (
                                                        <a key={att.id} href={getAttachmentDownloadUrl(att.id)} target="_blank" className="text-blue-600 text-xs font-bold hover:underline inline-flex items-center gap-1">
                                                            <FileText size={12}/> Baixar
                                                        </a>
                                                    ))}
                                                    {attachments.length === 0 && (
                                                        <span className="text-xs text-slate-400">Sem arquivo</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {payrolls.length === 0 && (
                                        <tr><td colSpan={3} className="px-6 py-10 text-center text-slate-400 italic">Nenhum holerite disponível.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
            )}

            {toast && (
                <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg z-50">
                    {toast}
                </div>
            )}

            {showEditModal && selectedEntry && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Editar marcações</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400">X</button>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setPunchRows((prev) => [...prev, { id: createId(), time: '', use: '2 - Marcação de Ponto', origin: 'D', justification: '1 - Esquecimento' }])}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold"
                                disabled={!canEdit}
                            >
                                Adicionar
                            </button>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-50 text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Hora</th>
                                        <th className="px-3 py-2 text-left">Uso</th>
                                        <th className="px-3 py-2 text-left">Origem</th>
                                        <th className="px-3 py-2 text-left">Justificativa</th>
                                        <th className="px-3 py-2 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {punchRows.map((row) => (
                                        <tr key={row.id} className="border-t">
                                            <td className="px-3 py-2">
                                                <input
                                                    type="time"
                                                    value={row.time}
                                                    onChange={(e) => setPunchRows((prev) => prev.map(r => r.id === row.id ? { ...r, time: e.target.value } : r))}
                                                    className="border rounded px-2 py-1 text-xs w-full"
                                                    disabled={!canEdit}
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <select
                                                    value={row.use}
                                                    onChange={(e) => setPunchRows((prev) => prev.map(r => r.id === row.id ? { ...r, use: e.target.value } : r))}
                                                    className="border rounded px-2 py-1 text-xs w-full"
                                                    disabled={!canEdit}
                                                >
                                                    <option>1 - Ajuste Manual</option>
                                                    <option>2 - Marcação de Ponto</option>
                                                </select>
                                            </td>
                                            <td className="px-3 py-2">
                                                <select
                                                    value={row.origin}
                                                    onChange={(e) => setPunchRows((prev) => prev.map(r => r.id === row.id ? { ...r, origin: e.target.value } : r))}
                                                    className="border rounded px-2 py-1 text-xs w-full"
                                                    disabled={!canEdit}
                                                >
                                                    <option value="D">D</option>
                                                    <option value="E">E</option>
                                                </select>
                                            </td>
                                            <td className="px-3 py-2">
                                                <select
                                                    value={row.justification}
                                                    onChange={(e) => setPunchRows((prev) => prev.map(r => r.id === row.id ? { ...r, justification: e.target.value } : r))}
                                                    className="border rounded px-2 py-1 text-xs w-full"
                                                    disabled={!canEdit}
                                                >
                                                    <option>1 - Esquecimento</option>
                                                    <option>2 - Marcações Indevidas</option>
                                                    <option>3 - Problema no Relógio</option>
                                                    <option>4 - Falha na Sincronização</option>
                                                </select>
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => setPunchRows((prev) => prev.filter(r => r.id !== row.id))}
                                                    className="text-red-600 text-xs"
                                                    disabled={!canEdit}
                                                >
                                                    Remover
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {punchRows.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-4 text-center text-slate-400">
                                                Nenhuma marcação adicionada.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Situações</label>
                            <input
                                className="w-full border rounded-lg p-2.5 text-sm"
                                value={selectedEntry.situations.join(', ')}
                                onChange={(e) => setSelectedEntry({ ...selectedEntry, situations: e.target.value.split(',').map(v => v.trim()).filter(Boolean) })}
                                disabled={!canEdit}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observação</label>
                            <textarea
                                className="w-full border rounded-lg p-2.5 text-sm h-20"
                                value={selectedEntry.notes || ''}
                                onChange={(e) => setSelectedEntry({ ...selectedEntry, notes: e.target.value })}
                                disabled={!canEdit}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-lg text-sm font-bold">Cancelar</button>
                            <button
                                onClick={() => {
                                    const nextPunches = punchRows
                                        .map(row => row.time)
                                        .filter(Boolean)
                                        .sort((a, b) => a.localeCompare(b));
                                    const meta = {
                                        justifications: Object.fromEntries(punchRows.filter(r => r.time).map(r => [r.time, r.justification])),
                                        origins: Object.fromEntries(punchRows.filter(r => r.time).map(r => [r.time, r.origin])),
                                        uses: Object.fromEntries(punchRows.filter(r => r.time).map(r => [r.time, r.use])),
                                        observation: entryObservation || ''
                                    };
                                    const updatedEntry = { ...selectedEntry, punches: nextPunches, notes: JSON.stringify(meta) };
                                    setSelectedEntry(updatedEntry);
                                    handleSaveEntry(updatedEntry);
                                }}
                                disabled={!canEdit}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold disabled:opacity-50"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCommentModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Comentários do dia</h3>
                            <button onClick={() => setShowCommentModal(false)} className="text-slate-400">X</button>
                        </div>
                        <div className="space-y-3 max-h-72 overflow-y-auto">
                            {comments.map(c => (
                                <div key={c.id} className="border rounded-lg p-3 text-sm">
                                    <div className="text-xs text-slate-400">{c.authorRole} • {new Date(c.createdAt).toLocaleString()}</div>
                                    <div className="text-slate-700 mt-1">{c.message}</div>
                                </div>
                            ))}
                            {comments.length === 0 && <p className="text-sm text-slate-400">Nenhum comentário.</p>}
                        </div>
                        <div className="flex gap-2">
                            <input
                                className="flex-1 border rounded-lg p-2.5 text-sm"
                                placeholder="Adicionar comentário..."
                                value={commentMessage}
                                onChange={(e) => setCommentMessage(e.target.value)}
                            />
                            <button onClick={handleAddComment} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold">
                                Enviar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeePortal;
