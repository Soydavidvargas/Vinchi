'use client';

export type FeatureIllustrationKind =
  | 'qr'
  | 'pos'
  | 'fleet'
  | 'client_browse'
  | 'client_checkout'
  | 'client_tracking'
  | 'biz_launch'
  | 'biz_control'
  | 'biz_scale';

export interface FeatureIllustrationCardProps {
  kind: FeatureIllustrationKind;
  className?: string;
}

function QrMesaIllustration() {
  return (
    <svg
      viewBox="0 0 480 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full max-h-[270px]"
      role="img"
      aria-label="Ilustración minimalista de código QR en mesa conectado a carta digital y cocina"
    >
      {/* Fondo sutil cuadriculado blueprint */}
      <circle cx="240" cy="150" r="118" fill="#bc8ae1" fillOpacity="0.1" />
      <circle
        cx="240"
        cy="150"
        r="118"
        stroke="#bc8ae1"
        strokeOpacity="0.35"
        strokeWidth="1"
        strokeDasharray="4 6"
      />

      {/* Superficie de la mesa */}
      <path d="M58 240H422" stroke="#d0b7b0" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M108 240L96 268M372 240L384 268" stroke="#d0b7b0" strokeWidth="2.5" strokeLinecap="round" />

      {/* Hablador / Stand acrílico con QR en la mesa */}
      <path
        d="M112 240L122 146C123 140 128 136 134 136H198C204 136 209 140 210 146L220 240H112Z"
        fill="#ffffff"
        stroke="#442c61"
        strokeWidth="2"
      />
      <rect x="134" y="150" width="64" height="64" rx="10" fill="#fafafa" stroke="#e5e5e5" strokeWidth="1.5" />
      {/* Matriz QR minimalista */}
      <rect x="142" y="158" width="16" height="16" rx="3" stroke="#442c61" strokeWidth="2.5" />
      <rect x="147" y="163" width="6" height="6" rx="1" fill="#9c44dc" />
      <rect x="174" y="158" width="16" height="16" rx="3" stroke="#442c61" strokeWidth="2.5" />
      <rect x="179" y="163" width="6" height="6" rx="1" fill="#442c61" />
      <rect x="142" y="190" width="16" height="16" rx="3" stroke="#442c61" strokeWidth="2.5" />
      <rect x="147" y="195" width="6" height="6" rx="1" fill="#442c61" />
      <rect x="165" y="182" width="7" height="7" rx="1.5" fill="#9c44dc" />
      <rect x="176" y="182" width="6" height="6" rx="1.5" fill="#543b6c" />
      <rect x="184" y="191" width="6" height="6" rx="1.5" fill="#9c44dc" />
      <rect x="166" y="198" width="12" height="6" rx="1.5" fill="#442c61" />
      <text x="166" y="229" textAnchor="middle" fill="#543b6c" fontSize="9" fontFamily="monospace" fontWeight="600">
        MESA 04
      </text>

      {/* Ondas de escaneo hacia el teléfono */}
      <path
        d="M198 134C214 118 228 110 246 106"
        stroke="#9c44dc"
        strokeWidth="2"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />
      <circle cx="222" cy="117" r="4" fill="#9c44dc" />

      {/* Teléfono minimalista con plato digital */}
      <rect x="248" y="42" width="114" height="184" rx="22" fill="#442c61" />
      <rect x="254" y="48" width="102" height="172" rx="17" fill="#ffffff" />
      <rect x="288" y="54" width="34" height="6" rx="3" fill="#442c61" />

      {/* Contenido de la carta dentro del teléfono */}
      <rect x="264" y="72" width="82" height="58" rx="10" fill="#fafafa" stroke="#e5e5e5" strokeWidth="1.2" />
      <ellipse cx="305" cy="103" rx="24" ry="11" fill="#d0b7b0" fillOpacity="0.45" />
      <ellipse cx="305" cy="99" rx="22" ry="9" fill="#ffffff" stroke="#d0b7b0" strokeWidth="1.5" />
      <circle cx="305" cy="94" r="9" fill="#9c44dc" />
      <rect x="270" y="77" width="26" height="8" rx="4" fill="#bc8ae1" fillOpacity="0.4" />

      <rect x="264" y="138" width="54" height="7" rx="3.5" fill="#442c61" />
      <rect x="264" y="150" width="76" height="5" rx="2.5" fill="#bc8ae1" fillOpacity="0.6" />
      <rect x="264" y="160" width="60" height="5" rx="2.5" fill="#d0b7b0" />

      {/* Botón ordenar en el teléfono */}
      <rect x="264" y="182" width="82" height="24" rx="12" fill="#9c44dc" />
      <text x="305" y="197" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="600">
        Pedir · 0% Fee
      </text>

      {/* Flujo directo a campana de cocina */}
      <path
        d="M366 132H394C400 132 404 136 404 142V172"
        stroke="#9c645c"
        strokeWidth="2"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />
      <circle cx="404" cy="196" r="24" fill="#ffffff" stroke="#d0b7b0" strokeWidth="1.8" />
      <path
        d="M390 202H418M393 202C393 193.5 398 188 404 188C410 188 415 193.5 415 202"
        stroke="#442c61"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="404" cy="185" r="2.2" fill="#9c44dc" />
    </svg>
  );
}

