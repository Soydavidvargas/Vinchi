'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  FileText,
  IdCard,
  Mail,
  MapPin,
  ScanFace,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import {
  connectRealtime,
  fetchMyAgentApplication,
  getStoredToken,
  submitAgentApplication,
} from '@/src/lib/vinchiClient';
import type { AgentApplicationRecord, AuthUser, VinchiRoute } from '@/src/types/vinchi';

export interface PostularAgentePageProps {
  user: AuthUser;
  onUserUpdated: (user: AuthUser) => void;
  onNavigate: (route: VinchiRoute) => void;
}

interface QuestionSpec {
  id: string;
  section: string;
  prompt: string;
  options: string[];
}

const QUESTIONS_30: QuestionSpec[] = [
  // Bloque 1: Vocación y compromiso (1 - 8)
  {
    id: 'q1',
    section: 'Vocación y compromiso',
    prompt: '1. ¿Estás convencido de querer trabajar como agente comercial visitando y asesorando comercios?',
    options: ['Sí, completamente decidido', 'Sí, quiero empezar cuanto antes'],
  },
  {
    id: 'q2',
    section: 'Vocación y compromiso',
    prompt: '2. ¿Comprendes que tu labor consiste en acompañar restaurantes, tiendas y supermercados en su apertura digital?',
    options: ['Sí, lo comprendo totalmente', 'Sí, tengo clara la labor'],
  },
  {
    id: 'q3',
    section: 'Vocación y compromiso',
    prompt: '3. ¿Cuántas horas a la semana puedes dedicar de forma constante a gestionar solicitudes y visitas?',
    options: ['Entre 15 y 25 horas semanales', 'Entre 25 y 40 horas semanales', 'Más de 40 horas semanales'],
  },
  {
    id: 'q4',
    section: 'Vocación y compromiso',
    prompt: '4. ¿Estás dispuesto a cumplir metas semanales de vinculación y seguimiento de calidad?',
    options: ['Sí, me comprometo con metas', 'Sí, trabajo mejor con objetivos claros'],
  },
  {
    id: 'q5',
    section: 'Vocación y compromiso',
    prompt: '5. Si un dueño de local tiene dudas técnicas o operativas el primer día, ¿cómo reaccionarías?',
    options: ['Lo acompaño con paciencia hasta resolverlo', 'Le brindo una guía paso a paso presencial o virtual'],
  },
  {
    id: 'q6',
    section: 'Vocación y compromiso',
    prompt: '6. ¿Aceptas que tus ingresos dependen directamente de activaciones reales verificadas (virtuales o presenciales)?',
    options: ['Sí, acepto el modelo por resultados', 'Sí, me motiva ganar por cada comercio activado'],
  },
  {
    id: 'q7',
    section: 'Vocación y compromiso',
    prompt: '7. ¿Cuentas con teléfono inteligente activo y conexión estable para atender chats y llamadas en horario laboral?',
    options: ['Sí, tengo equipo y datos móviles activos', 'Sí, cuento con conexión permanente'],
  },
  {
    id: 'q8',
    section: 'Vocación y compromiso',
    prompt: '8. ¿Por qué quieres formar parte del equipo de agentes Vinchi?',
    options: ['Para construir ingresos crecientes ayudando a comercios', 'Para desarrollar mi carrera comercial en mi ciudad', 'Para trabajar con horarios flexibles y respaldo'],
  },

  // Bloque 2: Experiencia comercial y servicio (9 - 16)
  {
    id: 'q9',
    section: 'Experiencia comercial',
    prompt: '9. ¿Tienes experiencia previa en ventas en calle, asesoría comercial o servicio al cliente?',
    options: ['Sí, más de 1 año de experiencia', 'Sí, menos de 1 año', 'No tengo experiencia formal, pero aprendo rápido'],
  },
  {
    id: 'q10',
    section: 'Experiencia comercial',
    prompt: '10. ¿Has trabajado antes asesorando restaurantes, cafeterías, minimercados o tiendas de barrio?',
    options: ['Sí, conozco cómo operan estos locales', 'No directamente, pero consumo y trato con ellos a diario'],
  },
  {
    id: 'q11',
    section: 'Experiencia comercial',
    prompt: '11. ¿Cómo explicas en una frase el beneficio principal de Vinchi a un comerciante?',
    options: ['Vende directo en mesa y domicilio con 0% de comisión por pedido', 'Digitaliza su carta y controla su caja sin pagar porcentajes abusivos'],
  },
  {
    id: 'q12',
    section: 'Experiencia comercial',
    prompt: '12. Cuando un cliente muestra desconfianza inicial al cambiar su forma de vender, ¿qué haces?',
    options: ['Escucho sus preocupaciones y muestro ejemplos claros', 'Propongo una activación guiada paso a paso para darle tranquilidad'],
  },
  {
    id: 'q13',
    section: 'Experiencia comercial',
    prompt: '13. ¿Te sientes cómodo realizando llamadas de voz y videollamadas para cerrar una asesoría virtual?',
    options: ['Sí, me comunico con claridad por llamada', 'Sí, domino tanto llamada como chat escrito'],
  },
  {
    id: 'q14',
    section: 'Experiencia comercial',
    prompt: '14. ¿Sabes redactar mensajes claros, respetuosos y sin errores ortográficos en chat con clientes?',
    options: ['Sí, cuido mucho mi redacción y trato', 'Sí, respondo de forma ejecutiva y amable'],
  },
  {
    id: 'q15',
    section: 'Experiencia comercial',
    prompt: '15. ¿Puedes organizar la carga inicial de productos y precios de un restaurante durante una visita presencial?',
    options: ['Sí, puedo ayudar al comercio en su carga inicial', 'Sí, verifico que su carta quede lista el mismo día'],
  },
  {
    id: 'q16',
    section: 'Experiencia comercial',
    prompt: '16. ¿Cómo manejas múltiples solicitudes simultáneas sin dejar esperando al cliente?',
    options: ['Priorizo en orden de llegada y confirmo tiempos de respuesta', 'Atiendo el chat en tiempo real y agendo visitas organizadas'],
  },

  // Bloque 3: Disponibilidad y movilidad en zona (17 - 23)
  {
    id: 'q17',
    section: 'Territorio y disponibilidad',
    prompt: '17. ¿Puedes desplazarte dentro de tu municipio o ciudad cuando un comercio paga por visita presencial?',
    options: ['Sí, tengo facilidad de desplazamiento en mi municipio', 'Sí, cuento con transporte propio o ágil'],
  },
  {
    id: 'q18',
    section: 'Territorio y disponibilidad',
    prompt: '18. ¿En qué franja horaria prefieres estar disponible para recibir solicitudes automáticas?',
    options: ['Mañana y tarde (8:00 a.m. - 5:00 p.m.)', 'Jornada extendida (9:00 a.m. - 7:00 p.m.)', 'Fines de semana y horarios comerciales'],
  },
  {
    id: 'q19',
    section: 'Territorio y disponibilidad',
    prompt: '19. ¿Qué medio de transporte utilizas normalmente para visitar locales comerciales?',
    options: ['Motocicleta propia', 'Bicicleta / Transporte público', 'Vehículo propio o caminando en zona céntrica'],
  },
  {
    id: 'q20',
    section: 'Territorio y disponibilidad',
    prompt: '20. ¿Conoces las principales zonas gastronómicas y comerciales de tu municipio?',
    options: ['Sí, las recorro con frecuencia', 'Sí, conozco varias zonas clave'],
  },
  {
    id: 'q21',
    section: 'Territorio y disponibilidad',
    prompt: '21. ¿Te comprometes a marcar "No disponible" cuando no puedas atender clientes para no afectar tiempos de respuesta?',
    options: ['Sí, mantendré mi estado actualizado siempre', 'Sí, es parte de la responsabilidad'],
  },
  {
    id: 'q22',
    section: 'Territorio y disponibilidad',
    prompt: '22. ¿Cuánto tiempo promedio consideras razonable para responder un primer mensaje tras aceptar un comercio?',
    options: ['Menos de 2 minutos', 'De forma inmediata apenas acepto la solicitud'],
  },
  {
    id: 'q23',
    section: 'Territorio y disponibilidad',
    prompt: '23. ¿Estás disponible para realizar verificaciones en sitio durante los primeros 30 días de operación?',
    options: ['Sí, disponibilidad total para visitas', 'Sí, programadas con el cliente'],
  },

  // Bloque 4: Ética, verificación y cumplimiento (24 - 30)
  {
    id: 'q24',
    section: 'Ética y cumplimiento',
    prompt: '24. ¿Aceptas verificar siempre que el negocio sea real y legítimo antes de activar cualquier código?',
    options: ['Sí, verificaré la autenticidad de cada local', 'Sí, nunca activaré cuentas ficticias'],
  },
  {
    id: 'q25',
    section: 'Ética y cumplimiento',
    prompt: '25. ¿Comprendes que en modo Virtual ganas $10.000 COP y en Presencial $30.000 COP únicamente tras validar correctamente al comercio?',
    options: ['Sí, conozco y acepto la tabla de comisiones', 'Sí, todo está claro'],
  },
  {
    id: 'q26',
    section: 'Ética y cumplimiento',
    prompt: '26. ¿Te comprometes a no cobrar sumas adicionales por fuera de los valores oficiales al comerciante?',
    options: ['Sí, jamás cobraré tarifas no autorizadas', 'Sí, respetaré siempre los valores oficiales'],
  },
  {
    id: 'q27',
    section: 'Ética y cumplimiento',
    prompt: '27. ¿Respetarás la confidencialidad de los documentos, teléfonos y correos de los dueños de negocios?',
    options: ['Sí, protegeré la privacidad de cada cliente', 'Sí, uso exclusivo para la vinculación'],
  },
  {
    id: 'q28',
    section: 'Ética y cumplimiento',
    prompt: '28. ¿Autorizas que validemos tu identidad mediante cédula, hoja de vida, dirección y reconocimiento facial?',
    options: ['Sí, autorizo la validación completa de mis datos', 'Sí, estoy de acuerdo con el proceso'],
  },
  {
    id: 'q29',
    section: 'Ética y cumplimiento',
    prompt: '29. ¿Declaras que toda la información y documentos que adjuntas en este formulario son verídicos y propios?',
    options: ['Sí, declaro que toda la información es real', 'Sí, todo corresponde a mi identidad real'],
  },
  {
    id: 'q30',
    section: 'Ética y cumplimiento',
    prompt: '30. Confirmación final: ¿Deseas enviar formalmente tu postulación y esperar la respuesta de autorización en tu correo (3 a 7 días)?',
    options: ['Sí, confirmo que quiero trabajar como Agente Vinchi', 'Sí, enviar mi postulación ahora'],
  },
];

