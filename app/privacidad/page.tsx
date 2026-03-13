"use client";

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Estilo McDonald's: Títulos grandes y limpios */}
        <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-8 text-black border-b-8 border-[#FFCA28] inline-block">
          Política de Privacidad
        </h1>

        <div className="space-y-6 text-stone-700 leading-relaxed text-sm">
          <section>
            <p className="font-bold text-black uppercase mb-2">
              Agencia Powa / Krusty Burger Inc.
            </p>
            <p>
              Agencia Powa, en representación de Krusty Burger Inc. (en adelante, “Krusty Burger”) se complace en comunicar la presente política de privacidad de su plataforma web (“Sitio Web”). Siéntase seguro de que Krusty Burger protege la privacidad de los datos de quienes acceden a nuestro Sitio Web.
            </p>
          </section>

          <section>
            <h3 className="font-black text-black uppercase italic">Utilización de Cookies</h3>
            <p>
              Queremos hacer de nuestro Sitio Web lo más divertido y útil posible. Krusty Burger utiliza “cookies” sólo para obtener información impersonal con el objetivo de mejorar su experiencia en línea, como el registro del número de personas que visitan la página de forma anónima. No asociamos la información de las “cookies” con información personal identificable.
            </p>
          </section>

          <section>
            <h3 className="font-black text-black uppercase italic">Información Recolectada</h3>
            <p>
              Krusty Burger solo recolecta información de identificación cuando los datos son proporcionados voluntariamente por el usuario. Asimismo, podremos recopilar datos de geolocalización, comportamiento de compra y preferencias de productos para mejorar nuestros envíos y promociones, siempre en cumplimiento con la <b>Ley de Protección de Datos Personales N°25.326</b> de la República Argentina.
            </p>
          </section>

          <section>
            <h3 className="font-black text-black uppercase italic">Menores de Edad</h3>
            <p>
              Krusty Burger es extremadamente cuidadoso con la privacidad de menores. No condicionamos la participación de menores en actividades en línea a menos que medie un adulto responsable. Recomendamos a los padres supervisar la actividad digital de sus hijos.
            </p>
          </section>

          <section>
            <h3 className="font-black text-black uppercase italic">Jurisdicción</h3>
            <p>
              Esta Política se rige por las leyes de la República Argentina. Ante cualquier conflicto, el usuario acepta la jurisdicción de los tribunales nacionales de la Ciudad Autónoma de Buenos Aires.
            </p>
          </section>

          <p className="text-[10px] text-stone-400 pt-10 border-t">
            Última actualización: Marzo 2026. Agencia Powa para Krusty Burger Inc.
          </p>
        </div>
      </div>
    </div>
  );
}