import { salvarLeiturasDeSaude } from '@/hooks/use-health-metrics'
import { WORKOUT_VERSAO_ATUAL } from '@/hooks/use-workouts'
import { parseRepsRange } from '@/lib/workout-phases'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { toast } from 'sonner'

import { useAuth } from '@/hooks/use-auth'
import { useHealthCalc } from '@/hooks/useHealthCalc'
import { homaInputsFrom, lipidInputsFrom } from '@/lib/clinical-inputs'
import { todayInSaoPaulo } from '@/lib/date'
import { supabase } from '@/lib/supabase'
import type { DocumentImportTipo } from '@/types/database'

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
export const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

type ExameMarcador = {
  chave: string
  label: string
  valor: number
  unidade: string
  referencia_min: number | null
  referencia_max: number | null
  status: 'normal' | 'atencao' | 'alerta'
}

type DadosExame = {
  tipo: 'exame'
  data_coleta: string | null
  laboratorio: string | null
  marcadores: ExameMarcador[]
}

type ExercicioExtraido = {
  nome: string
  grupo_muscular: string
  series_alvo: number
  reps_alvo: string
  pausa_seg: number | null
  cadencia: string | null
  carga_sugerida_kg: number | null
  notas: string | null
}

type DadosTreino = {
  tipo: 'treino'
  nome_treino: string
  foco: string
  exercicios: ExercicioExtraido[]
}

type RefeicaoExtraida = {
  numero: number
  nome: string
  horario: string | null
  tipo: string
  calorias_alvo: number | null
  proteina_g_alvo: number | null
  carbo_g_alvo: number | null
  gordura_g_alvo: number | null
  alimentos: string[]
  notas: string | null
}

type DadosDieta = {
  tipo: 'dieta'
  nome_plano: string
  calorias_alvo: number | null
  proteina_g: number | null
  carbo_g: number | null
  gordura_g: number | null
  refeicoes: RefeicaoExtraida[]
}

type SuplementoExtraido = {
  nome: string
  tipo: string
  dose: string
  unidade: string
  momento: string
  dias_semana: string[] | null
  notas: string | null
}

type DadosSuplemento = {
  tipo: 'suplemento'
  suplementos: SuplementoExtraido[]
}

export type DadosExtraidos = DadosExame | DadosTreino | DadosDieta | DadosSuplemento

function extensionFromFile(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName) return fromName
  return file.type === 'application/pdf' ? 'pdf' : 'jpg'
}

/** Encontra um exercício do usuário pelo nome (case-insensitive) ou cria um novo. */
async function findOrCreateExercise(userId: string, nome: string, grupoMuscular: string): Promise<string> {
  const { data: existing, error: findError } = await supabase
    .from('exercises')
    .select('id')
    .eq('user_id', userId)
    .ilike('nome', nome.trim())
    .limit(1)
    .maybeSingle()
  if (findError) throw findError
  if (existing) return existing.id as string

  const { data: created, error: createError } = await supabase
    .from('exercises')
    .insert({ user_id: userId, nome: nome.trim(), grupo_muscular: grupoMuscular })
    .select('id')
    .single()
  if (createError) throw createError
  return created.id as string
}

async function aplicarExame(userId: string, dados: DadosExame) {
  const measuredAt = dados.data_coleta ?? todayInSaoPaulo()
  // Mesmo laudo relançado atualiza as leituras do dia em vez de duplicar.
  await salvarLeiturasDeSaude(
    userId,
    measuredAt,
    dados.marcadores.map((marcador) => ({ chave: marcador.chave, valor: marcador.valor })),
  )
}