function DashboardPosIllustration() {
  return (
    <svg
      viewBox="0 0 480 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full max-h-[270px]"
      role="img"
      aria-label="Ilustración minimalista de pantalla de caja y salón en tiempo real"
    >
      <circle cx="240" cy="150" r="118" fill="#bc8ae1" fillOpacity="0.1" />

      {/* Monitor POS */}
      <rect x="76" y="46" width="248" height="168" rx="20" fill="#442c61" />
      <rect x="85" y="55" width="230" height="150" rx="13" fill="#ffffff" />

      {/* Barra superior del POS */}
      <rect x="85" y="55" width="230" height="24" rx="13" fill="#fafafa" />
      <path d="M85 79H315" stroke="#e5e5e5" strokeWidth="1.2" />
      <circle cx="101" cy="67" r="4" fill="#9c44dc" />
      <rect x="112" y="64" width="52" height="6" rx="3" fill="#442c61" />
      <rect x="256" y="61" width="46" height="12" rx="6" fill="#bc8ae1" fillOpacity="0.3" />
      <text x="279" y="70" textAnchor="middle" fill="#442c61" fontSize="7.5" fontFamily="monospace" fontWeight="600">
        EN VIVO
      </text>

      {/* Grilla de mesas en salón (izquierda de pantalla POS) */}
      <rect x="97" y="90" width="44" height="44" rx="9" fill="#fafafa" stroke="#e5e5e5" strokeWidth="1.5" />
      <text x="119" y="110" textAnchor="middle" fill="#543b6c" fontSize="9" fontFamily="monospace" fontWeight="600">
        M-01
      </text>
      <rect x="108" y="118" width="22" height="5" rx="2.5" fill="#d0b7b0" />

      <rect x="148" y="90" width="44" height="44" rx="9" fill="#bc8ae1" fillOpacity="0.18" stroke="#9c44dc" strokeWidth="1.8" />
      <text x="170" y="110" textAnchor="middle" fill="#442c61" fontSize="9" fontFamily="monospace" fontWeight="700">
        M-04
      </text>
      <rect x="159" y="118" width="22" height="5" rx="2.5" fill="#9c44dc" />

      <rect x="97" y="142" width="44" height="44" rx="9" fill="#fafafa" stroke="#e5e5e5" strokeWidth="1.5" />
      <text x="119" y="162" textAnchor="middle" fill="#543b6c" fontSize="9" fontFamily="monospace" fontWeight="600">
        M-02
      </text>
      <rect x="108" y="170" width="22" height="5" rx="2.5" fill="#d0b7b0" />

      <rect x="148" y="142" width="44" height="44" rx="9" fill="#fafafa" stroke="#e5e5e5" strokeWidth="1.5" />
      <text x="170" y="162" textAnchor="middle" fill="#543b6c" fontSize="9" fontFamily="monospace" fontWeight="600">
        M-03
      </text>
      <rect x="159" y="170" width="22" height="5" rx="2.5" fill="#bc8ae1" />

      {/* Panel de cobro derecho dentro del POS */}
      <rect x="204" y="90" width="98" height="96" rx="10" fill="#fafafa" stroke="#e5e5e5" strokeWidth="1.5" />
      <text x="214" y="106" fill="#442c61" fontSize="8.5" fontFamily="monospace" fontWeight="700">
        #VN-1042
      </text>
      <rect x="214" y="115" width="76" height="5" rx="2.5" fill="#d0b7b0" />
      <rect x="214" y="126" width="58" height="5" rx="2.5" fill="#d0b7b0" />
      <path d="M214 142H292" stroke="#e5e5e5" strokeWidth="1.2" />
      <text x="214" y="155" fill="#442c61" fontSize="11" fontFamily="monospace" fontWeight="700">
        $78.000
      </text>
      <rect x="214" y="163" width="78" height="16" rx="8" fill="#9c44dc" />
      <text x="253" y="174" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="600">
        Cobrar 1-clic
      </text>

      {/* Base del terminal POS */}
      <path d="M180 214L170 244H230L220 214H180Z" fill="#543b6c" />
      <rect x="146" y="244" width="108" height="10" rx="5" fill="#442c61" />

      {/* Ticket / Comanda impresa al lado */}
      <rect x="342" y="102" width="76" height="118" rx="12" fill="#ffffff" stroke="#d0b7b0" strokeWidth="1.8" />
      <circle cx="380" cy="128" r="14" fill="#9c44dc" fillOpacity="0.15" />
      <path
        d="M374 128L378.5 132.5L387 123.5"
        stroke="#9c44dc"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="356" y="154" width="48" height="6" rx="3" fill="#442c61" />
      <rect x="356" y="166" width="38" height="5" rx="2.5" fill="#bc8ae1" />
      <rect x="356" y="178" width="48" height="5" rx="2.5" fill="#d0b7b0" />
      <rect x="356" y="196" width="48" height="12" rx="6" fill="#442c61" />
      <text x="380" y="205" textAnchor="middle" fill="#ffffff" fontSize="7" fontFamily="monospace">
        0% FEE
      </text>
    </svg>
  );
}

