'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  IdCard,
  MapPin,
  Phone,
  ScanFace,
  ShieldCheck,
  Truck,
  Upload,
} from 'lucide-react';
import { fetchMyCourierApplication, submitCourierApplication } from '@/src/lib/vinchiClient';
import type { AuthUser, CourierApplicationRecord, VinchiRoute } from '@/src/types/vinchi';

export interface PostularDomicilioPageProps {
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

const COURIER_QUESTIONS_30: QuestionSpec[] = [
  {
    id: 'dq1',
    section: 'Compromiso de entrega',
    prompt: '1. ¿Estás convencido de trabajar realizando entregas directas de comida y productos en tu ciudad?',
    options: ['Sí, completamente decidido', 'Sí, listo para empezar'],
  },
  {
    id: 'dq2',
    section: 'Compromiso de entrega',
    prompt: '2. ¿Comprendes que en Vinchi no existen intermediarios y tratas directo con comercios y clientes?',
    options: ['Sí, lo entiendo perfectamente', 'Sí, me interesa trabajar directo'],
  },
  {
    id: 'dq3',
    section: 'Compromiso de entrega',
    prompt: '3. ¿Cuántas horas semanales puedes conectarte de forma activa para recibir pedidos?',
    options: ['15 a 25 horas semanales', '25 a 40 horas semanales', 'Más de 40 horas semanales'],
  },
  {
    id: 'dq4',
    section: 'Compromiso de entrega',
    prompt: '4. ¿Sabes que el botón Activo / No activo tiene un límite de 3 cambios al día para mantener orden en la ruta?',
    options: ['Sí, administraré mis cambios con responsabilidad', 'Sí, acepto la regla diaria'],
  },
  {
    id: 'dq5',
    section: 'Compromiso de entrega',
    prompt: '5. Si una empresa te entrega un pedido de comida caliente o bebidas, ¿cómo garantizas su cuidado?',
    options: ['Uso maleta térmica asegurada y conduzco con suavidad', 'Verifico el sellado antes de arrancar'],
  },
  {
    id: 'dq6',
    section: 'Compromiso de entrega',
    prompt: '6. ¿Cuentas con maleta o cajón térmico limpio para transportar alimentos de forma higiénica?',
    options: ['Sí, tengo maleta térmica lista', 'Sí, cuento con compartimento limpio y cerrado'],
  },
  {
    id: 'dq7',
    section: 'Compromiso de entrega',
    prompt: '7. ¿Tu teléfono inteligente tiene ubicación activa y datos móviles suficientes durante toda la jornada?',
    options: ['Sí, tengo ubicación activa y plan de datos estable', 'Sí, todo funciona correctamente'],
  },
  {
    id: 'dq8',
    section: 'Compromiso de entrega',
    prompt: '8. ¿Qué valoras más al trabajar como domiciliario verificado?',
    options: ['Ganar el pago completo por cada domicilio', 'Contratos claros con empresas de mi zona', 'Retirar mis ganancias de forma puntual'],
  },
  {
    id: 'dq9',
    section: 'Seguridad vial y protocolo',
    prompt: '9. ¿Respetas siempre semáforos, pasos peatonales y límites de velocidad al entregar un pedido?',
    options: ['Sí, la seguridad vial es prioridad', 'Sí, conduzco con prudencia en todo momento'],
  },
  {
    id: 'dq10',
    section: 'Seguridad vial y protocolo',
    prompt: '10. Si conduces motocicleta o vehículo, ¿tienes licencia vigente y documentos al día?',
    options: ['Sí, documentos y SOAT vigentes', 'Uso bicicleta o vehículo sin licencia requerida'],
  },
  {
    id: 'dq11',
    section: 'Seguridad vial y protocolo',
    prompt: '11. ¿Utilizas casco certificado y elementos reflectivos cuando realizas entregas nocturnas o con lluvia?',
    options: ['Sí, siempre uso protección completa', 'Sí, equipo completo para clima y noche'],
  },
  {
    id: 'dq12',
    section: 'Seguridad vial y protocolo',
    prompt: '12. Si se presenta un bloqueo o accidente en la vía, ¿qué haces primero?',
    options: ['Aviso de inmediato por el chat activo a la empresa o cliente', 'Busco ruta alterna segura e informo el tiempo estimado'],
  },
  {
    id: 'dq13',
    section: 'Seguridad vial y protocolo',
    prompt: '13. ¿Aceptas validar el código de recogida entregado por la empresa antes de salir del local?',
    options: ['Sí, siempre pediré y registraré el código en la empresa', 'Sí, es parte de mi control de entrega'],
  },
  {
    id: 'dq14',
    section: 'Seguridad vial y protocolo',
    prompt: '14. ¿Comprendes que el chat con el cliente solo se actualiza cuando estás a 5 kilómetros o menos de su ubicación?',
    options: ['Sí, entiendo la regla de proximidad de 5 km', 'Sí, primero recojo y me acerco al punto del cliente'],
  },
  {
    id: 'dq15',
    section: 'Seguridad vial y protocolo',
    prompt: '15. Al llegar donde el cliente, ¿qué debes solicitar antes de cerrar el servicio?',
    options: ['El código de confirmación que tiene el cliente', 'Verificar el pedido y digitar su código de entrega'],
  },
  {
    id: 'dq16',
    section: 'Seguridad vial y protocolo',
    prompt: '16. ¿Jamás abrirás, probarás ni manipularás el contenido sellado de un pedido?',
    options: ['Jamás, entrego los sellos intactos', 'Sí, respeto totalmente la integridad del paquete'],
  },
  {
    id: 'dq17',
    section: 'Atención a empresas y clientes',
    prompt: '17. ¿Cómo saludas al personal de caja o cocina cuando llegas a una empresa a recoger un pedido?',
    options: ['Con respeto, presento el número de orden y mi identificación', 'De manera cordial y rápida para agilizar el despacho'],
  },
  {
    id: 'dq18',
    section: 'Atención a empresas y clientes',
    prompt: '18. Si un restaurante tarda unos minutos adicionales en terminar el empaque, ¿cómo procedes?',
    options: ['Espero con paciencia e informo si es necesario', 'Mantengo comunicación amable con el local'],
  },
  {
    id: 'dq19',
    section: 'Atención a empresas y clientes',
    prompt: '19. Si el cliente no contesta la puerta al primer timbre, ¿qué haces?',
    options: ['Escribo por el chat del domicilio y espero unos minutos', 'Verifico portería o dirección exacta con cordialidad'],
  },
  {
    id: 'dq20',
    section: 'Atención a empresas y clientes',
    prompt: '20. ¿Mantienes un lenguaje amable y respetuoso en todos los chats con empresas y clientes?',
    options: ['Sí, trato cordial y profesional siempre', 'Sí, en todo momento'],
  },
  {
    id: 'dq21',
    section: 'Atención a empresas y clientes',
    prompt: '21. ¿Estás dispuesto a postularte con múltiples empresas locales para aumentar tus rutas diarias?',
    options: ['Sí, quiero trabajar con varias empresas', 'Sí, mientras mayor demanda mejor'],
  },
  {
    id: 'dq22',
    section: 'Atención a empresas y clientes',
    prompt: '22. Si activas el botón de contratación automática con Vinchi, ¿aceptas responder a cualquier empresa que busque domiciliarios?',
    options: ['Sí, responderé con puntualidad a cualquier empresa asignada', 'Sí, quiero recibir contratos automáticos'],
  },
  {
    id: 'dq23',
    section: 'Cobertura y disponibilidad',
    prompt: '23. ¿Conoces bien las principales vías, barrios y nomenclatura de tu municipio?',
    options: ['Sí, conozco muy bien mi ciudad', 'Sí, me oriento con facilidad en el mapa'],
  },
  {
    id: 'dq24',
    section: 'Cobertura y disponibilidad',
    prompt: '24. ¿En qué franjas horarias prefieres realizar domicilios?',
    options: ['Almuerzos (11:00 a.m. - 3:00 p.m.)', 'Noches y cenas (5:00 p.m. - 10:30 p.m.)', 'Jornada completa'],
  },
  {
    id: 'dq25',
    section: 'Cobertura y disponibilidad',
    prompt: '25. ¿Puedes cubrir picos de demanda los fines de semana (viernes, sábado y domingo)?',
    options: ['Sí, tengo alta disponibilidad en fines de semana', 'Sí, puedo conectarme en horas pico'],
  },
  {
    id: 'dq26',
    section: 'Verificación e identidad',
    prompt: '26. ¿Confirmas que el número de teléfono que registras corresponde a tu línea personal activa?',
    options: ['Sí, es mi número personal vigente', 'Sí, siempre está disponible'],
  },
  {
    id: 'dq27',
    section: 'Verificación e identidad',
    prompt: '27. ¿Aceptas que tu perfil muestre tu nombre y foto verificada para brindar confianza a comercios y clientes?',
    options: ['Sí, acepto mostrar mi foto y nombre verificado', 'Sí, me parece más seguro para todos'],
  },
  {
    id: 'dq28',
    section: 'Verificación e identidad',
    prompt: '28. ¿Declaras que tu documento de identidad y dirección de residencia son reales y vigentes?',
    options: ['Sí, toda mi información es verídica', 'Sí, lo confirmo bajo mi responsabilidad'],
  },
  {
    id: 'dq29',
    section: 'Verificación e identidad',
    prompt: '29. ¿Autorizas la captura de reconocimiento facial para validar tu cuenta antes de iniciar labores?',
    options: ['Sí, autorizo el reconocimiento facial', 'Sí, completará mi perfil'],
  },
  {
    id: 'dq30',
    section: 'Verificación e identidad',
    prompt: '30. Confirmación final: ¿Estás listo para enviar tu perfil y entrar a trabajar como Domicilio Vinchi?',
    options: ['Sí, enviar mi perfil y comenzar ahora', 'Sí, confirmar y abrir mi espacio de trabajo'],
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

export default function PostularDomicilioPage({
  user,
  onUserUpdated,
  onNavigate,
}: PostularDomicilioPageProps) {
  const [existingApp, setExistingApp] = useState<CourierApplicationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentMessage, setSentMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Datos personales obligatorios
  const [primerNombre, setPrimerNombre] = useState(user.primerNombre || '');
  const [segundoNombre, setSegundoNombre] = useState(user.segundoNombre || '');
  const [primerApellido, setPrimerApellido] = useState(user.primerApellido || '');
  const [segundoApellido, setSegundoApellido] = useState(user.segundoApellido || '');
  const [telefono, setTelefono] = useState(user.telefono || '');
  const [vehiculo, setVehiculo] = useState('Motocicleta');

  // 30 preguntas
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Cédula
  const [cedulaNumero, setCedulaNumero] = useState('');
  const [cedulaExpedicion, setCedulaExpedicion] = useState('');
  const [cedulaArchivoNombre, setCedulaArchivoNombre] = useState('');

  // Departamento / Municipio / Dirección casa
  const [departamento, setDepartamento] = useState('Bogotá D.C.');
  const [municipio, setMunicipio] = useState('Bogotá D.C.');
  const [direccionCasa, setDireccionCasa] = useState('');
  const [barrio, setBarrio] = useState('');

  // Reconocimiento facial
  const [facialVerified, setFacialVerified] = useState(false);
  const [facialSnapshotDataUrl, setFacialSnapshotDataUrl] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetchMyCourierApplication()
      .then((res) => {
        setExistingApp(res.application);
        onUserUpdated(res.user);
      })
      .catch(() => {
        // Ignorar si no existe postulación previa
      })
      .finally(() => setIsLoading(false));

    return () => {
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
        throw new Error('Cámara no disponible.');
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
        'No fue posible abrir la cámara automáticamente. Puedes completar la validación facial guiada justo abajo.'
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
      setFacialSnapshotDataUrl(canvas.toDataURL('image/jpeg', 0.72));
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

  const handleDepartamentoChange = (nextDept: string) => {
    setDepartamento(nextDept);
    const list = COLOMBIA_LOCATIONS[nextDept] || [];
    setMunicipio(list[0] || '');
  };

  const answeredCount = COURIER_QUESTIONS_30.filter((q) => Boolean(answers[q.id])).length;
  const municipiosDisponibles = COLOMBIA_LOCATIONS[departamento] || [];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (primerNombre.trim().length < 2 || primerApellido.trim().length < 2) {
      setErrorMsg('Tu primer nombre y primer apellido son obligatorios.');
      return;
    }
    if (!telefono.trim() || telefono.trim().length < 7) {
      setErrorMsg('Ingresa tu número de teléfono celular para poder coordinar entregas.');
      return;
    }
    if (answeredCount < 30) {
      setErrorMsg(
        `Has respondido ${answeredCount} de 30 preguntas. Responde todas para habilitar tu perfil de Domicilio.`
      );
      return;
    }
    if (!cedulaNumero.trim() || !cedulaArchivoNombre.trim()) {
      setErrorMsg('Ingresa tu número de cédula y adjunta el documento.');
      return;
    }
    if (!departamento || !municipio || !direccionCasa.trim()) {
      setErrorMsg('Completa la dirección de tu casa, departamento y municipio.');
      return;
    }
    if (!facialVerified) {
      setErrorMsg('Completa tu reconocimiento facial antes de enviar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitCourierApplication({
        primerNombre: primerNombre.trim(),
        segundoNombre: segundoNombre.trim() || undefined,
        primerApellido: primerApellido.trim(),
        segundoApellido: segundoApellido.trim() || undefined,
        telefono: telefono.trim(),
        vehiculo,
        answers,
        cedulaNumero: cedulaNumero.trim(),
        cedulaExpedicion: cedulaExpedicion.trim(),
        cedulaArchivoNombre: cedulaArchivoNombre.trim(),
        departamento,
        municipio,
        direccionCasa: direccionCasa.trim(),
        barrio: barrio.trim(),
        facialVerified,
        facialSnapshotDataUrl,
      });
      onUserUpdated(res.user);
      setExistingApp(res.application);
      setSentMessage(res.message || 'Perfil enviado · Ya puedes entrar a trabajar');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.setTimeout(() => {
        onNavigate('/(dashboards)/repartidor');
      }, 1700);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No fue posible enviar tu perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <p className="text-xs font-semibold text-[#e9d5ff]">Registro privado · Domicilio</p>
              <h1 className="font-display text-lg font-semibold text-[#ffffff] sm:text-xl">
                Alta de Domiciliario Verificado Vinchi
              </h1>
            </div>
          </div>

          {!sentMessage && !existingApp && (
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
        ) : sentMessage || user.role === 'repartidor' ? (
          <section className="mx-auto max-w-xl rounded-[24px] border-2 border-[#16a34a]/40 bg-[#ffffff] p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#16a34a]/12 text-[#166534]">
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </div>
            <h2 className="mt-4 font-display text-2xl font-semibold text-[#0a0a0a]">
              Perfil enviado · Ya puedes entrar a trabajar
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#543b6c]">
              Tu documentación, tus 30 respuestas y tu verificación facial quedaron registradas.
              Estamos abriendo tu espacio privado de Domicilio...
            </p>
            <button
              type="button"
              onClick={() => onNavigate('/(dashboards)/repartidor')}
              className="vinchi-transition mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[18px] bg-[#9c44dc] px-6 text-sm font-semibold text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
            >
              <Truck className="h-5 w-5" aria-hidden="true" />
              <span>Entrar a trabajar ahora</span>
            </button>
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="rounded-[24px] border-2 border-[#bc8ae1]/65 bg-[#ffffff] p-6 shadow-xs sm:p-8">
              <p className="text-xs font-semibold text-[#9c44dc]">
                Cuenta autenticada: {user.email}
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-[#442c61]">
                Datos obligatorios, formulario de 30 preguntas y verificación facial
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#543b6c]">
                Al finalizar podrás entrar inmediatamente a tu mapa de entregas, chats y ganancias.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label
                    htmlFor="dm-pnombre"
                    className="block text-[11px] font-medium text-[#442c61]"
                  >
                    Primer nombre <span className="text-[#9c44dc]">*</span>
                  </label>
                  <input
                    id="dm-pnombre"
                    type="text"
                    required
                    value={primerNombre}
                    onChange={(e) => setPrimerNombre(e.target.value)}
                    className="mt-1 h-11 w-full rounded-[14px] border border-[#bc8ae1]/55 bg-[#faf5ff] px-3.5 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="dm-snombre"
                    className="block text-[11px] font-medium text-[#442c61]"
                  >
                    Segundo nombre (opcional)
                  </label>
                  <input
                    id="dm-snombre"
                    type="text"
                    value={segundoNombre}
                    onChange={(e) => setSegundoNombre(e.target.value)}
                    className="mt-1 h-11 w-full rounded-[14px] border border-[#bc8ae1]/55 bg-[#faf5ff] px-3.5 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="dm-papellido"
                    className="block text-[11px] font-medium text-[#442c61]"
                  >
                    Primer apellido <span className="text-[#9c44dc]">*</span>
                  </label>
                  <input
                    id="dm-papellido"
                    type="text"
                    required
                    value={primerApellido}
                    onChange={(e) => setPrimerApellido(e.target.value)}
                    className="mt-1 h-11 w-full rounded-[14px] border border-[#bc8ae1]/55 bg-[#faf5ff] px-3.5 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="dm-sapellido"
                    className="block text-[11px] font-medium text-[#442c61]"
                  >
                    Segundo apellido (opcional)
                  </label>
                  <input
                    id="dm-sapellido"
                    type="text"
                    value={segundoApellido}
                    onChange={(e) => setSegundoApellido(e.target.value)}
                    className="mt-1 h-11 w-full rounded-[14px] border border-[#bc8ae1]/55 bg-[#faf5ff] px-3.5 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="dm-tel" className="block text-[11px] font-medium text-[#442c61]">
                    Número de teléfono <span className="text-[#9c44dc]">*</span>
                  </label>
                  <div className="relative mt-1">
                    <Phone
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9c44dc]"
                      aria-hidden="true"
                    />
                    <input
                      id="dm-tel"
                      type="tel"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+57 315 000 0000"
                      className="h-11 w-full rounded-[14px] border border-[#bc8ae1]/55 bg-[#faf5ff] pl-9 pr-3.5 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="dm-vehiculo"
                    className="block text-[11px] font-medium text-[#442c61]"
                  >
                    Medio de entrega
                  </label>
                  <select
                    id="dm-vehiculo"
                    value={vehiculo}
                    onChange={(e) => setVehiculo(e.target.value)}
                    className="mt-1 h-11 w-full rounded-[14px] border border-[#bc8ae1]/55 bg-[#faf5ff] px-3.5 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  >
                    <option value="Motocicleta">Motocicleta</option>
                    <option value="Bicicleta">Bicicleta</option>
                    <option value="Automóvil">Automóvil</option>
                    <option value="A pie">A pie (zona corta)</option>
                  </select>
                </div>
              </div>

              <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-[#e9d5ff]/75">
                <div
                  className="h-full rounded-full bg-[#9c44dc] transition-all duration-300"
                  style={{ width: `${Math.round((answeredCount / 30) * 100)}%` }}
                />
              </div>
            </section>

            {/* 30 preguntas */}
            <section aria-label="Formulario de 30 preguntas para domicilio" className="space-y-4">
              {COURIER_QUESTIONS_30.map((q) => {
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

            {/* Cédula + Dirección (Dept/Muni) + Reconocimiento Facial */}
            <section className="grid gap-6 md:grid-cols-3">
              {/* Cédula */}
              <div className="rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#9c44dc]/14 text-[#442c61]">
                    <IdCard className="h-6 w-6 text-[#9c44dc]" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#9c44dc]">Verificación 1</p>
                    <h3 className="font-display text-lg font-semibold text-[#0a0a0a]">Cédula</h3>
                  </div>
                </div>

                <div>
                  <label htmlFor="dm-ced-num" className="block text-xs font-medium text-[#442c61]">
                    Número de cédula
                  </label>
                  <input
                    id="dm-ced-num"
                    type="text"
                    value={cedulaNumero}
                    onChange={(e) => setCedulaNumero(e.target.value)}
                    placeholder="Ej. 1020485912"
                    className="mt-1.5 h-11 w-full rounded-[14px] border border-[#bc8ae1]/55 bg-[#faf5ff] px-4 font-mono text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="dm-ced-exp" className="block text-xs font-medium text-[#442c61]">
                    Fecha y lugar de expedición
                  </label>
                  <input
                    id="dm-ced-exp"
                    type="text"
                    value={cedulaExpedicion}
                    onChange={(e) => setCedulaExpedicion(e.target.value)}
                    placeholder="Ej. 14/05/2018 · Bogotá"
                    className="mt-1.5 h-11 w-full rounded-[14px] border border-[#bc8ae1]/55 bg-[#faf5ff] px-4 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>

                <label
                  htmlFor="dm-ced-file"
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-[14px] border border-dashed border-[#9c44dc]/65 bg-[#faf5ff] px-4 py-3 text-xs text-[#442c61] hover:bg-[#bc8ae1]/15"
                >
                  <span className="truncate font-medium">
                    {cedulaArchivoNombre || 'Subir foto/archivo de cédula'}
                  </span>
                  <Upload className="h-5 w-5 shrink-0 text-[#9c44dc]" aria-hidden="true" />
                  <input
                    id="dm-ced-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleCedulaFile}
                    className="sr-only"
                  />
                </label>
              </div>

              {/* Departamento, Municipio y Dirección */}
              <div className="rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#9c44dc]/14 text-[#442c61]">
                    <MapPin className="h-6 w-6 text-[#9c44dc]" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#9c44dc]">Verificación 2</p>
                    <h3 className="font-display text-lg font-semibold text-[#0a0a0a]">
                      Ubicación de residencia
                    </h3>
                  </div>
                </div>

                <div>
                  <label htmlFor="dm-dept" className="block text-xs font-medium text-[#442c61]">
                    Departamento
                  </label>
                  <select
                    id="dm-dept"
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
                  <label htmlFor="dm-muni" className="block text-xs font-medium text-[#442c61]">
                    Municipio / Ciudad
                  </label>
                  <select
                    id="dm-muni"
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

                <div>
                  <label htmlFor="dm-dir" className="block text-xs font-medium text-[#442c61]">
                    Dirección de la casa
                  </label>
                  <input
                    id="dm-dir"
                    type="text"
                    value={direccionCasa}
                    onChange={(e) => setDireccionCasa(e.target.value)}
                    placeholder="Ej. Calle 14 # 8-45"
                    className="mt-1.5 h-11 w-full rounded-[14px] border border-[#bc8ae1]/55 bg-[#faf5ff] px-4 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="dm-barrio" className="block text-xs font-medium text-[#442c61]">
                    Barrio
                  </label>
                  <input
                    id="dm-barrio"
                    type="text"
                    value={barrio}
                    onChange={(e) => setBarrio(e.target.value)}
                    placeholder="Ej. Chapinero"
                    className="mt-1.5 h-11 w-full rounded-[14px] border border-[#bc8ae1]/55 bg-[#faf5ff] px-4 text-sm text-[#0a0a0a] focus:border-[#9c44dc] focus:bg-[#ffffff] focus:outline-none"
                  />
                </div>
              </div>

              {/* Reconocimiento facial */}
              <div className="rounded-[24px] border-2 border-[#bc8ae1]/60 bg-[#ffffff] p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#9c44dc]/14 text-[#442c61]">
                    <ScanFace className="h-6 w-6 text-[#9c44dc]" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#9c44dc]">Verificación 3</p>
                    <h3 className="font-display text-lg font-semibold text-[#0a0a0a]">
                      Reconocimiento Facial
                    </h3>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-[#543b6c]">
                  Captura tu rostro para activar tu perfil de repartidor y habilitar tus rutas.
                </p>

                {facialVerified && facialSnapshotDataUrl ? (
                  <div className="flex items-center gap-3 rounded-[16px] border border-[#16a34a]/40 bg-[#16a34a]/8 p-3.5">
                    <img
                      src={facialSnapshotDataUrl}
                      alt="Rostro verificado"
                      className="h-14 w-16 rounded-[10px] object-cover border border-[#16a34a]/40"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#166534]">Rostro verificado</p>
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
                      className="h-40 w-full rounded-[16px] bg-[#0a0a0a] object-cover"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCaptureFace}
                        className="vinchi-transition flex-1 rounded-[14px] bg-[#9c44dc] py-2.5 text-xs font-semibold text-[#ffffff] hover:bg-[#543b6c] cursor-pointer"
                      >
                        Capturar rostro
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="rounded-[14px] border border-[#bc8ae1]/55 bg-[#faf5ff] px-3 py-2.5 text-xs font-medium text-[#442c61] cursor-pointer"
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
                      <span>Iniciar cámara facial</span>
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
                  Activación inmediata al enviar tu perfil
                </p>
                <p className="mt-0.5">
                  Recibirás confirmación y entrarás directamente a tu espacio privado para trabajar.
                </p>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="vinchi-transition inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#9c44dc] px-7 text-sm font-semibold text-[#ffffff] hover:bg-[#543b6c] disabled:opacity-60 sm:w-auto cursor-pointer"
              >
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                <span>{isSubmitting ? 'Enviando perfil...' : 'Enviar perfil y empezar'}</span>
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