async function aplicarTreino(userId: string, dados: DadosTreino) {
  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .insert({ user_id: userId, nome: dados.nome_treino, foco: dados.foco, versao: WORKOUT_VERSAO_ATUAL, arquivado: false })
    .select('id')
    .single()
  if (workoutError) throw workoutError

  for (const [index, exercicio] of dados.exercicios.entries()) {
    const exerciseId = await findOrCreateExercise(userId, exercicio.nome, exercicio.grupo_muscular)
    const { error: prescricaoError } = await supabase.from('workout_exercises').insert({
      user_id: userId,
      workout_id: workout.id,
      exercise_id: exerciseId,
      ordem: index + 1,
      series_alvo: exercicio.series_alvo,
      reps_alvo: exercicio.reps_alvo,
      reps_min: parseRepsRange(exercicio.reps_alvo).min,
      reps_max: parseRepsRange(exercicio.reps_alvo).max,
      fase: 'treino',
      pausa_alvo_seg: exercicio.pausa_seg,
      cadencia_alvo: exercicio.cadencia,
      notas: exercicio.notas,
    })
    if (prescricaoError) throw prescricaoError
  }
}

async function aplicarDieta(userId: string, dados: DadosDieta) {
  const { data: dietPlan, error: dietPlanError } = await supabase
    .from('diet_plans')
    .insert({
      user_id: userId,
      nome: dados.nome_plano,
      calorias_alvo: dados.calorias_alvo,
      proteina_g: dados.proteina_g,
      carbo_g: dados.carbo_g,
      gordura_g: dados.gordura_g,
      ativo: true,
    })
    .select('id')
    .single()
  if (dietPlanError) throw dietPlanError

  const rows = dados.refeicoes.map((refeicao) => ({
    user_id: userId,
    diet_plan_id: dietPlan.id,
    numero: refeicao.numero,
    nome: refeicao.nome,
    horario_alvo: refeicao.horario,
    tipo: refeicao.tipo,
    calorias_alvo: refeicao.calorias_alvo,
    proteina_g_alvo: refeicao.proteina_g_alvo,
    carbo_g_alvo: refeicao.carbo_g_alvo,
    gordura_g_alvo: refeicao.gordura_g_alvo,
    notas: refeicao.notas,
  }))
  const { error: slotsError } = await supabase.from('meal_slots').insert(rows)
  if (slotsError) throw slotsError
}

async function aplicarSuplemento(userId: string, dados: DadosSuplemento) {
  const rows = dados.suplementos.map((suplemento) => ({
    user_id: userId,
    nome: suplemento.nome,
    tipo: suplemento.tipo,
    dose: suplemento.dose,
    unidade: suplemento.unidade,
    momento: suplemento.momento,
    dias_semana: suplemento.dias_semana,
    notas: suplemento.notas,
    ativo: true,
  }))
  const { error } = await supabase.from('supplements').insert(rows)
  if (error) throw error
}