function FlotaSeguraIllustration() {
  return (
    <svg
      viewBox="0 0 480 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full max-h-[270px]"
      role="img"
      aria-label="Ilustración minimalista de verificación de identidad y ruta directa de domicilio"
    >
      <circle cx="240" cy="150" r="118" fill="#d0b7b0" fillOpacity="0.2" />

      {/* Tarjeta de verificación de identidad (izquierda) */}
      <rect x="64" y="56" width="142" height="178" rx="22" fill="#ffffff" stroke="#442c61" strokeWidth="2" />
      <rect x="82" y="72" width="106" height="18" rx="9" fill="#bc8ae1" fillOpacity="0.25" />
      <text x="135" y="84" textAnchor="middle" fill="#442c61" fontSize="8" fontFamily="monospace" fontWeight="700">
        IDENTIDAD OK
      </text>

      {/* Huella biométrica minimalista */}
      <circle cx="135" cy="136" r="34" fill="#fafafa" stroke="#e5e5e5" strokeWidth="1.5" />
      <path
        d="M119 144C119 130 126 120 135 120C144 120 151 130 151 144"
        stroke="#442c61"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M125 148C125 135 129 127 135 127C141 127 145 135 145 148"
        stroke="#9c44dc"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M131 151C131 141 132.8 134 135 134C137.2 134 139 141 139 151"
        stroke="#442c61"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="160" cy="112" r="11" fill="#9c44dc" />
      <path
        d="M155.5 112L158.5 115L164.5 109"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <rect x="86" y="186" width="98" height="7" rx="3.5" fill="#442c61" />
      <rect x="98" y="200" width="74" height="6" rx="3" fill="#9c645c" fillOpacity="0.7" />
      <rect x="92" y="213" width="86" height="10" rx="5" fill="#d0b7b0" fillOpacity="0.45" />

      {/* Ruta curva de entrega en tiempo real */}
      <path
        d="M214 176C254 176 262 114 318 114C352 114 368 158 398 158"
        stroke="#9c44dc"
        strokeWidth="2.5"
        strokeDasharray="6 6"
        strokeLinecap="round"
      />

      {/* Pin de origen (Local) */}
      <circle cx="242" cy="170" r="9" fill="#442c61" />
      <circle cx="242" cy="170" r="3.5" fill="#ffffff" />

      {/* Moto minimalista con caja térmica en ruta */}
      <g transform="translate(278, 86)">
        <circle cx="16" cy="48" r="11" stroke="#442c61" strokeWidth="3" fill="#ffffff" />
        <circle cx="16" cy="48" r="4" fill="#9c44dc" />
        <circle cx="60" cy="48" r="11" stroke="#442c61" strokeWidth="3" fill="#ffffff" />
        <circle cx="60" cy="48" r="4" fill="#9c44dc" />
        {/* Caja térmica */}
        <rect x="6" y="12" width="24" height="22" rx="5" fill="#9c44dc" />
        <rect x="10" y="18" width="16" height="4" rx="2" fill="#ffffff" fillOpacity="0.85" />
        {/* Chasis moto */}
        <path
          d="M16 48L28 32H48L60 48M44 20L54 48"
          stroke="#442c61"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M40 20H50" stroke="#543b6c" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Pin de destino (Casa del cliente) */}
      <rect x="374" y="170" width="46" height="46" rx="14" fill="#ffffff" stroke="#9c645c" strokeWidth="2" />
      <path
        d="M386 193L397 183L408 193M389 191V204H405V191"
        stroke="#442c61"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x="397" y="231" textAnchor="middle" fill="#9c645c" fontSize="9" fontFamily="monospace" fontWeight="600">
        ENTREGA DIRECTA
      </text>
    </svg>
  );
}

