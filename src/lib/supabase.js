import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── Proyectos ──────────────────────────────────────
export async function getProjects() {
  const { data, error } = await supabase
    .schema('area_leader')
    .from('projects')
    .select(`
      *,
      leader:team_members(id, name, initials, color)
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateProjectStatus(id, status) {
  const { error } = await supabase
    .schema('area_leader')
    .from('projects')
    .update({ status })
    .eq('id', id)
  if (error) throw error
}

// ── Riesgos ───────────────────────────────────────
export async function getRisks() {
  const { data, error } = await supabase
    .schema('area_leader')
    .from('risks')
    .select(`*, project:projects(name)`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ── Actividad ─────────────────────────────────────
export async function getActivity(limit = 10) {
  const { data, error } = await supabase
    .schema('area_leader')
    .from('activity')
    .select(`
      *,
      actor:team_members(name, initials, color),
      project:projects(name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function addComment(projectId, actorId, content) {
  const { error } = await supabase
    .schema('area_leader')
    .from('activity')
    .insert({ project_id: projectId, actor_id: actorId, type: 'comment', content })
  if (error) throw error
}

// ── Tareas ────────────────────────────────────────
export async function getTasksByProject(projectId) {
  const { data, error } = await supabase
    .schema('area_leader')
    .from('tasks')
    .select(`*, assigned:team_members(name, initials, color)`)
    .eq('project_id', projectId)
    .order('created_at')
  if (error) throw error
  return data
}

// ── Team Members ──────────────────────────────────
export async function getTeamMembers() {
  const { data, error } = await supabase
    .schema('area_leader')
    .from('team_members')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

// ── Workload ──────────────────────────────────────
export async function getWorkload(weekStart) {
  const { data, error } = await supabase
    .schema('area_leader')
    .from('workload')
    .select(`
      *,
      member:team_members(id, name, initials, color),
      project:projects(name)
    `)
    .eq('week_start', weekStart)
    .order('day_of_week')
  if (error) throw error
  return data
}

// ── KPI Dashboard ─────────────────────────────────
export async function getDashboardKPIs() {
  const [projects, risks, members] = await Promise.all([
    supabase.schema('area_leader').from('projects').select('status, progress, estimated'),
    supabase.schema('area_leader').from('risks').select('severity'),
    supabase.schema('area_leader').from('team_members').select('id'),
  ])
  const p = projects.data || []
  const r = risks.data || []
  const totalProjects = p.length
  const activeRisks = r.length
  const avgProgress = p.reduce((a, b) => a + b.progress, 0) / (p.length || 1)
  return { totalProjects, activeRisks, avgProgress: avgProgress.toFixed(1), teamSize: members.data?.length || 0 }
}
