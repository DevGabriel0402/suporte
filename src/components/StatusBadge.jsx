const map={'Pendente':'pending','Em andamento':'progress','Aguardando aprovação':'approval','Concluído':'done','Cancelado':'cancelled'};
export default function StatusBadge({status}){return <span className={`status-badge ${map[status]||'pending'}`}><i/>{status}</span>}