function ClientBrowseIllustration() {
  return (
    <svg
      viewBox="0 0 420 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full max-h-[210px]"
      role="img"
      aria-label="Ilustración minimalista de cliente explorando carta y catálogo en línea"
    >
      <circle cx="210" cy="110" r="90" fill="#bc8ae1" fillOpacity="0.12" />
      <rect x="76" y="28" width="130" height="164" rx="22" fill="#442c61" />
      <rect x="82" y="34" width="118" height="152" rx="17" fill="#ffffff" />
      <rect x="122" y="40" width="38" height="5" rx="2.5" fill="#442c61" />
      <rect x="94" y="56" width="94" height="36" rx="10" fill="#fafafa" stroke="#e5e5e5" />
      <circle cx="114" cy="74" r="10" fill="#9c44dc" />
      <rect x="131" y="67" width="44" height="6" rx="3" fill="#442c61" />
      <rect x="131" y="77" width="32" height="5" rx="2.5" fill="#bc8ae1" />
      <rect x="94" y="100" width="94" height="36" rx="10" fill="#fafafa" stroke="#e5e5e5" />
      <circle cx="114" cy="118" r="10" fill="#d0b7b0" />
      <rect x="131" y="111" width="48" height="6" rx="3" fill="#442c61" />
      <rect x="131" y="121" width="28" height="5" rx="2.5" fill="#9c645c" />
      <rect x="94" y="148" width="94" height="24" rx="12" fill="#9c44dc" />
      <text x="141" y="163" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="600">
        Agregar (2)
      </text>
      {/* Paloma / Sobre flotante conectando */}
      <path d="M214 96C238 80 258 80 282 96" stroke="#9c44dc" strokeWidth="2" strokeDasharray="4 4" />
      <rect x="278" y="64" width="84" height="92" rx="16" fill="#ffffff" stroke="#bc8ae1" strokeWidth="1.8" />
      <circle cx="320" cy="96" r="16" fill="#9c44dc" fillOpacity="0.14" />
      <circle cx="320" cy="96" r="7" fill="#9c44dc" />
      <rect x="296" y="122" width="48" height="6" rx="3" fill="#442c61" />
      <rect x="304" y="134" width="32" height="5" rx="2.5" fill="#d0b7b0" />
    </svg>
  );
}

function ClientCheckoutIllustration() {
  return (
    <svg
      viewBox="0 0 420 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full max-h-[210px]"
      role="img"
      aria-label="Ilustración minimalista de confirmación de compra sin recargos ocultos"
    >
      <circle cx="210" cy="110" r="90" fill="#d0b7b0" fillOpacity="0.18" />
      <rect x="90" y="34" width="240" height="152" rx="22" fill="#ffffff" stroke="#442c61" strokeWidth="2" />
      <rect x="110" y="54" width="90" height="24" rx="12" fill="#bc8ae1" fillOpacity="0.22" />
      <text x="155" y="69" textAnchor="middle" fill="#442c61" fontSize="9" fontWeight="700">
        0% RECARGO
      </text>
      <rect x="212" y="54" width="98" height="24" rx="12" fill="#fafafa" stroke="#e5e5e5" />
      <text x="261" y="69" textAnchor="middle" fill="#543b6c" fontSize="8.5" fontWeight="600">
        DOMICILIO
      </text>
      <rect x="110" y="92" width="120" height="7" rx="3.5" fill="#442c61" />
      <rect x="110" y="106" width="84" height="6" rx="3" fill="#bc8ae1" />
      <text x="268" y="108" fill="#0a0a0a" fontSize="14" fontFamily="monospace" fontWeight="700">
        $48.000
      </text>
      <rect x="110" y="132" width="200" height="32" rx="16" fill="#9c44dc" />
      <text x="210" y="152" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="600">
        Confirmar Pedido
      </text>
    </svg>
  );
}

