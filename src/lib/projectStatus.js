// Estados de proyecto compartidos entre ProjectModal y Projects.
// Estados finales: una vez en uno de estos, el proyecto no se puede borrar
// (al_delete_project lo archiva en su lugar — ver Settings/backend).
export const FINAL_STATUSES = ['completed', 'cancelled', 'closed']
