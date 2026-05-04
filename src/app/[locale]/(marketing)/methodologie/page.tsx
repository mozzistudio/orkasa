import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Méthodologie broker · Orkasa',
  description:
    'Le parcours complet d’une opération immobilière sur Orkasa, étape par étape, avec les actions automatiques et les CTAs vus par l’agent.',
}

const LAST_UPDATED = '4 mai 2026'

function PhaseHeading({
  number,
  title,
  subtitle,
}: {
  number: string
  title: string
  subtitle: string
}) {
  return (
    <header className="mb-6 border-b border-bone pb-4">
      <p className="font-mono text-[11px] uppercase tracking-[2px] text-steel">
        Phase {number}
      </p>
      <h2 className="mt-1 text-[24px] font-medium tracking-[-0.5px] text-ink md:text-[28px]">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-[14px] text-steel">{subtitle}</p>
    </header>
  )
}

function Step({
  n,
  title,
  trigger,
  action,
  cta,
}: {
  n: number | string
  title: string
  trigger: string
  action: string
  cta: string
}) {
  return (
    <article className="rounded-[4px] border border-bone bg-paper p-5">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] tabular-nums text-steel">
          {String(n).padStart(2, '0')}
        </span>
        <h3 className="text-[15px] font-medium leading-snug text-ink">
          {title}
        </h3>
      </div>
      <dl className="mt-3 grid gap-2.5 text-[13px] text-steel md:grid-cols-[120px_1fr]">
        <dt className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel-soft">
          Déclencheur
        </dt>
        <dd>{trigger}</dd>
        <dt className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel-soft">
          Action agent
        </dt>
        <dd>{action}</dd>
        <dt className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel-soft">
          Bouton
        </dt>
        <dd className="font-mono text-[12px] text-ink">{cta}</dd>
      </dl>
    </article>
  )
}

function CtaLegendItem({
  label,
  description,
}: {
  label: string
  description: string
}) {
  return (
    <div className="rounded-[4px] border border-bone bg-paper p-4">
      <p className="font-mono text-[11px] uppercase tracking-[1.5px] text-ink">
        {label}
      </p>
      <p className="mt-1.5 text-[13px] text-steel">{description}</p>
    </div>
  )
}

