import { Video, Users, MessageCircle } from 'lucide-react';

export default function Services() {
  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl font-serif">
            Meine Angebote
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Individuelle Lösungen für Ihre persönliche Situation.
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          
          <div className="pt-6">
            <div className="flow-root bg-white rounded-lg px-6 pb-8">
              <div className="-mt-6">
                <div>
                  <span className="inline-flex items-center justify-center p-3 bg-primary rounded-md shadow-lg">
                    <Video className="h-6 w-6 text-white" aria-hidden="true" />
                  </span>
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Einzeltherapie per Video</h3>
                <p className="mt-5 text-base text-gray-500">
                  Im vertraulichen 1:1 Gespräch widmen wir uns ganz Ihren Themen. Flexibel und ortsunabhängig via sicherem Video-Call.
                </p>
                <ul className="mt-4 list-disc list-inside text-sm text-gray-500 space-y-2">
                  <li>50 Minuten pro Sitzung</li>
                  <li>Flexible Terminplanung</li>
                  <li>Bequem von zu Hause</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <div className="flow-root bg-white rounded-lg px-6 pb-8">
              <div className="-mt-6">
                <div>
                  <span className="inline-flex items-center justify-center p-3 bg-secondary rounded-md shadow-lg">
                    <Users className="h-6 w-6 text-white" aria-hidden="true" />
                  </span>
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Gruppentherapie per Video</h3>
                <p className="mt-5 text-base text-gray-500">
                  Der Austausch mit anderen Betroffenen kann sehr heilsam sein. Gemeinsam lernen wir voneinander und stärken uns gegenseitig.
                </p>
                 <ul className="mt-4 list-disc list-inside text-sm text-gray-500 space-y-2">
                  <li>Kleingruppen (max. 6 Personen)</li>
                  <li>Wöchentliche Treffen</li>
                  <li>Geleiteter Austausch</li>
                </ul>
              </div>
            </div>
          </div>

           <div className="pt-6">
            <div className="flow-root bg-white rounded-lg px-6 pb-8">
              <div className="-mt-6">
                <div>
                  <span className="inline-flex items-center justify-center p-3 bg-accent rounded-md shadow-lg">
                    <MessageCircle className="h-6 w-6 text-white" aria-hidden="true" />
                  </span>
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Erstgespräch</h3>
                <p className="mt-5 text-base text-gray-500">
                  Lernen Sie mich und meine Arbeitsweise unverbindlich kennen. Wir besprechen Ihr Anliegen und klären erste Fragen.
                </p>
                 <ul className="mt-4 list-disc list-inside text-sm text-gray-500 space-y-2">
                  <li>Kostenloses Kennenlernen (20 Min.)</li>
                  <li>Klärung des Bedarfs</li>
                  <li>Keine Verpflichtung</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
