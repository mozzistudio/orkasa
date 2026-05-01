'use client'

import { useReducer, useEffect } from 'react'
import { ChevronRight } from 'lucide-react'
import type { StoredImage } from '@/components/app/image-upload'
import type { IntegrationProvider, IntegrationProviderMeta } from '@/lib/integrations'
import { StageStep } from '@/components/app/publish-shared'
import { StepDetails } from './steps/step-details'
import { StepPhotos } from './steps/step-photos'
import { StepAIContent } from './steps/step-ai-content'
import { StepAIPhotos } from './steps/step-ai-photos'
import { StepPlatforms } from './steps/step-platforms'
import { StepPlatformContent } from './steps/step-platform-content'
import { StepPublish } from './steps/step-publish'

export type Neighborhood = {
  id: string
  name: string
  city: string
}

export type PropertyDetails = {
  property_type: string
  listing_type: string
  price: number | null
  currency: string
  bedrooms: number
  bathrooms: number
  area_m2: number | null
  address: string
  neighborhood: string
  city: string
}

type WizardState = {
  step: number
  details: PropertyDetails
  images: StoredImage[]
  title: string
  description: string
  selectedProviders: IntegrationProvider[]
  savedToDb: boolean
}

type WizardAction =
  | { type: 'SET_DETAILS'; details: PropertyDetails }
  | { type: 'SET_IMAGES'; images: StoredImage[] }
  | { type: 'SET_AI_CONTENT'; title: string; description: string }
  | { type: 'SET_PROVIDERS'; providers: IntegrationProvider[] }
  | { type: 'SET_STEP'; step: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'MARK_SAVED' }

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_DETAILS':
      return { ...state, details: action.details }
    case 'SET_IMAGES':
      return { ...state, images: action.images }
    case 'SET_AI_CONTENT':
      return { ...state, title: action.title, description: action.description }
    case 'SET_PROVIDERS':
      return { ...state, selectedProviders: action.providers }
    case 'SET_STEP':
      return { ...state, step: action.step }
    case 'NEXT_STEP':
      return { ...state, step: Math.min(state.step + 1, 7) }
    case 'PREV_STEP':
      return { ...state, step: Math.max(state.step - 1, 1) }
    case 'MARK_SAVED':
      return { ...state, savedToDb: true }
    default:
      return state
  }
}

const STEPS = [
  { num: 1, label: 'Detalles' },
  { num: 2, label: 'Fotos' },
  { num: 3, label: 'Título y descripción' },
  { num: 4, label: 'Fotos mejoradas' },
  { num: 5, label: 'Plataformas' },
  { num: 6, label: 'Contenido' },
  { num: 7, label: 'Publicar' },
]

export function CreateWizard({
  propertyId,
  brokerageId,
  neighborhoods,
  providers,
}: {
  propertyId: string
  brokerageId: string
  neighborhoods: Neighborhood[]
  providers: IntegrationProviderMeta[]
}) {
  const [state, dispatch] = useReducer(reducer, {
    step: 1,
    details: {
      property_type: 'apartment',
      listing_type: 'sale',
      price: null,
      currency: 'USD',
      bedrooms: 0,
      bathrooms: 0,
      area_m2: null,
      address: '',
      neighborhood: '',
      city: '',
    },
    images: [],
    title: '',
    description: '',
    selectedProviders: [],
    savedToDb: false,
  })

  useEffect(() => {
    if (state.savedToDb) return
    const handler = (e: BeforeUnloadEvent) => {
      if (state.step > 1) e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [state.savedToDb, state.step])

  return (
    <div>
      {/* Progress indicator */}
      <div className="-mx-4 mb-6 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap px-4 font-mono text-[10px] uppercase tracking-[1.5px] scrollbar-hide md:mx-0 md:mb-8 md:px-0">
        {STEPS.map((s, i) => (
          <span key={s.num} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight
                className="h-3 w-3 shrink-0 text-steel"
                strokeWidth={1.5}
              />
            )}
            <StageStep
              label={`${String(s.num).padStart(2, '0')} · ${s.label}`}
              active={state.step === s.num}
              done={state.step > s.num}
            />
          </span>
        ))}
      </div>

      {/* Step content */}
      {state.step === 1 && (
        <StepDetails
          details={state.details}
          neighborhoods={neighborhoods}
          onConfirm={(details) => {
            dispatch({ type: 'SET_DETAILS', details })
            dispatch({ type: 'NEXT_STEP' })
          }}
        />
      )}

      {state.step === 2 && (
        <StepPhotos
          propertyId={propertyId}
          brokerageId={brokerageId}
          images={state.images}
          details={state.details}
          onImagesChange={(images) =>
            dispatch({ type: 'SET_IMAGES', images })
          }
          onConfirm={() => {
            dispatch({ type: 'MARK_SAVED' })
            dispatch({ type: 'NEXT_STEP' })
          }}
          onBack={() => dispatch({ type: 'PREV_STEP' })}
        />
      )}

      {state.step === 3 && (
        <StepAIContent
          propertyId={propertyId}
          title={state.title}
          description={state.description}
          onConfirm={(title, description) => {
            dispatch({ type: 'SET_AI_CONTENT', title, description })
            dispatch({ type: 'NEXT_STEP' })
          }}
          onBack={() => dispatch({ type: 'PREV_STEP' })}
        />
      )}

      {state.step === 4 && (
        <StepAIPhotos
          propertyId={propertyId}
          images={state.images}
          onConfirm={(images) => {
            dispatch({ type: 'SET_IMAGES', images })
            dispatch({ type: 'NEXT_STEP' })
          }}
          onBack={() => dispatch({ type: 'PREV_STEP' })}
        />
      )}

      {state.step === 5 && (
        <StepPlatforms
          providers={providers}
          onConfirm={(selected) => {
            dispatch({ type: 'SET_PROVIDERS', providers: selected })
            dispatch({ type: 'NEXT_STEP' })
          }}
          onBack={() => dispatch({ type: 'PREV_STEP' })}
        />
      )}

      {state.step === 6 && (
        <StepPlatformContent
          propertyId={propertyId}
          images={state.images}
          providers={providers.filter((p) =>
            state.selectedProviders.includes(p.id),
          )}
          onPublish={() => dispatch({ type: 'NEXT_STEP' })}
          onBack={() => dispatch({ type: 'PREV_STEP' })}
        />
      )}

      {state.step === 7 && (
        <StepPublish
          propertyId={propertyId}
          providers={providers.filter((p) =>
            state.selectedProviders.includes(p.id),
          )}
        />
      )}
    </div>
  )
}
