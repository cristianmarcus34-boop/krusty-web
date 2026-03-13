"use client";

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-8 text-black border-b-8 border-[#D32F2F] inline-block">
          Términos y Condiciones
        </h1>

        <div className="space-y-6 text-stone-700 leading-relaxed text-sm">
          <section>
            <h3 className="font-black text-black uppercase italic">1. Aceptación de los Términos</h3>
            <p>
              Al acceder y utilizar este Sitio Web de Krusty Burger Inc., operado técnicamente por <b>Agencia Powa</b>, el usuario acepta de manera plena y sin reservas los presentes Términos y Condiciones. Si no está de acuerdo, le sugerimos abstenerse de utilizar la plataforma.
            </p>
          </section>

          <section>
            <h3 className="font-black text-black uppercase italic">2. Uso de la Plataforma</h3>
            <p>
              El usuario se compromete a utilizar el sitio únicamente para realizar pedidos legítimos. Queda prohibida cualquier acción que pueda dañar la infraestructura de Krusty Burger o de Agencia Powa. Krusty Burger se reserva el derecho de cancelar pedidos que parezcan fraudulentos.
            </p>
          </section>

          <section>
            <h3 className="font-black text-black uppercase italic">3. Precios y Disponibilidad</h3>
            <p>
              Todos los precios están expresados en Pesos Argentinos e incluyen IVA. Krusty Burger se reserva el derecho de modificar los precios y la disponibilidad de los productos sin previo aviso. Las imágenes son de carácter ilustrativo (especialmente en el caso de las Rib-Wich).
            </p>
          </section>

          <section>
            <h3 className="font-black text-black uppercase italic">4. Responsabilidad de Agencia Powa</h3>
            <p>
              Agencia Powa actúa como el socio tecnológico encargado del desarrollo y mantenimiento del sitio. No se responsabiliza por la calidad del producto alimenticio final, la cual recae exclusivamente en la sucursal de Krusty Burger correspondiente.
            </p>
          </section>

          <p className="text-[10px] text-stone-400 pt-10 border-t">
            Krusty Burger Inc. © 2026 - Springfield Food Group.
          </p>
        </div>
      </div>
    </div>
  );
}