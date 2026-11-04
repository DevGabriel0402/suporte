import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isOverdue, updateWithHistory } from '../src/utils/taskHistory.js';
test('prazo vence após o dia informado e ignora encerrados', () => {
  assert.equal(isOverdue({dueDate:'2026-11-04',status:'Pendente'},'2026-11-04'),false);
  assert.equal(isOverdue({dueDate:'2026-11-03',status:'Pendente'},'2026-11-04'),true);
  for (const status of ['Concluído','Cancelado']) assert.equal(isOverdue({dueDate:'2026-11-03',status},'2026-11-04'),false);
  assert.equal(isOverdue({status:'Pendente'},'2026-11-04'),false);
});
test('alteração preserva edição simultânea e histórico anterior', () => {
  const original={id:'1',status:'Pendente',notes:'',history:[]};
  const current={...original,notes:'Retorno da direção',history:[{id:'prior'}]};
  const next=updateWithHistory(current,{...original,status:'Em andamento'},original,{uid:'u',name:'Ana'},'2026-11-04T12:00:00Z','event');
  assert.equal(next.notes,current.notes);
  assert.equal(next.history.length,2);
  assert.deepEqual(next.history[1].changes,[{field:'status',before:'Pendente',after:'Em andamento'}]);
  assert.equal(next.history[1].actor.name,'Ana');
});
test('salvar sem mudanças não cria evento e legado aceita novos campos', () => {
  const old={id:'1',status:'Pendente'};
  assert.equal(updateWithHistory(old,{...old,assignee:'',dueDate:''},old,{},'now','e'),old);
  const next=updateWithHistory(old,{...old,assignee:'Ana',dueDate:'2026-11-05'},old,{},'now','e');
  assert.equal(next.history.length,1);
  assert.equal(next.history[0].changes.length,2);
});