export default function MethodologiePage() {
  return (
    <div className="bg-paper">
      {/* Hero */}
      <section className="px-4 pt-16 pb-10 md:px-6 md:pt-24 md:pb-14">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-steel">
            Pour les associés et partenaires
          </p>
          <h1 className="mt-3 text-[36px] font-medium leading-[1.05] tracking-[-1px] text-ink md:text-[48px]">
            Le parcours d’une opération immobilière sur&nbsp;Orkasa
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-steel">
            Orkasa transforme la journée du broker en une suite de tâches
            claires : à chaque moment du parcours d’achat, le système crée la
            bonne tâche, propose le bon message à envoyer et garde la trace de
            ce qui s’est passé. Cette page documente le flow complet —{' '}
            <strong className="text-ink">9 phases, 35 étapes</strong> — et la
            façon dont l’agent interagit avec chaque tâche.
          </p>
          <p className="mt-5 max-w-2xl text-[14px] text-steel">
            Au lieu d’un CRM passif où il faut se rappeler quoi faire, Orkasa
            pousse à l’agent la prochaine action et déclenche automatiquement
            la suivante quand un événement se produit (visite faite, oferta
            créée, document chargé, etc.). L’agent reste maître du tempo, mais
            n’a jamais à chercher quoi faire ensuite.
          </p>
          <p className="mt-6 font-mono text-[11px] text-steel-soft">
            Dernière mise à jour : {LAST_UPDATED}
          </p>
        </div>
      </section>

      {/* Vue d'ensemble */}
      <section className="px-4 py-10 md:px-6 md:py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-[22px] font-medium tracking-[-0.5px] text-ink">
            Vue d’ensemble
          </h2>
          <p className="mt-3 max-w-2xl text-[14px] text-steel">
            Une opération typique passe par 9 phases. Chaque phase contient
            entre 1 et 6 étapes. Les flèches sont automatiques : le système
            avance dès qu’il détecte le bon signal (réponse WhatsApp, visite
            terminée, document validé, oferta acceptée…).
          </p>
          <ol className="mt-6 grid gap-2.5 md:grid-cols-2">
            {[
              ['1', 'Contact initial', '4 étapes — premier message → qualification → propositions de propriétés'],
              ['2', 'Visites', '3 étapes — rappel → visite du jour → décision post-visite'],
              ['3', 'Financement', '1 étape — simulation de prêt sur demande'],
              ['4', 'Négociation', '2 étapes — registrar oferta → transmettre au propriétaire'],
              ['5', 'Conformité (KYC)', '6 étapes — pièces d’identité, revenus, origine des fonds, PEP'],
              ['6', 'Cierre legal — promesa', '3 étapes — expediente abogado → borrador → promesa firmée'],
              ['7', 'Trámite bancario', '3 étapes — avalúo bancaire → confirmation → coordination notaire'],
              ['8', 'Cierre legal — vendeur + firma', '4 étapes — paz y salvos vendeur → inspection → escritura'],
              ['9', 'Entrega + Post-cierre', '8 étapes — remise des clés → suivi 1 mois / 3 mois / 6 mois / 1 an / annuel'],
            ].map(([num, title, sub]) => (
              <li
                key={num}
                className="rounded-[4px] border border-bone bg-paper p-3"
              >
                <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                  {num}
                </p>
                <p className="mt-0.5 text-[14px] font-medium text-ink">
                  {title}
                </p>
                <p className="mt-1 text-[12px] text-steel">{sub}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Légende des CTAs */}
      <section className="bg-paper-warm px-4 py-10 md:px-6 md:py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-[22px] font-medium tracking-[-0.5px] text-ink">
            Les boutons que voit l’agent
          </h2>
          <p className="mt-3 max-w-2xl text-[14px] text-steel">
            Chaque tâche affiche un bouton principal qui dépend du type
            d’action attendue, plus deux boutons secondaires :{' '}
            <em>Hecho</em> (marquer fait sans envoyer) et <em>Ignorar</em>{' '}
            (sauter la tâche, avec raison optionnelle).
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <CtaLegendItem
              label="WhatsApp"
              description="Ouvre WhatsApp avec un message pré-rempli (template). Le destinataire peut être le client, le vendeur, le notaire, l’avocat, le banquier ou le tasador selon l’étape. Le libellé du bouton change : Saludar, Pedir docs, Coordinar notario, Avisar abogado, Coordinar avalúo, Enviar oferta, etc."
            />
            <CtaLegendItem
              label="Llamar"
              description="Ouvre l’app téléphone du device avec le numéro pré-composé. Utilisé pour la qualification téléphonique."
            />
            <CtaLegendItem
              label="Decidir (deux choix)"
              description="Affiche deux boutons côte-à-côte : Interesado / No interesado. Utilisé pour les étapes de décision comme le seguimiento post-visite. La décision met à jour le statut de la propriété sur l’opération et déclenche la suite automatiquement."
            />
            <CtaLegendItem
              label="Pedir (documents)"
              description="Ouvre une modale qui liste les documents demandés et permet de générer une demande WhatsApp avec un lien d’upload pour le client."
            />
            <CtaLegendItem
              label="Oferta"
              description="Ouvre le formulaire de capture d’oferta (montant, conditions, vigencia). À la sauvegarde, déclenche l’étape 35 : transmettre la oferta au propriétaire."
            />
            <CtaLegendItem
              label="Simular (financement)"
              description="Ouvre le simulateur de prêt avec les données de la propriété et du client pré-remplies. Utilisé sur demande explicite du client."
            />
            <CtaLegendItem
              label="Agendar (visite)"
              description="Ouvre le formulaire de planification de visite (propriété, date, heure)."
            />
            <CtaLegendItem
              label="Revisar (compliance)"
              description="Navigue vers le dossier de compliance : utilisé quand une vérification PEP / sanctions remonte un match qui doit être levé manuellement."
            />
            <CtaLegendItem
              label="Listo / marquer fait"
              description="Étapes purement internes (vérifications, jalons) qui n’ont pas d’interaction externe. L’agent confirme simplement que c’est fait."
            />
          </div>
          <div className="mt-6 rounded-[4px] border border-bone bg-paper p-4">
            <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
              Auto-complétion
            </p>
            <p className="mt-1.5 text-[13px] text-steel">
              La majorité des tâches se ferment toutes seules : si l’agent
              envoie un WhatsApp depuis l’app, la tâche correspondante passe
              en <strong className="text-ink">done</strong> automatiquement.
              De même pour la création d’une oferta, le chargement d’un
              document, le passage d’une étape de deal, etc. L’agent ne perd
              pas de temps à cocher des cases.
            </p>
          </div>
          <div className="mt-3 rounded-[4px] border border-bone bg-paper p-4">
            <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
              Escalade
            </p>
            <p className="mt-1.5 text-[13px] text-steel">
              Chaque tâche a une date d’échéance et une date d’escalade.
              Si elle dépasse l’échéance, le badge passe en orange ; si elle
              dépasse l’escalade, elle passe en{' '}
              <strong className="text-signal-deep">RIESGO</strong> et apparaît
              en haut de la liste avec un tooltip qui explique pourquoi.
            </p>
          </div>
        </div>
      </section>

      {/* Phase 1 — Contact initial */}
      <section className="px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-4xl">
          <PhaseHeading
            number="1"
            title="Contact initial"
            subtitle="Du moment où le lead arrive (formulaire, portail, walk-in, référé) jusqu’à l’envoi des 3 premières propositions de propriétés."
          />
          <div className="space-y-3">
            <Step
              n={1}
              title="Envoyer le premier message WhatsApp au client"
              trigger="Quand un nouveau lead est créé."
              action="Se présenter, confirmer l’intérêt, proposer un échange."
              cta="WhatsApp · Saludar"
            />
            <Step
              n={2}
              title="Agendar appel de qualification"
              trigger="Quand le lead passe en statut « contacté »."
              action="Appeler pour comprendre budget, timing, zones préférées."
              cta="Llamar"
            />
            <Step
              n={3}
              title="Envoyer 3 propriétés au client et proposer des visites"
              trigger="Quand le lead passe en statut « qualifié »."
              action="Choisir les 3 meilleures options selon budget et zone, les envoyer par WhatsApp avec liens publics, et demander lesquelles il veut visiter."
              cta="WhatsApp · Enviar opciones"
            />
            <Step
              n={4}
              title="Relance 48h sans réponse"
              trigger="Automatique 48h après l’étape 3 si le client n’a pas répondu."
              action="Envoyer un rappel amical."
              cta="WhatsApp · Recordar"
            />
          </div>
        </div>
      </section>

      {/* Phase 2 — Visites */}
      <section className="bg-paper-warm px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-4xl">
          <PhaseHeading
            number="2"
            title="Visites"
            subtitle="Le client a choisi des propriétés à visiter. Cette phase encadre la visite et capture la décision juste après."
          />
          <div className="space-y-3">
            <Step
              n={6}
              title="Rappel de visite 24h avant"
              trigger="Quand une visite est planifiée."
              action="Confirmer la cita la veille par WhatsApp."
              cta="WhatsApp · Confirmar visita"
            />
            <Step
              n={7}
              title="Aujourd’hui : visite avec le client"
              trigger="Le matin du jour de la visite (cron quotidien)."
              action="Réviser l’historique du client, faire la visite, enregistrer le résultat après."
              cta="Voir le lead"
            />
            <Step
              n={8}
              title="Seguimiento post-visite : ¿le client veut avancer ?"
              trigger="Dès que la visite est marquée comme terminée."
              action="Parler au client (WhatsApp ou appel) et enregistrer sa décision avec deux boutons : Interesado / No interesado. Si Interesado, l’opération avance automatiquement en phase Négociation et l’étape 10 (Registrar oferta) apparaît. Si No interesado, la propriété passe en « descartada » sur l’opération avec une raison."
              cta="Decidir · Interesado / No interesado"
            />
          </div>
        </div>
      </section>

      {/* Phase 3 — Financement */}
      <section className="px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-4xl">
          <PhaseHeading
            number="3"
            title="Financement"
            subtitle="Étape optionnelle, déclenchée uniquement quand le client demande explicitement une simulation."
          />
          <div className="space-y-3">
            <Step
              n={9}
              title="Générer une simulation de financement"
              trigger="Quand le client demande explicitement une simulation (interaction « financing_request »)."
              action="Créer un PDF avec le calcul du prêt personnalisé et planifier un appel pour le revoir ensemble."
              cta="Simular"
            />
          </div>
        </div>
      </section>

      {/* Phase 4 — Négociation */}
      <section className="bg-paper-warm px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-4xl">
          <PhaseHeading
            number="4"
            title="Négociation"
            subtitle="Le client veut faire une oferta. On capture le montant et on transmet la lettre d’oferta formelle au propriétaire."
          />
          <div className="space-y-3">
            <Step
              n={10}
              title="Registrar la oferta du client"
              trigger="Quand l’opération avance en phase Négociation (typiquement via la décision « Interesado » de l’étape 8) ou quand le statut du lead passe en « negotiating »."
              action="Capturer le montant offert et les conditions dans le formulaire d’oferta. À la sauvegarde, le propriétaire est notifié automatiquement (étape 35)."
              cta="Oferta"
            />
            <Step
              n={35}
              title="Transmettre la oferta formelle au propriétaire"
              trigger="Automatique dès qu’une oferta est créée (étape 10)."
              action="Envoyer la carta d’oferta formelle (PDF avec lien public) au propriétaire par WhatsApp."
              cta="WhatsApp · Enviar oferta"
            />
          </div>
        </div>
      </section>

      {/* Phase 5 — Conformité */}
      <section className="px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-4xl">
          <PhaseHeading
            number="5"
            title="Conformité (KYC / origine des fonds)"
            subtitle="Une fois la oferta acceptée par le propriétaire, on ouvre le dossier de conformité du client. Documents obligatoires selon la loi 23 (Panama)."
          />
          <div className="space-y-3">
            <Step
              n={11}
              title="Demander pièce d’identité + justificatif de domicile"
              trigger="Quand la oferta est acceptée."
              action="Demander cédula panaméenne (ou passeport si étranger) + reçu d’électricité/eau de moins de 3 mois."
              cta="Pedir docs"
            />
            <Step
              n={12}
              title="Demander justificatifs de revenus"
              trigger="Quand l’étape 11 est faite."
              action="Salarié : 3 dernières fichas de pago ou lettre employeur. Indépendant : états financiers des 2 dernières années."
              cta="Pedir docs"
            />
            <Step
              n={13}
              title="Vérifier que les revenus couvrent la cuota"
              trigger="Quand l’étape 12 est faite."
              action="Confirmer que la mensualité ne dépasse pas 30 % du revenu mensuel."
              cta="Listo"
            />
            <Step
              n={14}
              title="Demander origine des fonds"
              trigger="Quand l’étape 13 est faite."
              action="Comptant : états bancaires 6 mois + lettre de constitution des fonds. Crédit : états bancaires 6 mois + pré-approbation du banque."
              cta="Pedir docs"
            />
            <Step
              n={15}
              title="Question PEP (personne politiquement exposée)"
              trigger="Quand l’étape 14 est faite ET le montant dépasse 300 000 USD."
              action="Demander si le client a des proches à des postes gouvernementaux. Si oui, documents supplémentaires selon l’origine des fonds."
              cta="WhatsApp · Preguntar PEP"
            />
            <Step
              n={16}
              title="Lever un match de vérification"
              trigger="Quand le système flag un match suspect (PEP / sanctions)."
              action="Aller dans le dossier compliance, examiner le match, le valider ou le rejeter avec justification."
              cta="Revisar"
            />
          </div>
        </div>
      </section>

      {/* Phase 6 — Cierre legal (promesa) */}
      <section className="bg-paper-warm px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-4xl">
          <PhaseHeading
            number="6"
            title="Cierre legal — promesa de compraventa"
            subtitle="Le dossier compliance est complet. On rédige et on fait signer la promesa de compraventa."
          />
          <div className="space-y-3">
            <Step
              n={17}
              title="Notifier l’avocat — préparer la promesa"
              trigger="Quand la conformité est approuvée."
              action="Envoyer le dossier complet à l’avocat par WhatsApp pour qu’il prépare le borrador de promesa."
              cta="WhatsApp · Avisar abogado"
            />
            <Step
              n={18}
              title="Envoyer le borrador au client et au vendeur"
              trigger="Quand le deal passe en stage « promesa_firmada »."
              action="Partager le PDF de la promesa pour que les deux parties revoient et envoient leurs commentaires."
              cta="WhatsApp · Enviar borrador"
            />
            <Step
              n={19}
              title="Promesa signée — démarrer le suivi bancaire"
              trigger="Quand le deal passe en stage « tramite_bancario »."
              action="La promesa est signée et les arras (10 %) sont payées. Démarrer le suivi hebdomadaire du processus bancaire."
              cta="Listo"
            />
          </div>
        </div>
      </section>

      {/* Phase 7 — Trámite bancario */}
      <section className="px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-4xl">
          <PhaseHeading
            number="7"
            title="Trámite bancario"
            subtitle="Le banque fait son avalúo, approuve le prêt, et on coordonne avec le notaire la firma de la escritura."
          />
          <div className="space-y-3">
            <Step
              n={20}
              title="Coordonner l’avalúo bancaire"
              trigger="Quand le deal passe en stage « tramite_bancario »."
              action="Contacter le tasador (ou le banquier en backup) par WhatsApp pour fixer la cita d’avalúo, puis confirmer l’accès avec le propriétaire."
              cta="WhatsApp · Coordinar avalúo"
            />
            <Step
              n={21}
              title="Confirmer que l’avalúo est fait"
              trigger="Quand un avalúo est marqué comme terminé."
              action="Vérifier que la valeur de l’avalúo coïncide avec le prix de vente. Si elle est inférieure, renégocier."
              cta="Listo"
            />
            <Step
              n={22}
              title="Coordonner la escritura avec le notaire"
              trigger="Quand le deal passe en stage « escritura_publica »."
              action="Coordonner avec le notaire la date de firma de la escritura, par WhatsApp."
              cta="WhatsApp · Coordinar notario"
            />
          </div>
        </div>
      </section>

      {/* Phase 8 — Cierre legal (vendeur + firma) */}
      <section className="bg-paper-warm px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-4xl">
          <PhaseHeading
            number="8"
            title="Cierre legal — documents vendeur + firma"
            subtitle="On collecte les paz y salvos du vendeur et on fait l’inspection finale avant la firma de la escritura pública."
          />
          <div className="space-y-3">
            <Step
              n={23}
              title="Demander documents au vendeur"
              trigger="Quand le deal passe en stage « escritura_publica »."
              action="Paz y salvo nacional + municipal, certificat du Registro Público (< 30 jours sans gravámenes), reçus de services publics à jour. Pour appartements/condos : ajouter certificat de quotas de maintenance."
              cta="WhatsApp · Pedir docs"
            />
            <Step
              n={24}
              title="Vérification finale + confirmation de la fecha de cierre"
              trigger="Quand l’étape 23 est faite."
              action="Réviser que tout est en ordre et notifier les deux parties de la fecha confirmée du cierre."
              cta="Listo"
            />
            <Step
              n={25}
              title="Inspection finale de la propriété"
              trigger="Quand l’étape 24 est faite."
              action="Inspection 1 semaine avant le cierre. S’il y a des problèmes, négocier réparation ou ajustement de prix."
              cta="Agendar"
            />
            <Step
              n={26}
              title="Jour de la firma — escritura pública"
              trigger="Quand l’étape 25 est faite."
              action="Enregistrer le paiement final (90 % du solde), fermer les interactions du deal et démarrer le trámite au Registro Público."
              cta="Listo"
            />
          </div>
        </div>
      </section>

      {/* Phase 9 — Entrega + Post-cierre */}
      <section className="px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-4xl">
          <PhaseHeading
            number="9"
            title="Entrega + Post-cierre"
            subtitle="Remise des clés, message de remerciement, demande de review, puis suivi long terme (1 mois, 3 mois, 6 mois, anniversaire, annuel)."
          />
          <div className="space-y-3">
            <Step
              n={27}
              title="Coordonner la remise des clés"
              trigger="Quand le deal passe en stage « entrega_llaves »."
              action="Planifier la remise, envoyer un message de merci et demander une review (Google, LinkedIn, Instagram)."
              cta="WhatsApp · Agradecer"
            />
            <Step
              n={28}
              title="Signer le acta d’entrega"
              trigger="Quand l’étape 27 est faite."
              action="Documenter la remise complète (clé principale + parking + bodega + buzón + remotes). Notifier l’administration de l’immeuble."
              cta="Listo"
            />
            <Step
              n={29}
              title="Envoyer copie certifiée de l’escritura"
              trigger="Automatique 15 jours après la fecha de cierre (cron quotidien)."
              action="Le Registro Público a complété le trámite. Envoyer la copie certifiée au client."
              cta="WhatsApp · Enviar escritura"
            />
            <Step
              n={30}
              title="Suivi 1 mois — installation"
              trigger="Automatique 30 jours après le cierre."
              action="Check-in amical : « Comment t’installes-tu ? Besoin de contacts (plombier, électricien, mudanza) ? »"
              cta="WhatsApp · Check-in 1 mes"
            />
            <Step
              n={31}
              title="Suivi 3 mois — pedir referidos"
              trigger="Automatique 90 jours après le cierre."
              action="Demander si le client connaît quelqu’un qui cherche une propriété. Offrir un incentive si applicable."
              cta="WhatsApp · Pedir referidos"
            />
            <Step
              n={32}
              title="Suivi 6 mois — encuesta de satisfaction"
              trigger="Automatique 180 jours après le cierre."
              action="Envoyer une encuesta courte (1-5 estrellas + question ouverte) pour mesurer la satisfaction."
              cta="WhatsApp · Encuesta"
            />
            <Step
              n={33}
              title="Anniversaire 1 an — message spécial"
              trigger="Automatique 365 jours après le cierre."
              action="Envoyer une felicitation d’aniversario. Si client VIP, envoyer un cadeau ou un souvenir photographique."
              cta="WhatsApp · Felicitar"
            />
            <Step
              n={34}
              title="Check-in annuel"
              trigger="Automatique tous les 365 jours après le cierre."
              action="Contact léger pour maintenir la relation active. « J’espère que tout va bien avec la propriété. »"
              cta="WhatsApp · Saludar"
            />
          </div>
        </div>
      </section>

      {/* Footer note */}
      <section className="border-t border-bone px-4 py-10 md:px-6 md:py-14">
        <div className="mx-auto max-w-4xl">
          <p className="text-[13px] text-steel">
            Cette page est la source de vérité du flow opérationnel. Elle est
            mise à jour à chaque modification du catalogue de tâches (ajout
            d’une étape, changement de déclencheur, nouveau type de CTA).
          </p>
          <p className="mt-3 font-mono text-[11px] text-steel-soft">
            Dernière mise à jour : {LAST_UPDATED}
          </p>
        </div>
      </section>
    </div>
  )
}
