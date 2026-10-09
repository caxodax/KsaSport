'use client';

import { useState, useMemo } from 'react';
import { 
  Bell, Send, Smartphone, Users, CheckCircle2, AlertCircle, 
  Clock, Sparkles, ExternalLink, Loader2, Filter, Search, 
  RotateCcw, ChevronLeft, ChevronRight, Eye, EyeOff, Radio
} from 'lucide-react';
import { sendAdminBroadcast } from './actions';
import { formatLocalDate } from '@/lib/dateUtils';
import { toast } from 'sonner';

interface TeamOption {
  id: string;
  name: string;
  category?: string;
}

interface AthleteOption {
  id: string;
  name: string;
  cedula: string;
}

interface NotificationLog {
  id: string;
  title: string;
  body: string;
  url?: string;
  target_type: string;
  target_filter?: string | null;
  sent_count: number;
  created_by?: string | null;
  created_at: string;
}

interface NotificationsHubProps {
  subscriberCount: number;
  athleteSubscriberCount: number;
  totalSentCount: number;
  teams: TeamOption[];
  athletes: AthleteOption[];
  logs: NotificationLog[];
}

export default function NotificationsHub({
  subscriberCount,
  athleteSubscriberCount,
  totalSentCount,
  teams,
  athletes,
  logs,
}: NotificationsHubProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/portal/dashboard');
  const [targetType, setTargetType] = useState<'all' | 'team' | 'status' | 'athlete'>('all');
  const [targetFilter, setTargetFilter] = useState('');
  const [sending, setSending] = useState(false);

  // Estados de vista y filtros del historial
  const [logSearch, setLogSearch] = useState('');
  const [logFilterType, setLogFilterType] = useState('all');
  const [logPage, setLogPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  const presets = [
    {
      id: 'convocatoria',
      label: 'Convocatoria a Juego',
      icon: '⚾',
      title: '¡Convocatoria Oficial de Juego! ⚾',
      body: 'Revisa tu horario, uniforme y campo asignado en el calendario oficial de la liga.',
      url: '/calendario',
    },
    {
      id: 'cuota',
      label: 'Recordatorio de Cuota',
      icon: '💳',
      title: 'Recordatorio de Mensualidad 💳',
      body: 'Recuerda reportar tu pago para mantener tu solvencia activa y estar habilitado para jugar.',
      url: '/portal/dashboard/pagos',
    },
    {
      id: 'victoria',
      label: 'Felicitación de Victoria',
      icon: '🏆',
      title: '¡Victoria de KsaSport! 🏆',
      body: 'Felicitaciones a todas las atletas y cuerpo técnico por su gran desempeño en el terreno de juego.',
      url: '/portal/dashboard',
    },
    {
      id: 'lluvia',
      label: 'Suspensión por Lluvia',
      icon: '⚠️',
      title: 'Aviso Importante: Jornada Reprogramada ⚠️',
      body: 'Por condiciones climáticas los encuentros quedan suspendidos hasta nuevo aviso.',
      url: '/calendario',
    },
  ];

  const quickUrls = [
    { label: 'Portal', path: '/portal/dashboard' },
    { label: 'Calendario', path: '/calendario' },
    { label: 'Pagos', path: '/portal/dashboard/pagos' },
    { label: 'Cantina', path: '/portal/dashboard/cantina' },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setTitle(p.title);
    setBody(p.body);
    setUrl(p.url);
    toast.info(`Plantilla "${p.label}" cargada en el formulario.`);
  };

  const handleReuseLog = (log: NotificationLog) => {
    setTitle(log.title);
    setBody(log.body);
    if (log.url) setUrl(log.url);
    if (['all', 'team', 'status', 'athlete'].includes(log.target_type)) {
      setTargetType(log.target_type as 'all' | 'team' | 'status' | 'athlete');
      if (log.target_filter) {
        setTargetFilter(log.target_filter);
      } else if (log.target_type === 'team') {
        setTargetFilter(teams[0]?.id || '');
      } else if (log.target_type === 'status') {
        setTargetFilter('Moroso');
      } else if (log.target_type === 'athlete') {
        setTargetFilter(athletes[0]?.id || '');
      }
    }
    toast.success('Notificación anterior cargada en el formulario.');
    document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Completa el título y el mensaje antes de enviar.');
      return;
    }

    if ((targetType === 'team' || targetType === 'status' || targetType === 'athlete') && !targetFilter) {
      toast.error('Debes seleccionar un destinatario o filtro específico.');
      return;
    }

    setSending(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('body', body.trim());
      formData.append('url', url.trim());
      formData.append('targetType', targetType);
      if (targetFilter) formData.append('targetFilter', targetFilter);

      const res = await sendAdminBroadcast(formData);

      if ('error' in res && res.error) {
        toast.error(res.error);
      } else if ('sentCount' in res) {
        toast.success(`¡Notificación enviada con éxito a ${res.sentCount} dispositivo(s)!`);
        setTitle('');
        setBody('');
        setTargetFilter('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al emitir la notificación.');
    } finally {
      setSending(false);
    }
  };

  // Filtrado y búsqueda reactiva de historial
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const query = logSearch.toLowerCase().trim();
      const matchesSearch = !query || 
        log.title.toLowerCase().includes(query) ||
        log.body.toLowerCase().includes(query) ||
        (log.created_by && log.created_by.toLowerCase().includes(query));
      
      const matchesType = logFilterType === 'all' || log.target_type === logFilterType;
      return matchesSearch && matchesType;
    });
  }, [logs, logSearch, logFilterType]);

  // Cálculos de paginación
  const totalLogPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const currentPageClamped = Math.min(Math.max(logPage, 1), totalLogPages);
  const startIndex = (currentPageClamped - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredLogs.length);
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      
      {/* 1. CABECERA EJECUTIVA Y ESTADO */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-kasa-vinotinto text-[11px] font-black uppercase tracking-wider border border-red-200/80 shadow-2xs flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              Web Push API & PWA
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Servicio Activo
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-1">
            Centro de Notificaciones Push
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Envía alertas instantáneas a la pantalla de los teléfonos de atletas, delegados y staff técnico.
          </p>
        </div>

        {/* Acceso a previsualizador en móvil */}
        <div className="flex sm:hidden">
          <button
            type="button"
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {showMobilePreview ? (
              <>
                <EyeOff className="w-4 h-4 text-slate-500" />
                <span>Ocultar vista previa en celular</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-kasa-vinotinto" />
                <span>Ver vista previa en celular</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. TARJETAS DE MÉTRICAS (KPIS EQUILIBRADOS 1:1:1) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Dispositivos Conectados</p>
            <p className="text-2xl font-black text-gray-900 tabular-nums">{subscriberCount}</p>
            <p className="text-[11px] text-slate-500 truncate">Navegadores y teléfonos activos</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 text-kasa-vinotinto flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Atletas con Push</p>
            <p className="text-2xl font-black text-gray-900 tabular-nums">{athleteSubscriberCount}</p>
            <p className="text-[11px] text-slate-500 truncate">Vinculados a su expediente</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Alertas Emitidas</p>
            <p className="text-2xl font-black text-gray-900 tabular-nums">{totalSentCount}</p>
            <p className="text-[11px] text-slate-500 truncate">Historial total de transmisiones</p>
          </div>
        </div>
      </div>

      {/* 3. ÁREA DE EMISIÓN: FORMULARIO Y VISTA PREVIA */}
      <div id="form-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Formulario de Redacción (8 columnas en desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
          
          {/* Cabecera del formulario con Plantillas Rápidas compactas */}
          <div className="space-y-3 pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-kasa-vinotinto" />
                Redactar Mensaje Push
              </h3>
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-kasa-dorado" />
                Cargar plantilla con 1 clic:
              </span>
            </div>

            {/* Pills de Plantillas Rápidas */}
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-kasa-vinotinto text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer hover:border-kasa-vinotinto/40 active:scale-95"
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Título */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Título del Mensaje
                </label>
                <span className={`text-[10px] font-bold ${title.length > 70 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {title.length}/80 caracteres
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. ¡Juego confirmado este sábado a las 9:00 AM! ⚾"
                maxLength={80}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-kasa-vinotinto/20 focus:border-kasa-vinotinto transition-all shadow-2xs"
              />
            </div>

            {/* Cuerpo del Mensaje */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Cuerpo del Mensaje (Texto en pantalla)
                </label>
                <span className={`text-[10px] font-bold ${body.length > 180 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {body.length}/200 caracteres
                </span>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Escribe el mensaje claro y conciso que leerá el usuario en la notificación de su teléfono..."
                rows={3}
                maxLength={200}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-kasa-vinotinto/20 focus:border-kasa-vinotinto transition-all shadow-2xs resize-none"
              />
            </div>

            {/* Enlace Destino */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Enlace al pulsar la notificación
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="/portal/dashboard o /calendario"
                  className="flex-1 px-3.5 py-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-kasa-vinotinto/20 focus:border-kasa-vinotinto transition-all shadow-2xs"
                />
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {quickUrls.map((qu) => {
                    const isActive = url === qu.path;
                    return (
                      <button
                        key={qu.path}
                        type="button"
                        onClick={() => setUrl(qu.path)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-kasa-vinotinto text-white shadow-2xs' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {qu.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Segmentación de Destinatarios */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                Segmentación de Destinatarios
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => { setTargetType('all'); setTargetFilter(''); }}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    targetType === 'all'
                      ? 'bg-kasa-vinotinto text-white border-kasa-vinotinto shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  📢 A Todos
                </button>
                <button
                  type="button"
                  onClick={() => { setTargetType('team'); setTargetFilter(teams[0]?.id || ''); }}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    targetType === 'team'
                      ? 'bg-kasa-vinotinto text-white border-kasa-vinotinto shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🏆 Por Equipo
                </button>
                <button
                  type="button"
                  onClick={() => { setTargetType('status'); setTargetFilter('Moroso'); }}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    targetType === 'status'
                      ? 'bg-kasa-vinotinto text-white border-kasa-vinotinto shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  💳 Por Solvencia
                </button>
                <button
                  type="button"
                  onClick={() => { setTargetType('athlete'); setTargetFilter(athletes[0]?.id || ''); }}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    targetType === 'athlete'
                      ? 'bg-kasa-vinotinto text-white border-kasa-vinotinto shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  👤 Atleta
                </button>
              </div>

              {/* Selector dinámico según segmento */}
              {targetType === 'team' && (
                <div className="pt-1">
                  <select
                    value={targetFilter}
                    onChange={(e) => setTargetFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-xs font-bold rounded-xl border border-slate-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-kasa-vinotinto/20"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.category ? `(${t.category})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetType === 'status' && (
                <div className="pt-1">
                  <select
                    value={targetFilter}
                    onChange={(e) => setTargetFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-xs font-bold rounded-xl border border-slate-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-kasa-vinotinto/20"
                  >
                    <option value="Moroso">🔴 Atletas Morosos (Recordatorio de Cobro)</option>
                    <option value="Solvente">🟢 Atletas Solventes (Al día)</option>
                    <option value="Inactivo">⚫ Atletas Inactivos</option>
                  </select>
                </div>
              )}

              {targetType === 'athlete' && (
                <div className="pt-1">
                  <select
                    value={targetFilter}
                    onChange={(e) => setTargetFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-xs font-bold rounded-xl border border-slate-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-kasa-vinotinto/20"
                  >
                    {athletes.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (C.I: {a.cedula})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={sending}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-kasa-vinotinto via-red-900 to-red-950 hover:from-red-900 hover:to-black text-white font-black text-sm transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transmitiendo a los dispositivos...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-kasa-dorado" />
                  <span>Emitir Notificación Push Ahora</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Vista Previa en Vivo (Estilo Push Card Elegante) */}
        <div className={`lg:col-span-5 xl:col-span-4 space-y-3 ${showMobilePreview ? 'block' : 'hidden sm:block'}`}>
          <div className="bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl text-white space-y-4">
            
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-kasa-dorado" />
                Vista Previa en Celular
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Banner / Lockscreen
              </span>
            </div>

            {/* Tarjeta de Push Notification en Teléfono */}
            <div className="bg-slate-800/95 backdrop-blur-md border border-slate-700/90 rounded-2xl p-4 shadow-lg text-white space-y-2.5 transition-all">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-md bg-kasa-vinotinto flex items-center justify-center text-[8px] font-black text-kasa-dorado shrink-0">
                    KS
                  </div>
                  <span className="font-bold tracking-wide text-slate-200">KASA SPORTS</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">ahora</span>
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-black text-white leading-tight">
                  {title.trim() || 'Título de la notificación'}
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-1 leading-relaxed">
                  {body.trim() || 'Aquí aparecerá el cuerpo del mensaje que se desplegará instantáneamente en el teléfono.'}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1 text-kasa-dorado font-bold truncate max-w-[190px]">
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{url || '/portal/dashboard'}</span>
                </div>
                <span className="px-2.5 py-1 bg-white/10 rounded-lg text-slate-200 font-bold text-[10px] shrink-0">
                  Abrir
                </span>
              </div>
            </div>

            {/* Compatibilidad y feedback */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>Android · iPhone (PWA) · Web</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3 h-3" /> Compatible
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. HISTORIAL DE NOTIFICACIONES CON BÚSQUEDA Y PAGINACIÓN COMPLETA */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        
        {/* Cabecera del Historial */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Historial de Notificaciones Emitidas
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Registro auditable de alertas enviadas a través del Web Push Service.
            </p>
          </div>

          <span className="self-start md:self-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold tabular-nums">
            {filteredLogs.length} {filteredLogs.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {/* Barra de Herramientas: Búsqueda, Filtro y Selector de Página */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 flex-1 max-w-xl">
            {/* Buscador */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => {
                  setLogSearch(e.target.value);
                  setLogPage(1);
                }}
                placeholder="Buscar por título o contenido..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-kasa-vinotinto/20 text-gray-900"
              />
            </div>

            {/* Filtro por Audiencia */}
            <div className="shrink-0">
              <select
                value={logFilterType}
                onChange={(e) => {
                  setLogFilterType(e.target.value);
                  setLogPage(1);
                }}
                className="w-full sm:w-auto px-3 py-2 bg-slate-50 focus:bg-white text-xs font-bold rounded-xl border border-slate-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-kasa-vinotinto/20"
              >
                <option value="all">Todas las audiencias</option>
                <option value="all_target">📢 A Todos</option>
                <option value="team">🏆 Por Equipo</option>
                <option value="status">💳 Por Solvencia</option>
                <option value="athlete">👤 Por Atleta</option>
              </select>
            </div>
          </div>

          {/* Selector de Tamaño de Página */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-[11px] text-slate-400 font-bold">Mostrar:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setLogPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 text-xs font-bold rounded-xl border border-slate-200 text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value={5}>5 por página</option>
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
            </select>
          </div>
        </div>

        {/* Lista de Registros */}
        {paginatedLogs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {paginatedLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-900 truncate">
                      {log.title}
                    </h4>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {log.target_type === 'all' 
                        ? '📢 Todos' 
                        : log.target_type === 'team' 
                        ? '🏆 Equipo' 
                        : log.target_type === 'status' 
                        ? '💳 Estatus' 
                        : '👤 Atleta'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {log.body}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pt-0.5 font-medium">
                    <span>{formatLocalDate(log.created_at, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span>Por: {log.created_by || 'Admin'}</span>
                    {log.url && (
                      <>
                        <span>•</span>
                        <span className="text-kasa-vinotinto font-semibold">{log.url}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Acciones y Conteo */}
                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black tabular-nums">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {log.sent_count} {log.sent_count === 1 ? 'dispositivo' : 'dispositivos'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleReuseLog(log)}
                    title="Cargar esta notificación en el formulario para reenviar"
                    className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-500" />
                    <span>Reutilizar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Bell className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-gray-700">No se encontraron notificaciones emitidas</p>
            <p className="text-[11px] text-slate-400">
              {logSearch || logFilterType !== 'all' 
                ? 'Prueba modificando los filtros de búsqueda o audiencia.' 
                : 'Aún no se han transmitido alertas push desde este panel.'}
            </p>
          </div>
        )}

        {/* BARRA DE PAGINACIÓN COMPLETA */}
        {filteredLogs.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500 font-semibold tabular-nums">
              Mostrando <span className="font-black text-gray-900">{startIndex + 1}</span> a <span className="font-black text-gray-900">{endIndex}</span> de <span className="font-black text-gray-900">{filteredLogs.length}</span> notificaciones
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                disabled={currentPageClamped <= 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>

              <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-gray-800 shadow-2xs tabular-nums">
                Pág. {currentPageClamped} / {totalLogPages}
              </div>

              <button
                type="button"
                onClick={() => setLogPage((p) => Math.min(totalLogPages, p + 1))}
                disabled={currentPageClamped >= totalLogPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