function ClientTrackingIllustration() {
  return (
    <svg
      viewBox="0 0 420 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full max-h-[210px]"
      role="img"
      aria-label="Ilustración minimalista de seguimiento del envío hasta la puerta del cliente"
    >
      <circle cx="210" cy="110" r="90" fill="#bc8ae1" fillOpacity="0.12" />
      <path d="M84 136C134 136 164 76 214 76C264 76 286 136 336 136" stroke="#9c44dc" strokeWidth="3" strokeDasharray="6 6" strokeLinecap="round" />
      <circle cx="84" cy="136" r="16" fill="#442c61" />
      <circle cx="84" cy="136" r="6" fill="#ffffff" />
      <text x="84" y="170" textAnchor="middle" fill="#543b6c" fontSize="8.5" fontFamily="monospace" fontWeight="600">
        TIENDA
      </text>
      <rect x="174" y="42" width="80" height="44" rx="14" fill="#ffffff" stroke="#9c44dc" strokeWidth="2" />
      <text x="214" y="61" textAnchor="middle" fill="#442c61" fontSize="8.5" fontWeight="700">
        EN CAMINO
      </text>
      <text x="214" y="75" textAnchor="middle" fill="#9c44dc" fontSize="8" fontFamily="monospace" fontWeight="600">
        &lt; 5 KM · CHAT
      </text>
      <rect x="314" y="114" width="44" height="44" rx="14" fill="#ffffff" stroke="#9c645c" strokeWidth="2" />
      <path d="M325 137L336 127L347 137M328 135V147H344V135" stroke="#442c61" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="336" y="174" textAnchor="middle" fill="#9c645c" fontSize="8.5" fontFamily="monospace" fontWeight="600">
        TU PUERTA
      </text>
    </svg>
  );
}

function BizLaunchIllustration() {
  return (
    <svg
      viewBox="0 0 420 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full max-h-[210px]"
      role="img"
      aria-label="Ilustración minimalista de activación de local con agente certificado"
    >
      <circle cx="210" cy="110" r="90" fill="#442c61" fillOpacity="0.08" />
      <rect x="74" y="54" width="122" height="114" rx="18" fill="#ffffff" stroke="#442c61" strokeWidth="2" />
      <circle cx="135" cy="92" r="18" fill="#bc8ae1" fillOpacity="0.28" />
      <circle cx="135" cy="92" r="8" fill="#442c61" />
      <rect x="98" y="122" width="74" height="7" rx="3.5" fill="#442c61" />
      <rect x="108" y="136" width="54" height="16" rx="8" fill="#9c44dc" />
      <text x="135" y="147" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontWeight="600">
        AGENTE OK
      </text>
      <path d="M204 110H234" stroke="#9c44dc" strokeWidth="2.5" strokeDasharray="4 4" strokeLinecap="round" />
      <rect x="240" y="54" width="108" height="114" rx="18" fill="#442c61" />
      <rect x="258" y="76" width="72" height="12" rx="6" fill="#bc8ae1" fillOpacity="0.35" />
      <text x="294" y="85" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontFamily="monospace" fontWeight="700">
        ACTIVO HOY
      </text>
      <rect x="258" y="102" width="72" height="24" rx="10" fill="#9c44dc" />
      <text x="294" y="117" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="700">
        ABRIR LOCAL
      </text>
      <rect x="268" y="138" width="52" height="6" rx="3" fill="#ffffff" fillOpacity="0.5" />
    </svg>
  );
}

