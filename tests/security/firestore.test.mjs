import { readFile } from 'node:fs/promises';
import { before, after, beforeEach, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
let env;
const path='schools/a/data/workspace';
const task={id:'OS-1',room:'Secretaria',date:'2026-11-04',category:'Suporte',description:'Computador não liga',status:'Pendente',requested:false,priority:'Média'};
const workspace={rooms:['Secretaria'],tasksById:{'OS-1':task},mutationTaskId:'OS-1'};
const db=uid=>env.authenticatedContext(uid,{email:`${uid}@example.com`}).firestore();
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-conectati-security',firestore:{rules:await readFile('firestore.rules','utf8')}});});
after(async()=>{await env?.cleanup();});
beforeEach(async()=>{
 await env.clearFirestore();
 await env.withSecurityRulesDisabled(async ctx=>{
  const store=ctx.firestore();
  for(const [uid,role,schoolId,disabled] of [['admin','admin','a',false],['tech','tecnico','a',false],['other','admin','b',false],['blocked','admin','a',true],['master','master','a',false],['blocked-master','master','a',true]]) await setDoc(doc(store,'roles',uid),{role,schoolId,disabled,school:'Escola A'});
  await setDoc(doc(store,path),workspace);
 });
});
test('somente membros ativos podem ler a escola',async()=>{
 await assertSucceeds(getDoc(doc(db('tech'),path)));
 for(const store of [db('other'),db('blocked'),env.unauthenticatedContext().firestore()]) await assertFails(getDoc(doc(store,path)));
});
test('outra escola e usuário bloqueado não podem escrever',async()=>{
 for(const uid of ['other','blocked']) await assertFails(setDoc(doc(db(uid),path),workspace));
});
test('técnico pode atualizar chamado e administrador pode ordenar ambientes',async()=>{
 await assertSucceeds(setDoc(doc(db('tech'),path),{...workspace,tasksById:{'OS-1':{...task,status:'Em andamento',assignee:'Ana',dueDate:'2026-11-05'}}}));
 await assertSucceeds(updateDoc(doc(db('admin'),path),{rooms:['Biblioteca','Secretaria']}));
});
test('técnico não pode remover chamado nem alterar ambientes',async()=>{
 await assertFails(setDoc(doc(db('tech'),path),{...workspace,tasksById:{}}));
 await assertFails(updateDoc(doc(db('tech'),path),{rooms:['Biblioteca']}));
 await assertSucceeds(setDoc(doc(db('admin'),path),{...workspace,tasksById:{}}));
});
test('rejeita campos, tipos e valores inválidos',async()=>{
 for(const patch of [{status:'inventado'},{requested:'sim'},{description:'x'.repeat(4001)},{assignee:123},{dueDate:'amanhã'},{room:'Inexistente'},{admin:true}]) await assertFails(setDoc(doc(db('admin'),path),{...workspace,tasksById:{'OS-1':{...task,...patch}}}));
 await assertFails(setDoc(doc(db('admin'),path),{...workspace,injected:true}));
});
test('identificador de mutação não permite alterar outro chamado',async()=>{
 await assertFails(setDoc(doc(db('admin'),path),{...workspace,mutationTaskId:'OS-2',tasksById:{'OS-1':{...task,status:'Concluído'}}}));
});
test('usuário não pode promover o próprio perfil nem excluir workspace',async()=>{
 await assertFails(updateDoc(doc(db('tech'),'roles','tech'),{role:'master'}));
 await assertFails(deleteDoc(doc(db('admin'),path)));
});
test('master bloqueado não acessa configuração administrativa',async()=>{
 await assertFails(setDoc(doc(db('blocked-master'),'settings','support'),{whatsapp:'5511999999999'}));
 await assertSucceeds(setDoc(doc(db('master'),'settings','support'),{whatsapp:'5511999999999'}));
});
test('espaço individual é privado',async()=>{
 await assertSucceeds(setDoc(doc(db('admin'),'users/admin/data/workspace'),workspace));
 await assertFails(getDoc(doc(db('other'),'users/admin/data/workspace')));
});
test('migração do espaço individual preserva exatamente os registros legados',async()=>{
 await env.withSecurityRulesDisabled(ctx=>setDoc(doc(ctx.firestore(),'users/admin/data/workspace'),{rooms:['Secretaria'],tasks:[task]}));
 const target=doc(db('admin'),'users/admin/data/workspace');
 await assertFails(setDoc(target,{...workspace,mutationTaskId:'',tasksById:{'OS-1':{...task,status:'Concluído'},'OS-2':{...task,id:'OS-2'}}}));
 await assertSucceeds(setDoc(target,{...workspace,mutationTaskId:''}));
 await assertSucceeds(setDoc(target,{...workspace,tasksById:{'OS-1':{...task,status:'Concluído'}}}));
});
