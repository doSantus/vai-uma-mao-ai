import { userError } from './errors';
export function createOAuthCallback(exchange, redirect) {
  const exchanges=new Map();
  return async(value)=>{
    if(!value)return false;
    let url;
    try {url=new URL(value);} catch{return false;}
    if(`${url.protocol}//${url.host}${url.pathname}`!==redirect)return false;
    if(url.searchParams.has('error'))throw userError('A entrada com Google não foi autorizada. Tente novamente.');
    const code=url.searchParams.get('code');
    if(!code)return false;
    if(!exchanges.has(code)){
      const flowId=url.searchParams.get('sb_flow_id');
      exchanges.set(code,exchange(code,flowId?{flowId}:undefined));
      if(exchanges.size>10)exchanges.delete(exchanges.keys().next().value);
    }
    await exchanges.get(code);return true;
  };
}
