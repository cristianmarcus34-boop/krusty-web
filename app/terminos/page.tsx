// app/terminos/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TerminosPage() {
  const [fechaActual, setFechaActual] = useState('');

  useEffect(() => {
    const ahora = new Date();
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    setFechaActual(`${meses[ahora.getMonth()]} ${ahora.getFullYear()}`);
  }, []);

  return (
    <div className="min-h-screen bg-[#FFCA28] pt-24 pb-16 px-6 flex flex-col items-center">
      {/* Botón Volver */}
      <div className="max-w-4xl w-full mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white border-4 border-black px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-[4px_4px_0px_0px_black] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
        >
          ← Volver al Menú
        </Link>
      </div>

      <div className="max-w-4xl w-full bg-white border-8 border-black p-8 md:p-12 rounded-[3rem] shadow-[15px_15px_0px_0px_black]">
        {/* Badge de versión */}
        <div className="flex justify-between items-center mb-6">
          <div className="inline-flex items-center gap-2 bg-stone-100 border-2 border-black px-4 py-1.5 rounded-full text-[10px] font-black text-stone-500">
            <span>📋</span>
            <span>v1.0.0</span>
            <span className="w-1 h-1 rounded-full bg-stone-300" />
            <span>{fechaActual}</span>
          </div>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Términos y Condiciones - Krusty Burger',
                  text: '📋 Términos y Condiciones de Krusty Burger',
                  url: window.location.href,
                }).catch(() => { });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('✅ Enlace copiado al portapapeles');
              }
            }}
            className="bg-[#FFCA28] border-2 border-black px-4 py-2 rounded-full font-black text-xs shadow-[2px_2px_0px_0px_black] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
          >
            📤 Compartir
          </button>
        </div>

        <h1 className="font-krusty text-4xl md:text-5xl text-black uppercase tracking-tighter mb-8 border-b-8 border-[#D32F2F] pb-4">
          📋 Términos y Condiciones
        </h1>

        <div className="space-y-8 text-stone-700 leading-relaxed text-sm md:text-base">
          {/* 1. Aceptación */}
          <section>
            <h3 className="font-krusty text-xl text-[#D32F2F] uppercase mb-2">
              📌 1. Aceptación de los Términos
            </h3>
            <p className="font-bold text-stone-600">
              Al utilizar la aplicación y el sitio web de Krusty Burger, operado técnicamente por <span className="text-[#D32F2F]">Agencia Powa</span>, aceptas cumplir con estos Términos y Condiciones.
            </p>
            <p className="mt-2">
              Si no estás de acuerdo con alguna de estas cláusulas, te sugerimos abstenerte de utilizar la plataforma. El uso continuo implica la aceptación plena de los presentes términos.
            </p>
          </section>

          {/* 2. Registro y Cuenta */}
          <section>
            <h3 className="font-krusty text-xl text-[#D32F2F] uppercase mb-2">
              📝 2. Registro y Cuenta
            </h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Para usar la aplicación, debes registrarte con información verídica y actualizada.</li>
              <li>Eres responsable de mantener la confidencialidad de tu contraseña.</li>
              <li>Puedes eliminar tu cuenta en cualquier momento desde la sección de perfil.</li>
              <li>Krusty Burger se reserva el derecho de cancelar cuentas que parezcan fraudulentas.</li>
            </ul>
          </section>

          {/* 3. Uso de la Plataforma */}
          <section>
            <h3 className="font-krusty text-xl text-[#D32F2F] uppercase mb-2">
              💻 3. Uso de la Plataforma
            </h3>
            <ul className="list-disc list-inside space-y-1">
              <li>El usuario se compromete a utilizar el sitio únicamente para realizar pedidos legítimos.</li>
              <li>Queda prohibida cualquier acción que pueda dañar la infraestructura de Krusty Burger.</li>
              <li>Los pedidos con datos falsos o fraudulentos serán cancelados sin previo aviso.</li>
            </ul>
          </section>

          {/* 4. Precios y Disponibilidad */}
          <section>
            <h3 className="font-krusty text-xl text-[#D32F2F] uppercase mb-2">
              💰 4. Precios y Disponibilidad
            </h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Todos los precios están expresados en Pesos Argentinos (ARS) e incluyen IVA.</li>
              <li>Krusty Burger se reserva el derecho de modificar los precios y la disponibilidad de los productos sin previo aviso.</li>
              <li>Las imágenes de los productos son de carácter ilustrativo (especialmente en el caso de las Rib-Wich 🍖).</li>
            </ul>
          </section>

          {/* 5. Pagos y Reembolsos */}
          <section>
            <h3 className="font-krusty text-xl text-[#D32F2F] uppercase mb-2">
              💳 5. Pagos y Reembolsos
            </h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Los pagos se procesan a través de Mercado Pago o en efectivo contra entrega.</li>
              <li>Los reembolsos se realizan dentro de los 5 minutos posteriores a la recepción del pedido.</li>
              <li>En caso de error en el cobro, contactanos para resolverlo a la brevedad.</li>
            </ul>
          </section>

          {/* 6. Programa de Puntos */}
          <section>
            <h3 className="font-krusty text-xl text-[#D32F2F] uppercase mb-2">
              ⭐ 6. Programa de Puntos
            </h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Los puntos se acumulan por cada compra realizada en la plataforma.</li>
              <li>Los puntos tienen una validez de <span className="font-bold">1 año</span> desde su obtención.</li>
              <li>Los puntos no son transferibles ni canjeables por dinero en efectivo.</li>
              <li>Krusty Burger se reserva el derecho de modificar el programa de puntos.</li>
            </ul>
          </section>

          {/* 7. Entregas */}
          <section>
            <h3 className="font-krusty text-xl text-[#D32F2F] uppercase mb-2">
              🚚 7. Entregas
            </h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Los tiempos de entrega son estimados y pueden variar por factores externos.</li>
              <li>La distancia de entrega está limitada a <span className="font-bold">7 km</span> del local momentáneamente.</li>
              <li>El costo de envío se calcula automáticamente según la distancia y el tipo de entrega.</li>
              <li>El repartidor esperará un máximo de 5 minutos en el punto de entrega.</li>
            </ul>
          </section>

          {/* 8. Privacidad */}
          <section>
            <h3 className="font-krusty text-xl text-[#D32F2F] uppercase mb-2">
              🔒 8. Privacidad
            </h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Tus datos personales están protegidos según la <span className="font-bold">Ley 25.326</span> (Habeas Data).</li>
              <li>No compartimos tus datos con terceros sin tu consentimiento explícito.</li>
              <li>Podés solicitar la eliminación de tus datos en cualquier momento desde el perfil.</li>
              <li>Más detalles en nuestra <Link href="/privacidad" className="text-[#D32F2F] font-bold hover:underline">Política de Privacidad</Link>.</li>
            </ul>
          </section>

          {/* 9. Responsabilidad de Agencia Powa */}
          <section>
            <h3 className="font-krusty text-xl text-[#D32F2F] uppercase mb-2">
              🛠️ 9. Responsabilidad de Agencia Powa
            </h3>
            <p>
              <span className="font-bold text-[#D32F2F]">Agencia Powa</span> actúa como el socio tecnológico encargado del desarrollo y mantenimiento del sitio web y la aplicación.
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>No se responsabiliza por la calidad del producto alimenticio final, la cual recae exclusivamente en la sucursal de Krusty Burger correspondiente.</li>
              <li>La disponibilidad del servicio está sujeta a la infraestructura tecnológica y conexión a internet.</li>
            </ul>
          </section>

          {/* 10. Ley Aplicable */}
          <section>
            <h3 className="font-krusty text-xl text-[#D32F2F] uppercase mb-2">
              ⚖️ 10. Ley Aplicable
            </h3>
            <p>
              Estos Términos se rigen por las leyes de la <span className="font-bold">República Argentina</span>.
              Cualquier disputa será resuelta en los tribunales de la Ciudad Autónoma de Buenos Aires.
            </p>
          </section>

          {/* 11. Contacto */}
          <section>
            <h3 className="font-krusty text-xl text-[#D32F2F] uppercase mb-2">
              📞 11. Contacto
            </h3>
            <p>
              Si tenés preguntas sobre estos Términos, contactanos en:
            </p>
            <div className="bg-stone-50 border-4 border-black p-4 rounded-2xl mt-2 flex flex-col md:flex-row gap-2 md:gap-6">
              <span className="font-bold">📧 agenciadigitalpowa@gmail.com</span>
              <span className="font-bold">📱 11-3830-5837</span>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-8 mt-8 border-t-4 border-black">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-[10px] font-black uppercase text-stone-400">
                Última actualización: {fechaActual}
              </p>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase text-stone-400">
                  📄 Documento legal
                </span>
                <span className="w-px h-4 bg-stone-300" />
                <span className="text-[10px] font-black uppercase text-[#D32F2F]">
                  v1.0.0
                </span>
              </div>
            </div>
            <p className="text-[10px] text-stone-400 text-center mt-6">
              Krusty Burger Inc. © {new Date().getFullYear()} - Springfield Food Group.
              <br />
              Desarrollado por <span className="text-[#D32F2F] font-bold">Agencia Digital Powa</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}