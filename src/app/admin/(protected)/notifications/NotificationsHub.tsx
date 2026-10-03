'use client';

import { useState } from 'react';
import { 
  Bell, Send, Smartphone, Users, CheckCircle2, AlertCircle, 
  Calendar, Trophy, Shield, Clock, Sparkles, ExternalLink, 
  Loader2, Filter, Info, Radio
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

  const presets = [
    {
      label: '⚾ Convocatoria a Juego',
      title: '¡Convocatoria Oficial de Juego! ⚾',
      body: 'Revisa tu horario, uniforme y campo asignado en el calendario oficial de la liga.',
      url: '/calendario',
    },
    {
      label: '💳 Recordatorio de Cuota',
      title: 'Recordatorio de Mensualidad 💳',
      body: 'Recuerda reportar tu pago para mantener tu solvencia activa y estar habilitado para jugar.',
      url: '/portal/dashboard/pagos',
    },
    {
      label: '🏆 Felicitación de Victoria',
      title: '¡Victoria de KsaSport! 🏆',
      body: 'Felicitaciones a todas las atletas y cuerpo técnico por su gran desempeño en el terreno de juego.',
      url: '/portal/dashboard',
    },
    {
      label: '⚠️ Suspensión por Lluvia',
      title: 'Aviso Importante: Jornada Reprogramada ⚠️',
      body: 'Por condiciones climáticas los encuentros quedan suspendidos hasta nuevo aviso.',
      url: '/calendario',
    },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setTitle(p.title);
    setBody(p.body);
    setUrl(p.url);
    toast.info('Plantilla cargada en el formulario.');
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

  return (
    <div className="space-y-8 w-full max-w-full min-w-0">
      
      {/* 1. CABECERA & INTRODUCCIÓN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-red-50 text-kasa-vinotinto text-xs font-black uppercase tracking-wider border border-red-200/80 shadow-2xs flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              Web Push API & PWA
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1.5">
            Centro de Notificaciones Push
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Envía alertas instantáneas a la pantalla de los teléfonos de atletas, delegados y staff técnico.
          </p>
        </div>
      </div>

      {/* 2. TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dispositivos Conectados</p>
            <p className="text-2xl font-black text-gray-900">{subscriberCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Navegadores y teléfonos suscritos</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-kasa-vinotinto flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Atletas con Push Activo</p>
            <p className="text-2xl font-black text-gray-900">{athleteSubscriberCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Vinculados a su expediente deportivo</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alertas Emitidas</p>
            <p className="text-2xl font-black text-gray-900">{totalSentCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Historial acumulado de envíos</p>
          </div>
        </div>
      </div>

      {/* 3. PLANTILLAS RÁPIDAS (1 Clic) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-kasa-dorado" />
          Plantillas Rápidas con 1 Clic
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="text-left p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 transition-all cursor-pointer group hover:border-kasa-vinotinto/30"
            >
              <p className="text-xs font-black text-gray-800 group-hover:text-kasa-vinotinto transition-colors">
                {p.label}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                {p.body}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* 4. ÁREA PRINCIPAL: FORMULARIO Y VISTA PREVIA DEL SMARTPHONE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Formulario (2 Columnas) */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-kasa-vinotinto" />
            Redactar Nueva Notificación
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Título */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Título del Mensaje
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. ¡Juego confirmado este sábado a las 9:00 AM! ⚾"
                maxLength={80}
                required
                className="w-full px-4 py-3 bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-kasa-vinotinto/20 focus:border-kasa-vinotinto transition-all shadow-inner"
              />
              <span className="text-[10px] text-slate-400 font-bold block text-right mt-1">
                {title.length}/80 caracteres
              </span>
            </div>

            {/* Mensaje */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Cuerpo del Mensaje (Texto en pantalla)
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Escribe el mensaje claro y conciso que leerá el usuario en su teléfono..."
                rows={3}
                maxLength={200}
                required
                className="w-full px-4 py-3 bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-kasa-vinotinto/20 focus:border-kasa-vinotinto transition-all shadow-inner resize-none"
              />
              <span className="text-[10px] text-slate-400 font-bold block text-right mt-1">
                {body.length}/200 caracteres
              </span>
            </div>

            {/* URL Destino */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Enlace al pulsar la notificación
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="/portal/dashboard o /calendario"
                  className="flex-1 px-4 py-2.5 bg-slate-50 focus:bg-white rounded-2xl border border-slate-200 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-kasa-vinotinto/20 focus:border-kasa-vinotinto transition-all shadow-inner"
                />
                <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setUrl('/portal/dashboard')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-bold text-slate-700 shrink-0"
                  >
                    Portal
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrl('/calendario')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-bold text-slate-700 shrink-0"
                  >
                    Calendario
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrl('/portal/dashboard/pagos')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-bold text-slate-700 shrink-0"
                  >
                    Pagos
                  </button>
                </div>
              </div>
            </div>

            {/* Segmentación de Destinatarios */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                Segmentación de Destinatarios
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => { setTargetType('all'); setTargetFilter(''); }}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                    targetType === 'all'
                      ? 'bg-kasa-vinotinto text-white border-kasa-vinotinto shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  📢 A Todos
                </button>
                <button
                  type="button"
                  onClick={() => { setTargetType('team'); setTargetFilter(teams[0]?.id || ''); }}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                    targetType === 'team'
                      ? 'bg-kasa-vinotinto text-white border-kasa-vinotinto shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🏆 Por Equipo
                </button>
                <button
                  type="button"
                  onClick={() => { setTargetType('status'); setTargetFilter('Moroso'); }}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                    targetType === 'status'
                      ? 'bg-kasa-vinotinto text-white border-kasa-vinotinto shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  💳 Por Solvencia
                </button>
                <button
                  type="button"
                  onClick={() => { setTargetType('athlete'); setTargetFilter(athletes[0]?.id || ''); }}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                    targetType === 'athlete'
                      ? 'bg-kasa-vinotinto text-white border-kasa-vinotinto shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  👤 Atleta
                </button>
              </div>

              {/* Selector dinámico según segmento */}
              {targetType === 'team' && (
                <div className="pt-2">
                  <select
                    value={targetFilter}
                    onChange={(e) => setTargetFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white text-xs font-bold rounded-xl border border-slate-200 text-gray-900"
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
                <div className="pt-2">
                  <select
                    value={targetFilter}
                    onChange={(e) => setTargetFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white text-xs font-bold rounded-xl border border-slate-200 text-gray-900"
                  >
                    <option value="Moroso">🔴 Atletas Morosos (Recordatorio de Cobro)</option>
                    <option value="Solvente">🟢 Atletas Solventes (Al día)</option>
                    <option value="Inactivo">⚫ Atletas Inactivos</option>
                  </select>
                </div>
              )}

              {targetType === 'athlete' && (
                <div className="pt-2">
                  <select
                    value={targetFilter}
                    onChange={(e) => setTargetFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white text-xs font-bold rounded-xl border border-slate-200 text-gray-900"
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
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-kasa-vinotinto via-red-900 to-red-950 hover:from-red-900 hover:to-black text-white font-black text-sm transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Transmitiendo a los dispositivos...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 text-kasa-dorado" />
                  <span>Enviar Notificación Push Ahora</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Simulador de Smartphone (Live Preview) */}
        <div className="bg-gradient-to-b from-slate-900 to-black p-6 rounded-[40px] border-4 border-slate-700 shadow-2xl text-white relative">
          <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-6" />

          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center mb-4">
            Vista Previa en Celular
          </p>

          {/* Tarjeta de Notificación Estilo iOS / Android */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-lg text-white space-y-2">
            <div className="flex items-center justify-between text-[11px] text-white/70">
              <div className="flex items-center gap-1.5 font-bold">
                <div className="w-4 h-4 rounded-md bg-kasa-vinotinto flex items-center justify-center text-[8px] font-black text-kasa-dorado">
                  KS
                </div>
                <span>KASA SPORTS</span>
              </div>
              <span>ahora</span>
            </div>

            <div className="pt-0.5">
              <h4 className="text-xs font-black text-white leading-tight">
                {title.trim() || 'Título de la notificación'}
              </h4>
              <p className="text-[11px] text-white/80 mt-1 leading-relaxed">
                {body.trim() || 'Aquí aparecerá el cuerpo del mensaje en la pantalla del teléfono del usuario.'}
              </p>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[10px] font-bold text-kasa-dorado">
              <span>Destino: {url || '/portal'}</span>
              <span className="bg-white/10 px-2 py-0.5 rounded-md">Abrir</span>
            </div>
          </div>

          <div className="mt-8 text-center text-slate-500 text-[11px]">
            <p>Se emite a través de Web Push API compatible con Android, iPhone (PWA) y navegadores modernos.</p>
          </div>
        </div>

      </div>

      {/* 5. HISTORIAL DE NOTIFICACIONES ENVIADAS */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Historial de Notificaciones Emitidas
          </h3>
          <span className="text-xs font-bold text-slate-400">
            {logs.length} envíos registrados
          </span>
        </div>

        {logs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-900 truncate">
                      {log.title}
                    </h4>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {log.target_type === 'all' ? '📢 Todos' : log.target_type === 'team' ? '🏆 Equipo' : log.target_type === 'status' ? '💳 Estatus' : '👤 Atleta'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {log.body}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                    <span>{formatLocalDate(log.created_at, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    <span>•</span>
                    <span>Enviado por: {log.created_by || 'Admin'}</span>
                    {log.url && (
                      <>
                        <span>•</span>
                        <span className="text-kasa-vinotinto font-medium">{log.url}</span>
                      </>
                    )}
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {log.sent_count} {log.sent_count === 1 ? 'dispositivo' : 'dispositivos'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-slate-400 text-xs">
            <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            Aún no se han enviado notificaciones push desde este panel.
          </div>
        )}
      </div>

    </div>
  );
}