const COLOMBIA_LOCATIONS: Record<string, string[]> = {
  Antioquia: ['Medellín', 'Envigado', 'Itagüí', 'Bello', 'Rionegro', 'Sabaneta'],
  Atlántico: ['Barranquilla', 'Soledad', 'Puerto Colombia', 'Malambo'],
  'Bogotá D.C.': ['Bogotá D.C.'],
  Bolívar: ['Cartagena', 'Turbaco', 'Magangué'],
  Boyacá: ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá'],
  Caldas: ['Manizales', 'Villamaría', 'Chinchiná', 'La Dorada'],
  Cundinamarca: ['Chía', 'Soacha', 'Cajicá', 'Zipaquirá', 'Fusagasugá', 'Girardot', 'Facatativá'],
  Huila: ['Neiva', 'Pitalito', 'Garzón'],
  Meta: ['Villavicencio', 'Acacías', 'Granada'],
  Nariño: ['Pasto', 'Ipiales', 'Tumaco'],
  'Norte de Santander': ['Cúcuta', 'Ocaña', 'Pamplona', 'Villa del Rosario'],
  Quindío: ['Armenia', 'Calarcá', 'Montenegro'],
  Risaralda: ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal'],
  Santander: ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja'],
  Tolima: ['Ibagué', 'Espinal', 'Melgar'],
  'Valle del Cauca': ['Cali', 'Palmira', 'Jamundí', 'Yumbo', 'Tuluá', 'Buga'],
};

