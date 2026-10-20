// Same-origin API via Vercel rewrite; cookies remain first-party to the frontend.
export const API_URL = '/api';
export type AdminUser = { id: number; firstName: string; lastName: string; email: string; role: string };
export type LoginResult = { user: AdminUser };
export type InternalTask = { id:number; title:string; description:string; customerName:string|null; priority:'LOW'|'NORMAL'|'HIGH'; status:'OPEN'|'IN_PROGRESS'|'CLOSED'; dueDate:string|null; createdAt:string; assignedToId:number|null };
async function request<T>(path:string, options:RequestInit = {}):Promise<T> {
  const res = await fetch(API_URL+path,{...options,credentials:'same-origin',headers:{'Content-Type':'application/json',...options.headers}});
  if(!res.ok){const error=await res.json().catch(()=>null);throw new Error(error?.message instanceof Array?error.message.join(', '):error?.message||'Serverfel ('+res.status+')');}
  return res.json() as Promise<T>;
}
export const login=(email:string,password:string)=>request<LoginResult>('/auth/login',{method:'POST',body:JSON.stringify({email,password})});
export const getSession=()=>request<LoginResult>('/auth/me');
export const logout=()=>request<{ok:boolean}>('/auth/logout',{method:'POST'});
export const getTasks=()=>request<InternalTask[]>('/internal-tasks');
export const createTask=(task:{title:string;description:string;customerName?:string;priority:string;dueDate?:string})=>request<InternalTask>('/internal-tasks',{method:'POST',body:JSON.stringify(task)});
export const updateTask=(id:number,task:Partial<Pick<InternalTask,'status'|'priority'>>)=>request<InternalTask>('/internal-tasks/'+id,{method:'PATCH',body:JSON.stringify(task)});
