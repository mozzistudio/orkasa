/**
 * Static blog post catalog. Replace with a CMS later if needed — the shape
 * stays the same.
 *
 * Each post is rendered by `app/[locale]/(marketing)/blog/[slug]/page.tsx`
 * using the `body` field as React-friendly markdown-lite (we don't ship
 * a full markdown processor — content is hand-written JSX-friendly text
 * split into paragraphs and headings via a tiny renderer in the page).
 */

export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  date: string
  author: string
  authorRole: string
  readTime: string
  tag: string
  /**
   * Body uses a tiny grammar:
   * - `## ` prefix → h2
   * - `### ` prefix → h3
   * - `- ` prefix → unordered list item
   * - empty line → paragraph break
   * - `> ` prefix → blockquote
   * - `\`code\`` → inline code (backticks)
   */
  body: string
}

export const POSTS: readonly BlogPost[] = [
  {
    slug: 'multi-publicacion-portales-latam',
    title: 'Cómo funciona la multi-publicación adaptada por portal',
    excerpt:
      'No alcanza con copiar y pegar el mismo texto en 8 portales. Cada plataforma tiene un tono, un límite de caracteres, y reglas que castigan o premian — explicamos cómo Orkasa adapta cada listing automáticamente.',
    date: '2026-04-22',
    author: 'Equipo Orkasa',
    authorRole: 'Producto',
    readTime: '6 min',
    tag: 'Producto',
    body: `Si publicás en E24, Inmuebles24, ZonaProp y Facebook con el mismo texto, dos cosas pasan: o el algoritmo de uno de ellos te degrada por copy genérico, o tu CTR cae 40% porque el tono no encaja con el lector.

Después de hablar con 30 brokers en Panamá, RD y Colombia, encontramos un patrón: todos copiaban-pegaban porque adaptar manualmente para 8 portales toma horas. Esa fricción es lo que Orkasa elimina.

## Por qué cada portal es distinto

Los portales no son intercambiables. Tres dimensiones importan:

### 1. Límites técnicos

Inmuebles24 corta el título a 60 caracteres. E24 acepta 80. Idealista llega a 100. Si no respetás el límite, o el portal corta tu mejor argumento por la mitad, o lo rechaza directamente.

### 2. Tono editorial

- **E24** y **Compreoalquile**: lectores en su mayoría compradores finales. Tono profesional, factual, lead con specs.
- **Inmuebles24** y **MercadoLibre**: misma audiencia pero con expectativa de "marketplace" — descripción larga premia, título conciso.
- **Facebook Marketplace**: scroll mobile, decisión en 3 segundos. Hook de precio + UN diferenciador, line breaks, CTA explícito.
- **Instagram Business**: lifestyle-driven, emojis aceptados, hashtags clave, foto carrusel.
- **WhatsApp Business**: ultra breve, link a la ficha, llamada a respuesta inmediata.

### 3. Vocabulario regional

"Departamento" en Argentina vs "apartamento" en Panamá vs "piso" en España. "Recámaras" en México vs "dormitorios" en RD. Si publicás en ZonaProp con "habitaciones", suena a turista.

## Cómo lo resuelve Orkasa

Cada portal tiene un \`AdapterSpec\` en nuestra config:

\`\`\`
{
  titleMax: 60,
  descriptionMax: 2000,
  tone: 'factual',
  appendsCta: false,
  styleNotes: 'Inmuebles24 (México) — title cap es duro a 60 chars. Usar español mexicano (recámaras, alberca, MN). Sin CTA: el portal inyecta su form.'
}
\`\`\`

Cuando hacés "Publicar", Claude Opus 4.7 toma tu copy original y lo re-escribe para cada destino respetando esos parámetros. Lo importante: vos validás cada versión antes de que se mande. Nunca publicamos texto sin que confirmes.

## El resultado en producción

En la prueba con Premier Real Estate (Panamá, 14 agentes), el tiempo de publicación bajó de **3 horas a 8 minutos** por listing. El click-through rate en E24 subió 22% porque los títulos pararon de cortarse al medio.

## Lo que sigue

Estamos sumando portales (Properati en EC y PE arranca el mes próximo) y experimentando con A/B testing automático: la IA puede proponer dos variantes de título y rotarlas durante la primera semana para ver cuál convierte mejor.

> El objetivo final es simple: que vos cargues una propiedad una vez, valides los textos en 60 segundos, y la mayor cobertura del mercado se haga sola.

¿Te interesa probar? El plan Solo arranca en USD 39/mes con 14 días gratis.`,
  },
  {
    slug: 'ia-en-listings-claude-vs-gemini',
    title: 'IA en listings: Claude para texto, Gemini para fotos',
    excerpt:
      'Por qué usamos dos modelos distintos en lugar de uno solo, y cómo decidimos qué pasa por cuál. Notas técnicas para curiosos y para clientes que quieren saber qué corre detrás.',
    date: '2026-04-15',
    author: 'Equipo Orkasa',
    authorRole: 'Engineering',
    readTime: '8 min',
    tag: 'Engineering',
    body: `La pregunta nos llegó tres veces esta semana: "¿por qué no usás un solo modelo de IA para todo?". Razonable — sería más simple. Pero después de probar varias combinaciones, llegamos a esto: **Claude Opus 4.7 para texto y razonamiento, Gemini 2.5 Flash Image para edición de fotos**.

## Lo que hace Claude

Claude maneja todo lo que requiere:

- **Razonamiento estructurado** — analizar specs de una propiedad y decidir qué destacar para qué portal.
- **Tono consistente** — escribir en español de Panamá, México, Argentina o España según el portal destino, sin mezclar.
- **Vision para fotos** — analizar imágenes y devolver score, crítica y orden sugerido (es un input al texto, no edición).
- **Compliance reasoning** — interpretar reglas de KYC y decidir cuándo escalar a un human review.

## Lo que hace Gemini

Gemini 2.5 Flash Image (lo que antes se llamaba "Nano Banana") es el único modelo que hoy edita imágenes con calidad consistente para inmuebles. Probamos:

- **DALL-E 3 / GPT-Image**: muy bueno para generación, malo para edición preservando layout.
- **Stable Diffusion + ControlNet**: excelente control, pero requiere infraestructura y los resultados varían demasiado.
- **Imagen 3**: cierra cuando le pedís edición sutil, exagera todo.
- **Gemini 2.5 Flash Image**: edición real, conserva proporciones, no inventa muebles donde no había.

Cuatro casos de uso reales que cubrimos:

### 1. Reemplazo de cielo

Foto exterior con cielo gris → cielo despejado con golden hour suave. Sin halo en el horizonte (un problema común con SD).

### 2. Mejora de iluminación

Living oscuro → living equilibrado, sin el look HDR sintético que castiga al ojo.

### 3. Decluttering

Sacar objetos personales (juguetes, ropa colgada, foto familiar en la mesa) sin alterar muebles fijos. Crítico para showings.

### 4. Virtual staging

Ambiente vacío → muebles neutros contemporáneos. Útil para PRP (proceso reducido de promoción) en obras nuevas.

## Por qué dos modelos y no uno

Hay tres razones técnicas:

### Calidad por dominio

Cada modelo es state-of-the-art en su dominio. Pedirle a Claude que edite imágenes pixel-a-pixel sería como pedirle a Gemini que escriba un contrato — funciona, pero no al nivel del especialista.

### Costo

Claude Opus es caro pero rápido para razonamiento. Una llamada de listing studio cuesta ~$0.04. Si pasáramos las imágenes por Claude para edición, cada listing nos saldría $0.30+ por foto.

Gemini 2.5 Flash Image cuesta ~$0.01 por edición. Mantener costos bajos nos permite ofrecer 200 mejoras de fotos por mes en el plan Team.

### Velocidad

Listing studio (texto) tarda 3-5 segundos. Edición de foto tarda 5-10 segundos. Si fuera secuencial sería frustrante. Los corremos en paralelo cuando hay batch.

## Lo que queda fuera del alcance de la IA

Por más buenos que sean los modelos, hay decisiones que mantenemos en manos del agente:

- **Precio sugerido** — la IA puede dar comparables, pero el precio lo pone el broker.
- **Veracidad de specs** — si el dueño dijo "180m²" y son 165m², la IA no detecta eso. Es responsabilidad del agente medir.
- **Decisiones de compliance** — un match en lista OFAC es un trigger automático, pero la decisión de avanzar o no es humana.

> La IA acelera lo mecánico. La decisión sigue siendo del broker. Ese es el modelo que defendemos.

## Lo que sigue

En roadmap:
- Generación de planos 2D a partir de fotos (probablemente otro modelo especialista).
- Voz a texto para notas de visita en mobile (probablemente Whisper).
- Embeddings vectoriales para búsqueda semántica de inventario.

Cada feature usará el modelo que sea mejor para esa tarea. Eso significa más complejidad para nosotros — y más calidad para el usuario.`,
  },
  {
    slug: 'compliance-kyc-inmobiliario-panama',
    title: 'KYC inmobiliario en Panamá: lo que cambió en 2026',
    excerpt:
      'La Superintendencia ajustó los requisitos de debida diligencia para operaciones >$100K. Qué tenés que documentar, en qué plazo, y cómo Orkasa te lo ordena.',
    date: '2026-03-30',
    author: 'Equipo Orkasa',
    authorRole: 'Compliance',
    readTime: '5 min',
    tag: 'Compliance',
    body: `En enero de 2026 entró en vigencia el Acuerdo 4-2025 de la UAF (Unidad de Análisis Financiero), que ajustó los requisitos de debida diligencia para sujetos obligados del sector inmobiliario en Panamá. Si sos broker o agente, esto te aplica.

Resumen ejecutivo: **más documentación, plazos más cortos, sanciones más altas**. La buena noticia es que la mayoría de los cambios son ordenamiento del proceso, no nuevos formularios.

## Qué cambió

### 1. Umbral de aplicación

Antes: USD 10,000 en efectivo o USD 50,000 en operación total disparaba KYC reforzado.

Ahora: cualquier operación inmobiliaria > USD 100,000 requiere KYC completo, independientemente del medio de pago. La Ley 23 sigue aplicando para efectivo > USD 10K, pero el umbral inmobiliario específico ahora es global.

### 2. Origen de fondos

Antes: declaración firmada del cliente.

Ahora: declaración firmada **+ documentación de respaldo proporcional al monto**. Para operaciones > USD 250K se requiere prueba documental: estados bancarios de los últimos 6 meses, escritura de venta del activo previo, o ITBI / declaración de renta certificada.

### 3. Beneficiario final (UBO)

Persona jurídica compradora: identificar y documentar a todo beneficiario final con > 25% de participación. Antes era con > 50%.

Si la cadena societaria tiene tres niveles, cada nivel debe estar documentado. La UAF está auditando esto activamente.

### 4. Plazo de retención

Antes: 5 años desde el cierre.

Ahora: 10 años desde el cierre. Aplica a expedientes nuevos a partir de enero 2026.

## PEP — Personas Expuestas Políticamente

La definición se expandió. Ahora incluye:

- Funcionarios públicos panameños actuales y los últimos 5 años.
- **Familiares hasta segundo grado de consanguinidad y afinidad** (antes era primer grado).
- Allegados con relación comercial o societaria significativa.
- PEPs extranjeros si la operación supera USD 200K.

PEP positivo = due diligence reforzada obligatoria, aprobación senior interna, y monitoreo continuo de la operación.

## Listas de sanciones

Match obligatorio contra:

- ONU (lista consolidada de sanciones del Consejo de Seguridad)
- OFAC (Office of Foreign Assets Control, Estados Unidos)
- UE (Lista consolidada de sanciones financieras)
- Lista local UAF Panamá

La verificación debe documentarse con timestamp y dejarse en el expediente. Si hay match, suspender la operación inmediatamente y reportar a la UAF en 24 horas.

## Sanciones por incumplimiento

Las multas se ajustaron al alza:

- Documentación incompleta: USD 5,000 por expediente.
- No reporte de operación sospechosa (ROS) cuando correspondía: USD 50,000.
- Reincidencia: hasta el 10% del valor de la operación.

## Cómo Orkasa te ayuda

Los cambios son operacionales, no conceptuales. La parte difícil no es entender qué pedir, es:

- **Acordarte de pedirlo cuando arranca la negociación**, no al cierre.
- **Tener todo en un solo expediente** que la UAF pueda auditar sin saltar entre Excel, WhatsApp y carpetas.
- **No dejar pasar un PEP o un match en lista** porque nadie lo verificó.

Orkasa cubre esto:

- Cuando un lead pasa a estado "negociando" o "viewing scheduled", se dispara el flujo de KYC automáticamente.
- Pide los documentos correctos según el umbral de la operación y la nacionalidad del cliente.
- Hace screening contra OFAC, UN, UE y UAF en tiempo real, deja log inmodificable.
- Detecta PEP cruzando el cliente contra fuentes públicas + lista interna.
- Genera el borrador del ROS pre-completado, listo para revisión y firma del compliance officer.

> El compliance officer pasa de hacer el trámite a auditar el trámite que hizo la herramienta. Es la diferencia entre 4 horas y 30 minutos por expediente.

## Lo que NO automatizamos

- La **decisión** de continuar con un cliente PEP es humana.
- La **firma** del ROS es humana.
- El **criterio** de qué constituye una operación sospechosa es humano.

La tecnología acelera y ordena. El criterio de riesgo sigue siendo profesional.

## Para profundizar

- Acuerdo 4-2025 UAF: [uaf.gob.pa](#)
- Ley 23 de 2015: [organojudicial.gob.pa](#)
- [Guía de compliance de Orkasa](/recursos/compliance) — matriz completa por país LATAM.

¿Caso particular? Escribinos a compliance@orkasa.io.`,
  },
] as const

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug)
}