export function useDocumentVision() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { calcHOMAIR, calcCholesterolRatio } = useHealthCalc()
  const [processando, setProcessando] = useState(false)
  const [dadosExtraidos, setDadosExtraidos] = useState<DadosExtraidos | null>(null)
  const [importId, setImportId] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function enviarDocumento(arquivo: File, tipo: DocumentImportTipo) {
    if (!user) throw new Error('Usuário não autenticado')
    setProcessando(true)
    setErro(null)
    setDadosExtraidos(null)
    setImportId(null)

    try {
      const ext = extensionFromFile(arquivo)
      const storagePath = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage.from('documents').upload(storagePath, arquivo, {
        contentType: arquivo.type,
      })
      if (uploadError) throw uploadError

      const { data: created, error: createError } = await supabase
        .from('document_imports')
        .insert({ user_id: user.id, tipo, storage_path: storagePath, status: 'pendente' })
        .select('id')
        .single()
      if (createError) throw createError
      setImportId(created.id as string)

      const { data, error: invokeError } = await supabase.functions.invoke<{ dados?: DadosExtraidos; error?: string }>(
        'forja-vision',
        { body: { document_import_id: created.id } },
      )

      if (invokeError) {
        if (invokeError instanceof FunctionsHttpError) {
          try {
            const responseBody = await invokeError.context.clone().json()
            if (responseBody?.error) throw new Error(responseBody.error)
          } catch {
            // corpo não era JSON com `error` — segue com a mensagem genérica
          }
        }
        throw invokeError
      }
      if (!data?.dados) throw new Error(data?.error ?? 'A IA não retornou dados deste documento.')

      setDadosExtraidos(data.dados)
      return data.dados
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao processar o documento.'
      setErro(message)
      throw err
    } finally {
      setProcessando(false)
    }
  }

  async function aplicarDados(dados: DadosExtraidos) {
    if (!user) throw new Error('Usuário não autenticado')
    switch (dados.tipo) {
      case 'exame':
        await aplicarExame(user.id, dados)
        break
      case 'treino':
        await aplicarTreino(user.id, dados)
        break
      case 'dieta':
        await aplicarDieta(user.id, dados)
        break
      case 'suplemento':
        await aplicarSuplemento(user.id, dados)
        break
    }

    queryClient.invalidateQueries({ queryKey: ['health-metrics'] })
    queryClient.invalidateQueries({ queryKey: ['workouts'] })
    queryClient.invalidateQueries({ queryKey: ['exercises'] })
    queryClient.invalidateQueries({ queryKey: ['workout-exercises'] })
    queryClient.invalidateQueries({ queryKey: ['diet-plans'] })
    queryClient.invalidateQueries({ queryKey: ['meal-slots'] })
    queryClient.invalidateQueries({ queryKey: ['supplements'] })
  }

  /**
   * Exame confirmado → cálculos derivados automáticos (HOMA-IR, ratios lipídicos).
   * Em segundo plano: falha aqui não desfaz a importação, só avisa.
   */
  function dispararCalculosDoExame(dados: DadosExame) {
    const homa = homaInputsFrom(dados.marcadores)
    if (homa) {
      calcHOMAIR(homa.glicemia, homa.insulina)
        .then(() => toast.success('📊 HOMA-IR calculado — ver Placar de Saúde'))
        .catch(() => toast.error('Não foi possível calcular o HOMA-IR agora.'))
    }
    const lipidios = lipidInputsFrom(dados.marcadores)
    if (lipidios) {
      calcCholesterolRatio(lipidios.colesterol_total, lipidios.hdl, lipidios.ldl, lipidios.triglicerides)
        .then(() => toast.success('📊 Ratios lipídicos calculados'))
        .catch(() => toast.error('Não foi possível calcular os ratios lipídicos agora.'))
    }
  }

  async function confirmar(dadosEditados?: DadosExtraidos) {
    if (!importId) throw new Error('Nenhuma importação em andamento')
    const dadosFinais = dadosEditados ?? dadosExtraidos
    if (!dadosFinais) throw new Error('Nenhum dado extraído para confirmar')

    await aplicarDados(dadosFinais)

    const { error } = await supabase
      .from('document_imports')
      .update({ dados_confirmados: dadosFinais, status: 'confirmado' })
      .eq('id', importId)
    if (error) throw error

    queryClient.invalidateQueries({ queryKey: ['document-imports'] })
    setDadosExtraidos(null)
    setImportId(null)

    if (dadosFinais.tipo === 'exame') dispararCalculosDoExame(dadosFinais)
  }

  async function rejeitar() {
    if (!importId) return
    const { error } = await supabase.from('document_imports').update({ status: 'rejeitado' }).eq('id', importId)
    if (error) throw error

    queryClient.invalidateQueries({ queryKey: ['document-imports'] })
    setDadosExtraidos(null)
    setImportId(null)
  }

  function limpar() {
    setDadosExtraidos(null)
    setImportId(null)
    setErro(null)
  }

  return { processando, dadosExtraidos, importId, erro, enviarDocumento, confirmar, rejeitar, limpar }
}