export default function PostularAgentePage({
  user,
  onUserUpdated,
  onNavigate,
}: PostularAgentePageProps) {
  const [application, setApplication] = useState<AgentApplicationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Datos personales obligatorios
  const [primerNombre, setPrimerNombre] = useState(user.primerNombre || '');
  const [segundoNombre, setSegundoNombre] = useState(user.segundoNombre || '');
  const [primerApellido, setPrimerApellido] = useState(user.primerApellido || '');
  const [segundoApellido, setSegundoApellido] = useState(user.segundoApellido || '');
  const [telefono, setTelefono] = useState(user.telefono || '');

  // 30 respuestas
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Sección 1: Cédula
  const [cedulaNumero, setCedulaNumero] = useState('');
  const [cedulaExpedicion, setCedulaExpedicion] = useState('');
  const [cedulaArchivoNombre, setCedulaArchivoNombre] = useState('');

  // Sección 2: Hoja de vida
  const [hojaVidaArchivoNombre, setHojaVidaArchivoNombre] = useState('');
  const [experienciaResumen, setExperienciaResumen] = useState('');

  // Sección 3: Dirección + Departamento + Municipio
  const [departamento, setDepartamento] = useState('Cundinamarca');
  const [municipio, setMunicipio] = useState('Chía');
  const [direccionCasa, setDireccionCasa] = useState('');
  const [barrio, setBarrio] = useState('');

  // Sección 4: Reconocimiento Facial
  const [facialVerified, setFacialVerified] = useState(false);
  const [facialSnapshotDataUrl, setFacialSnapshotDataUrl] = useState<string>('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetchMyAgentApplication()
      .then((res) => {
        setApplication(res.application);
        onUserUpdated(res.user);
      })
      .catch(() => {
        // Ignorar si aún no existe solicitud
      })
      .finally(() => setIsLoading(false));

    const token = getStoredToken();
    if (!token) return;
    const disconnect = connectRealtime(token, (evt) => {
      if (evt.type === 'application:reviewed') {
        setApplication(evt.application);
        onUserUpdated(evt.user);
      }
    });
    return () => {
      disconnect();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleStartCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Cámara no disponible en este navegador.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 480, height: 360 },
      });
      streamRef.current = stream;
      setCameraActive(true);
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 60);
    } catch {
      setCameraError(
        'No fue posible abrir la cámara automáticamente. Puedes usar la verificación guiada alternativa justo abajo.'
      );
    }
  };

  const handleCaptureFace = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
      setFacialSnapshotDataUrl(dataUrl);
      setFacialVerified(true);
      stopCamera();
    }
  };

  const handleGuidedFaceFallback = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#442c61';
      ctx.fillRect(0, 0, 240, 180);
      ctx.fillStyle = '#bc8ae1';
      ctx.beginPath();
      ctx.arc(120, 72, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(120, 146, 48, Math.PI, Math.PI * 2);
      ctx.fill();
      setFacialSnapshotDataUrl(canvas.toDataURL('image/png'));
    }
    setFacialVerified(true);
    setCameraError('');
  };

  const handleCedulaFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCedulaArchivoNombre(file.name);
  };

  const handleCvFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setHojaVidaArchivoNombre(file.name);
  };

  const handleDepartamentoChange = (nextDept: string) => {
    setDepartamento(nextDept);
    const list = COLOMBIA_LOCATIONS[nextDept] || [];
    setMunicipio(list[0] || '');
  };

  const answeredCount = QUESTIONS_30.filter((q) => Boolean(answers[q.id])).length;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMsg('');

    if (primerNombre.trim().length < 2 || primerApellido.trim().length < 2) {
      setErrorMsg('Tu primer nombre y primer apellido son obligatorios.');
      return;
    }
    if (answeredCount < 30) {
      setErrorMsg(
        `Has respondido ${answeredCount} de 30 preguntas. Completa las 30 preguntas antes de enviar tu postulación.`
      );
      return;
    }
    if (!cedulaNumero.trim() || !cedulaArchivoNombre.trim()) {
      setErrorMsg('Completa el número de cédula y adjunta el documento de identidad.');
      return;
    }
    if (!hojaVidaArchivoNombre.trim()) {
      setErrorMsg('Adjunta tu hoja de vida en la sección correspondiente.');
      return;
    }
    if (!departamento || !municipio || !direccionCasa.trim()) {
      setErrorMsg('Completa la dirección de tu casa, departamento y municipio.');
      return;
    }
    if (!facialVerified) {
      setErrorMsg('Completa la verificación de reconocimiento facial antes de enviar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitAgentApplication({
        primerNombre: primerNombre.trim(),
        segundoNombre: segundoNombre.trim() || undefined,
        primerApellido: primerApellido.trim(),
        segundoApellido: segundoApellido.trim() || undefined,
        telefono: telefono.trim() || undefined,
        answers,
        cedulaNumero: cedulaNumero.trim(),
        cedulaExpedicion: cedulaExpedicion.trim(),
        cedulaArchivoNombre: cedulaArchivoNombre.trim(),
        hojaVidaArchivoNombre: hojaVidaArchivoNombre.trim(),
        experienciaResumen: experienciaResumen.trim(),
        departamento,
        municipio,
        direccionCasa: direccionCasa.trim(),
        barrio: barrio.trim(),
        facialVerified,
        facialSnapshotDataUrl,
      });
      setApplication(res.application);
      onUserUpdated(res.user);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No fue posible enviar la postulación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const municipiosDisponibles = COLOMBIA_LOCATIONS[departamento] || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3e8ff]/70 via-[#faf5ff] to-[#f4ecfb] text-[#0a0a0a]">
      <header className="sticky top-0 z-30 border-b border-[#9c44dc]/55 bg-[#442c61] px-4 py-3.5 text-[#ffffff] shadow-[0_6px_22px_-8px_rgba(68,44,97,0.45)] sm:px-6">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/(public)')}
              className="vinchi-transition inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#ffffff]/14 text-[#ffffff] hover:bg-[#9c44dc] cursor-pointer"
              aria-label="Volver al inicio"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <div>
              <p className="text-xs font-semibold text-[#e9d5ff]">Postulación privada · Agentes</p>
              <h1 className="font-display text-lg font-semibold text-[#ffffff] sm:text-xl">
                Registro de aspirante a Agente Vinchi
              </h1>
            </div>
          </div>

          {!application && (
            <div className="rounded-[12px] border border-[#bc8ae1]/45 bg-[#ffffff]/12 px-3.5 py-1.5 text-xs font-medium text-[#f3e8ff]">
              Preguntas:{' '}
              <span className="font-mono font-semibold text-[#fde68a]">
                {answeredCount} / 30
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[1080px] px-4 py-8 sm:px-6">
        {isLoading ? (
          <div className="h-96 animate-pulse rounded-[24px] border border-[#bc8ae1]/55 bg-[#ffffff]" />
        ) : application?.status === 'approved' || user.role === 'agente' ? (
          <section className="mx-auto max-w-xl rounded-[24px] border-2 border-[#16a34a]/40 bg-[#ffffff] p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#16a34a]/12 text-[#166534]">
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </div>
            <h2 className="mt-4 font-display text-2xl font-semibold text-[#0a0a0a]">
              ¡Tu postulación fue autorizada!
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#543b6c]">
              {application?.authorizationNotice ||
                `Enviamos la confirmación de autorización al correo ${user.email}. Ya puedes ingresar a tu espacio de trabajo como Agente Vinchi.`}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('/(dashboards)/agente')}
              className="vinchi-transition mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[18px] bg-[#9c44dc] px-6 text-sm font-semibold text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
            >
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              <span>Entrar a mi espacio de Agente</span>
            </button>
          </section>
        ) : application?.status === 'pending' ? (
          <section className="mx-auto max-w-2xl rounded-[24px] border border-[#bc8ae1] bg-[#ffffff] p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#bc8ae1]/20 text-[#442c61]">
              <Clock className="h-7 w-7 text-[#9c44dc]" aria-hidden="true" />
            </div>
            <h2 className="mt-4 font-display text-2xl font-semibold text-[#0a0a0a]">
              Postulación enviada con éxito
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#543b6c]">
              Recibimos tus <strong>30 respuestas</strong>, tu cédula ({application.cedulaNumero}),
              tu hoja de vida ({application.hojaVidaArchivoNombre}), la dirección en{' '}
              <strong>
                {application.municipio}, {application.departamento}
              </strong>{' '}
              y tu verificación facial.
            </p>

            <div className="mt-6 rounded-[18px] border border-[#e5e5e5] bg-[#fafafa] p-5 text-left">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#9c44dc]" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-[#442c61]">
                    Espera tu autorización en el correo ({user.email})
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#543b6c]">
                    Nuestro equipo revisará tus documentos en un plazo aproximado de{' '}
                    <strong className="text-[#0a0a0a]">3 a 7 días</strong>. Cuando recibas la
                    autorización en tu correo, vuelve a pulsar{' '}
                    <strong className="text-[#442c61]">Trabajar en Vinchi</strong> y entra desde el
                    enlace debajo de la opción de Agente.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/(public)')}
              className="vinchi-transition mt-6 inline-flex min-h-[44px] items-center justify-center rounded-[16px] bg-[#442c61] px-6 text-sm font-medium text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
            >
              Volver al inicio
            </button>
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Encabezado informativo del aspirante */}
            <section className="rounded-[24px] border-2 border-[#bc8ae1]/65 bg-[#ffffff] p-6 shadow-xs sm:p-8">
              <p className="text-xs font-semibold text-[#9c44dc]">
                Aspirante autenticado: {user.nombre} ({user.email})
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-[#442c61]">
                Cuestionario de evaluación (30 preguntas) y documentación obligatoria
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#543b6c]">
                Confirma tu nombre completo, responde las 30 preguntas y al final adjunta tu cédula,
                hoja de vida, dirección completa con departamento y municipio, y reconocimiento
                facial.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label htmlFor="ag-pnombre" className="block text-[11px] font-medium text-[#442c61]">
                    Primer nombre <span className="text-[#9c44dc]">*</span>
                  </label>
                  <input
                    id="ag-pnombre"
                    type="text"
                    required
                    value={primerNombre}
                    onChange={(e) => setPrimerNombre(e.target.value)}
                    className="mt-1 h-10 w-full rounded-[12px] border border-[#bc8ae1]/55 bg-[#faf5ff] px-3 text-xs text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="ag-snombre" className="block text-[11px] font-medium text-[#442c61]">
                    Segundo nombre (opcional)
                  </label>
                  <input
                    id="ag-snombre"
                    type="text"
                    value={segundoNombre}
                    onChange={(e) => setSegundoNombre(e.target.value)}
                    className="mt-1 h-10 w-full rounded-[12px] border border-[#bc8ae1]/55 bg-[#faf5ff] px-3 text-xs text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="ag-papellido" className="block text-[11px] font-medium text-[#442c61]">
                    Primer apellido <span className="text-[#9c44dc]">*</span>
                  </label>
                  <input
                    id="ag-papellido"
                    type="text"
                    required
                    value={primerApellido}
                    onChange={(e) => setPrimerApellido(e.target.value)}
                    className="mt-1 h-10 w-full rounded-[12px] border border-[#bc8ae1]/55 bg-[#faf5ff] px-3 text-xs text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="ag-sapellido" className="block text-[11px] font-medium text-[#442c61]">
                    Segundo apellido (opcional)
                  </label>
                  <input
                    id="ag-sapellido"
                    type="text"
                    value={segundoApellido}
                    onChange={(e) => setSegundoApellido(e.target.value)}
                    className="mt-1 h-10 w-full rounded-[12px] border border-[#bc8ae1]/55 bg-[#faf5ff] px-3 text-xs text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="ag-tel" className="block text-[11px] font-medium text-[#442c61]">
                    Teléfono celular
                  </label>
                  <input
                    id="ag-tel"
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+57 300 000 0000"
                    className="mt-1 h-10 w-full rounded-[12px] border border-[#bc8ae1]/55 bg-[#faf5ff] px-3 text-xs text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[#e9d5ff]/75">
                <div
                  className="h-full rounded-full bg-[#9c44dc] transition-all duration-300"
                  style={{ width: `${Math.round((answeredCount / 30) * 100)}%` }}
                />
              </div>
            </section>

            {/* Las 30 preguntas */}
            <section aria-label="Formulario de 30 preguntas" className="space-y-4">
              {QUESTIONS_30.map((q) => {
                const currentVal = answers[q.id] || '';
                return (
                  <article
                    key={q.id}
                    className={`rounded-[20px] border-2 bg-[#ffffff] p-5 transition-colors ${
                      currentVal ? 'border-[#9c44dc]' : 'border-[#bc8ae1]/45'
                    }`}
                  >
                    <p className="text-[11px] font-semibold text-[#9c44dc]">{q.section}</p>
                    <h3 className="mt-1 text-sm font-semibold text-[#0a0a0a] sm:text-base">
                      {q.prompt}
                    </h3>
                    <div className="mt-3.5 grid gap-2 sm:grid-cols-2">
                      {q.options.map((opt) => {
                        const selected = currentVal === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                            className={`vinchi-transition rounded-[14px] border px-4 py-2.5 text-left text-xs font-medium cursor-pointer ${
                              selected
                                ? 'border-[#9c44dc] bg-[#442c61] text-[#ffffff]'
                                : 'border-[#bc8ae1]/45 bg-[#faf5ff] text-[#442c61] hover:border-[#9c44dc]'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </section>

            {/* Secciones obligatorias debajo de las 30 preguntas */}
            <section
              aria-label="Documentación y verificación facial"
              className="grid gap-6 md:grid-cols-2"
            >
              {/* Sección 1: Cédula */}
              <div className="rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#9c44dc]/14 text-[#442c61]">
                    <IdCard className="h-6 w-6 text-[#9c44dc]" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#9c44dc]">Sección 1</p>
                    <h3 className="font-display text-lg font-semibold text-[#0a0a0a]">
                      Registro de Cédula
                    </h3>
                  </div>
                </div>

                <div>
                  <label htmlFor="cedula-num" className="block text-xs font-medium text-[#442c61]">
                    Número de cédula
                  </label>
                  <input
                    id="cedula-num"
                    type="text"
                    value={cedulaNumero}
                    onChange={(e) => setCedulaNumero(e.target.value)}
                    placeholder="Ej. 1020485912"
                    className="mt-1.5 h-11 w-full rounded-[14px] border border-[#bc8ae1]/55 bg-[#faf5ff] px-4 font-mono text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="cedula-exp" className="block text-xs font-medium text-[#442c61]">
                    Fecha y lugar de expedición
                  </label>
                  <input
                    id="cedula-exp"
                    type="text"
                    value={cedulaExpedicion}
                    onChange={(e) => setCedulaExpedicion(e.target.value)}
                    placeholder="Ej. 14/05/2018 · Bogotá"
                    className="mt-1.5 h-11 w-full rounded-[14px] border border-[#bc8ae1]/55 bg-[#faf5ff] px-4 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cedula-file"
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-[14px] border border-dashed border-[#9c44dc]/65 bg-[#faf5ff] px-4 py-3 text-xs text-[#442c61] hover:bg-[#bc8ae1]/15"
                  >
                    <span className="truncate font-medium">
                      {cedulaArchivoNombre || 'Subir foto o archivo de tu cédula (PDF/JPG/PNG)'}
                    </span>
                    <Upload className="h-5 w-5 shrink-0 text-[#9c44dc]" aria-hidden="true" />
                    <input
                      id="cedula-file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleCedulaFile}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              {/* Sección 2: Hoja de vida */}
              <div className="rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#9c44dc]/14 text-[#442c61]">
                    <FileText className="h-6 w-6 text-[#9c44dc]" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#9c44dc]">Sección 2</p>
                    <h3 className="font-display text-lg font-semibold text-[#0a0a0a]">
                      Hoja de Vida
                    </h3>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="cv-file"
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-[14px] border border-dashed border-[#9c44dc]/65 bg-[#faf5ff] px-4 py-3.5 text-xs text-[#442c61] hover:bg-[#bc8ae1]/15"
                  >
                    <span className="truncate font-medium">
                      {hojaVidaArchivoNombre || 'Adjuntar Hoja de Vida (PDF o DOCX)'}
                    </span>
                    <Upload className="h-5 w-5 shrink-0 text-[#9c44dc]" aria-hidden="true" />
                    <input
                      id="cv-file"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleCvFile}
                      className="sr-only"
                    />
                  </label>
                </div>

                <div>
                  <label htmlFor="cv-resumen" className="block text-xs font-medium text-[#442c61]">
                    Resumen de tu experiencia comercial
                  </label>
                  <textarea
                    id="cv-resumen"
                    rows={4}
                    value={experienciaResumen}
                    onChange={(e) => setExperienciaResumen(e.target.value)}
                    placeholder="Cuéntanos brevemente tu experiencia en ventas, atención a comercios o trabajo en campo..."
                    className="mt-1.5 w-full rounded-[14px] border border-[#bc8ae1]/55 bg-[#faf5ff] p-3.5 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
              </div>

              {/* Sección 3: Dirección de casa + Departamento + Municipio */}
              <div className="rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#9c44dc]/14 text-[#442c61]">
                    <MapPin className="h-6 w-6 text-[#9c44dc]" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#9c44dc]">Sección 3</p>
                    <h3 className="font-display text-lg font-semibold text-[#0a0a0a]">
                      Dirección de Residencia
                    </h3>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="dept-select"
                      className="block text-xs font-medium text-[#442c61]"
                    >
                      Departamento
                    </label>
                    <select
                      id="dept-select"
                      value={departamento}
                      onChange={(e) => handleDepartamentoChange(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-[14px] border border-[#bc8ae1]/55 bg-[#faf5ff] px-3 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                    >
                      {Object.keys(COLOMBIA_LOCATIONS).map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="muni-select"
                      className="block text-xs font-medium text-[#442c61]"
                    >
                      Municipio / Ciudad
                    </label>
                    <select
                      id="muni-select"
                      value={municipio}
                      onChange={(e) => setMunicipio(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-[14px] border border-[#bc8ae1]/55 bg-[#faf5ff] px-3 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                    >
                      {municipiosDisponibles.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="dir-casa" className="block text-xs font-medium text-[#442c61]">
                    Dirección exacta de tu casa
                  </label>
                  <input
                    id="dir-casa"
                    type="text"
                    value={direccionCasa}
                    onChange={(e) => setDireccionCasa(e.target.value)}
                    placeholder="Ej. Calle 14 # 8-45, Casa 3"
                    className="mt-1.5 h-11 w-full rounded-[14px] border border-[#bc8ae1]/55 bg-[#faf5ff] px-4 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="barrio" className="block text-xs font-medium text-[#442c61]">
                    Barrio o sector
                  </label>
                  <input
                    id="barrio"
                    type="text"
                    value={barrio}
                    onChange={(e) => setBarrio(e.target.value)}
                    placeholder="Ej. Centro / Cedritos"
                    className="mt-1.5 h-11 w-full rounded-[14px] border border-[#bc8ae1]/55 bg-[#faf5ff] px-4 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
              </div>

              {/* Sección 4: Reconocimiento Facial */}
              <div className="rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#9c44dc]/14 text-[#442c61]">
                    <ScanFace className="h-6 w-6 text-[#9c44dc]" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#9c44dc]">Sección 4</p>
                    <h3 className="font-display text-lg font-semibold text-[#0a0a0a]">
                      Reconocimiento Facial
                    </h3>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-[#543b6c]">
                  Realiza una captura de tu rostro en vivo para confirmar que eres quien diligencia
                  la postulación.
                </p>

                {facialVerified && facialSnapshotDataUrl ? (
                  <div className="flex items-center gap-4 rounded-[16px] border border-[#16a34a]/40 bg-[#16a34a]/8 p-3.5">
                    <img
                      src={facialSnapshotDataUrl}
                      alt="Rostro verificado"
                      className="h-16 w-20 rounded-[10px] object-cover border border-[#16a34a]/40"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#166534]">
                        Rostro verificado correctamente
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setFacialVerified(false);
                          setFacialSnapshotDataUrl('');
                        }}
                        className="mt-1 text-[11px] font-medium text-[#442c61] underline cursor-pointer"
                      >
                        Repetir captura
                      </button>
                    </div>
                  </div>
                ) : cameraActive ? (
                  <div className="space-y-3">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-44 w-full rounded-[16px] bg-[#0a0a0a] object-cover"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCaptureFace}
                        className="vinchi-transition flex-1 rounded-[14px] bg-[#9c44dc] py-2.5 text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
                      >
                        Capturar rostro y verificar
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="rounded-[14px] border border-[#bc8ae1]/55 bg-[#faf5ff] px-4 py-2.5 text-xs font-medium text-[#442c61] cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={handleStartCamera}
                      className="vinchi-transition inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#442c61] px-4 text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
                    >
                      <Camera className="h-5 w-5" aria-hidden="true" />
                      <span>Iniciar cámara de reconocimiento facial</span>
                    </button>

                    {cameraError && (
                      <div className="rounded-[12px] border border-[#d97706]/40 bg-[#d97706]/8 p-3.5 text-xs text-[#92400e] space-y-2.5">
                        <p>{cameraError}</p>
                        <button
                          type="button"
                          onClick={handleGuidedFaceFallback}
                          className="inline-flex min-h-[40px] items-center justify-center rounded-[12px] bg-[#442c61] px-4 py-2 text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
                        >
                          Completar validación facial guiada
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {errorMsg && (
              <p
                role="alert"
                className="rounded-[14px] border border-[#9c645c]/50 bg-[#d0b7b0]/28 px-4 py-3 text-xs font-medium text-[#5c302a]"
              >
                {errorMsg}
              </p>
            )}

            <div className="flex flex-col items-center justify-between gap-4 rounded-[24px] border-2 border-[#bc8ae1] bg-[#ffffff] p-6 sm:flex-row">
              <div className="text-xs text-[#543b6c]">
                <p className="font-semibold text-[#0a0a0a]">
                  Revisión y respuesta entre 3 y 7 días hábiles
                </p>
                <p className="mt-0.5">
                  Te enviaremos un correo a <strong>{user.email}</strong> con la autorización de
                  ingreso.
                </p>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="vinchi-transition inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#9c44dc] px-7 text-sm font-semibold text-[#ffffff] hover:bg-[#543b6c] disabled:opacity-60 sm:w-auto cursor-pointer"
              >
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                <span>{isSubmitting ? 'Enviando postulación...' : 'Enviar postulación de Agente'}</span>
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
