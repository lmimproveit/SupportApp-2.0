export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export type AdminUser = { id: number; firstName: string; lastName: string; email: string; role: string };
export type LoginResult = { user: AdminUser; accessToken: string };
export type InternalTask = { id:number; title:string; description:string; customerName:string|null; priority:'LOW'|'NORMAL'|'HIGH'; status:'OPEN'|'IN_PROGRESS'|'CLOSED'; dueDate:string|null; createdAt:string; assignedToId:number|null };
async function request<T>(path:string, token:string|null, options:RequestInit = {}):Promise<T> {
  const res = await fetch(API_URL+path,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...options.headers}});
  if(!res.ok){const error=await res.json().catch(()=>null);throw new Error(error?.message instanceof Array?error.message.join(', '):error?.message||'Serverfel ('+res.status+')');}
  return res.json() as Promise<T>;
}
export const login=(email:string,password:string)=>request<LoginResult>('/auth/login',null,{method:'POST',body:JSON.stringify({email,password})});
export const getTasks=(token:string)=>request<InternalTask[]>('/internal-tasks',token);
export const createTask=(token:string,task:{title:string;description:string;customerName?:string;priority:string;dueDate?:string})=>request<InternalTask>('/internal-tasks',token,{method:'POST',body:JSON.stringify(task)});
export const updateTask=(token:string,id:number,task:Partial<Pick<InternalTask,'status'|'priority'>>)=>request<InternalTask>('/internal-tasks/'+id,token,{method:'PATCH',body:JSON.stringify(task)});