function BizControlIllustration() {
  return (
    <svg
      viewBox="0 0 420 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full max-h-[210px]"
      role="img"
      aria-label="Ilustración minimalista de control de cajas, ventas y 0% comisión"
    >
      <circle cx="210" cy="110" r="90" fill="#d0b7b0" fillOpacity="0.2" />
      <rect x="78" y="42" width="264" height="136" rx="20" fill="#ffffff" stroke="#442c61" strokeWidth="2" />
      <rect x="96" y="58" width="110" height="48" rx="12" fill="#fafafa" stroke="#e5e5e5" />
      <text x="110" y="77" fill="#543b6c" fontSize="8" fontWeight="600">
        COMISIÓN APP
      </text>
      <text x="110" y="96" fill="#9c44dc" fontSize="16" fontFamily="monospace" fontWeight="700">
        0% FEE
      </text>
      <rect x="218" y="58" width="106" height="48" rx="12" fill="#442c61" />
      <text x="232" y="77" fill="#bc8ae1" fontSize="8" fontWeight="600">
        CAJA DEL DÍA
      </text>
      <text x="232" y="96" fill="#ffffff" fontSize="14" fontFamily="monospace" fontWeight="700">
        100% TUYO
      </text>
      <rect x="96" y="120" width="50" height="38" rx="8" fill="#bc8ae1" fillOpacity="0.3" />
      <rect x="156" y="128" width="50" height="30" rx="8" fill="#d0b7b0" fillOpacity="0.5" />
      <rect x="216" y="114" width="50" height="44" rx="8" fill="#9c44dc" />
      <rect x="276" y="124" width="48" height="34" rx="8" fill="#442c61" />
    </svg>
  );
}

function BizScaleIllustration() {
  return (
    <svg
      viewBox="0 0 420 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full max-h-[210px]"
      role="img"
      aria-label="Ilustración minimalista de gestión de entregas con códigos seguros"
    >
      <circle cx="210" cy="110" r="90" fill="#bc8ae1" fillOpacity="0.14" />
      <rect x="80" y="48" width="116" height="124" rx="18" fill="#ffffff" stroke="#442c61" strokeWidth="2" />
      <text x="138" y="74" textAnchor="middle" fill="#442c61" fontSize="8.5" fontFamily="monospace" fontWeight="700">
        RECOGIDA
      </text>
      <rect x="100" y="88" width="76" height="28" rx="10" fill="#fafafa" stroke="#9c44dc" strokeWidth="1.6" />
      <text x="138" y="106" textAnchor="middle" fill="#9c44dc" fontSize="11" fontFamily="monospace" fontWeight="700">
        #4829
      </text>
      <rect x="104" y="130" width="68" height="20" rx="10" fill="#442c61" />
      <text x="138" y="143" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontWeight="600">
        DESPACHADO
      </text>
      <path d="M204 110H228" stroke="#9c645c" strokeWidth="2.5" strokeDasharray="4 4" />
      <rect x="234" y="48" width="106" height="124" rx="18" fill="#ffffff" stroke="#9c645c" strokeWidth="2" />
      <circle cx="287" cy="92" r="18" fill="#16a34a" fillOpacity="0.14" />
      <path d="M280 92L285 97L295 87" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="287" y="128" textAnchor="middle" fill="#442c61" fontSize="8.5" fontWeight="700">
        ENTREGA FINAL
      </text>
      <text x="287" y="144" textAnchor="middle" fill="#543b6c" fontSize="8" fontFamily="monospace">
        CÓDIGO OK
      </text>
    </svg>
  );
}

export function FeatureIllustrationCard({
  kind,
  className = '',
}: FeatureIllustrationCardProps) {
  return (
    <div
      className={`relative flex h-full min-h-[220px] w-full items-center justify-center overflow-hidden rounded-[24px] border border-[#bc8ae1]/55 bg-gradient-to-br from-[#faf5ff] to-[#f3e8ff]/70 p-4 shadow-[0_0_0_1px_rgba(68,44,97,0.08),0_4px_14px_-2px_rgba(68,44,97,0.10)] sm:p-6 ${className}`}
    >
      {kind === 'qr' && <QrMesaIllustration />}
      {kind === 'pos' && <DashboardPosIllustration />}
      {kind === 'fleet' && <FlotaSeguraIllustration />}
      {kind === 'client_browse' && <ClientBrowseIllustration />}
      {kind === 'client_checkout' && <ClientCheckoutIllustration />}
      {kind === 'client_tracking' && <ClientTrackingIllustration />}
      {kind === 'biz_launch' && <BizLaunchIllustration />}
      {kind === 'biz_control' && <BizControlIllustration />}
      {kind === 'biz_scale' && <BizScaleIllustration />}
    </div>
  );
}

export default FeatureIllustrationCard;
