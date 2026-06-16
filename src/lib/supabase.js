import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── Team Members ──────────────────────────────────
export async function getTeamMembers() {
  const { data, error } = await supabase
    .from('al_team_members')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

export async function upsertMember(member) {
  const { data, error } = await supabase.rpc('al_upsert_member', {
    p_id:       member.id || null,
    p_name:     member.name,
    p_initials: member.initials,
    p_role:     member.role,
    p_color:    member.color || '#3b82f6',
    p_email:    member.email || null,
  })
  if (error) throw error
  return data
}

export async function deactivateMember(id) {
  const { error } = await supabase.rpc('al_deactivate_member', { p_id: id })
  if (error) throw error
}

export async function activateMember(id) {
  const { error } = await supabase.rpc('al_activate_member', { p_id: id })
  if (error) throw error
}

export async function getAllMembers() {
  const { data, error } = await supabase
    .from('al_team_members_all')
    .select('*')
    .order('active', { ascending: false })
    .order('name')
  if (error) throw error
  return data
}

// ── Proyectos CRUD ────────────────────────────────
export async function upsertProject(project) {
  const { data, error } = await supabase.rpc('al_upsert_project', {
    p_id:          project.id || null,
    p_name:        project.name,
    p_client:      project.client || null,
    p_status:      project.status || 'planning',
    p_progress:    project.progress || 0,
    p_estimated:   project.estimated || 0,
    p_budget:      project.budget ? parseFloat(project.budget) : null,
    p_leader_id:   project.leader_id || null,
    p_due_date:    project.due_date || null,
    p_description: project.description || null,
  })
  if (error) throw error
  return data
}

export async function deleteProject(id) {
  const { error } = await supabase.rpc('al_delete_project', { p_id: id })
  if (error) throw error
}

// ── Proyectos ──────────────────────────────────────
export async function getProjects() {
  const { data, error } = await supabase
    .from('al_projects')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  // Reshape leader into nested object for compatibility
  return (data || []).map(p => ({
    ...p,
    leader: p.leader_name ? {
      name: p.leader_name, initials: p.leader_initials, color: p.leader_color
    } : null
  }))
}

// ── Riesgos ───────────────────────────────────────
export async function getRisks() {
  const { data, error } = await supabase
    .from('al_risks')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(r => ({ ...r, project: { name: r.project_name } }))
}

// ── Actividad ─────────────────────────────────────
export async function getActivity(limit = 10) {
  const { data, error } = await supabase
    .from('al_activity')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data || []).map(a => ({
    ...a,
    actor:   a.actor_name ? { name: a.actor_name, initials: a.actor_initials, color: a.actor_color } : null,
    project: a.project_name ? { name: a.project_name } : null,
  }))
}

export async function addComment(projectId, actorId, content) {
  const { error } = await supabase.rpc('al_add_activity', {
    p_project_id: projectId,
    p_actor_id:   actorId || null,
    p_type:       'comment',
    p_content:    content,
  })
  if (error) throw error
}

// ── Tareas ────────────────────────────────────────
export async function getTasksByProject(projectId) {
  const { data, error } = await supabase
    .from('al_tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at')
  if (error) throw error
  return (data || []).map(t => ({
    ...t,
    assigned: t.assigned_name ? { name: t.assigned_name, initials: t.assigned_initials, color: t.assigned_color } : null
  }))
}

// ── Workload ──────────────────────────────────────
export async function getWorkload(weekStart) {
  const { data, error } = await supabase
    .from('al_workload')
    .select('*')
    .eq('week_start', weekStart)
    .order('day_of_week')
  if (error) throw error
  return (data || []).map(w => ({
    ...w,
    member:  w.member_name ? { id: w.member_id, name: w.member_name, initials: w.member_initials, color: w.member_color } : null,
    project: w.project_name ? { name: w.project_name } : null,
  }))
}

// ── KPI Dashboard ─────────────────────────────────
export async function getDashboardKPIs() {
  const [pRes, rRes, mRes] = await Promise.all([
    supabase.from('al_projects').select('status,progress,estimated'),
    supabase.from('al_risks').select('severity'),
    supabase.from('al_team_members').select('id'),
  ])
  const p = pRes.data || []
  const r = rRes.data || []
  const m = mRes.data || []
  const avgProgress = p.length ? (p.reduce((a, b) => a + b.progress, 0) / p.length).toFixed(1) : 0
  return {
    totalProjects: p.length,
    activeRisks:   r.length,
    avgProgress,
    teamSize:      m.length,
  }
}
