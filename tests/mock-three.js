(function(){
function mk(){ const f=function(){}; return new Proxy(f,{get(t,k){ if(k===Symbol.toPrimitive) return ()=>0; if(k==='then') return undefined; if(k==='length') return ()=>1; if(k==='count') return 0; if(!(k in t)) t[k]=mk(); return t[k];}, set(t,k,v){t[k]=v;return true;}, apply(){return mk();}, construct(){return mk();}}); }
window.THREE=new Proxy({},{get(t,k){ if(!(k in t)) t[k]=function(){ return mk(); }; return t[k];}});
})();
