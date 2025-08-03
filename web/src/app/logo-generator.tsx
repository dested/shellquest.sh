import React, { useEffect, useRef, useState } from 'react';

const LogoGenerator = () => {
  const canvasRef = useRef(null);
  const [imageUrl, setImageUrl] = useState('');
  
  // The minified JavaScript code from the attachment
  const jsCode = `if=(o=i.fetchMore)?void 0:o.direction);return{const a...c,fetchNextPage:this.fetchNextPage,fetchPreviousPage:this.fetchPreviousPage,hasNextPage:ne(t,null==(a=l.data)?void 0:a.pages),hasPreviousPage:re(t,null==(s=l.data)?void 0:s.pages),isFetchingNextPage:A,isFetchingPreviousPage:h,isRefetching:d&&!A&&!h}}}class et extends F{constructor(e,t){super(),this.client=e,this.queries=[],this.result=[],this.observers=[],this.observersMap={},t&&this.setQueries(t)}onSubscribe(){1===this.listeners.size&&this.observers.forEach((e=>{e.subscribe((t=>{this.onUpdate(e,t)}))}))}onUnsubscribe(){this.listeners.size||this.destroy()}destroy(){this.listeners=new Set,this.observers.forEach((e=>{e.destroy()}))}setQueries(e,t){this.queries=e,L.batch((()=>{const e=this.observers,n=this.findMatchingObservers(this.queries);n.forEach((e=>e.observer.setOptions(e.defaultedQueryOptions,t)));const r=n.map((e=>e.observer)),i=Object.fromEntries(r.map((e=>[e.options.queryHash,e]))),o=r.map((e=>e.getCurrentResult())),a=r.some(((t,n)=>t!==e[n]));(e.length!==r.length||a)&&(this.observers=r,this.observersMap=i,this.result=o,this.hasListeners()&&(g(e,r).forEach((e=>{e.destroy()})),g(r,e).forEach((e=>{e.subscribe((t=>{this.onUpdate(e,t)}))})),this.notify()))}))}getCurrentResult(){return this.result}getQueries(){return this.observers.map((e=>e.getCurrentQuery()))}getObservers(){return this.observers}getOptimisticResult(e){return this.findMatchingObservers(e).map((e=>e.observer.getOptimisticResult(e.defaultedQueryOptions)))}findMatchingObservers(e){const t=this.observers,n=new Map(t.map((e=>[e.options.queryHash,e]))),r=e.map((e=>this.client.defaultQueryOptions(e))),i=r.flatMap((e=>{const t=n.get(e.queryHash);return null!=t?[{defaultedQueryOptions:e,observer:t}]:[]})),o=new Set(i.map((e=>e.defaultedQueryOptions.queryHash))),a=r.filter((e=>!o.has(e.queryHash))),s=new Set(i.map((e=>e.observer))),l=t.filter((e=>!s.has(e))),c=e=>{const t=this.client.defaultQueryOptions(e),n=this.observersMap[t.queryHash];return null!=n?n:new xe(this.client,t)},u=a.map(((e,t)=>{if(e.keepPreviousData){const n=l[t];if(void 0!==n)return{defaultedQueryOptions:e,observer:n}}return{defaultedQueryOptions:e,observer:c(e)}}));return i.concat(u).sort(((e,t)=>r.indexOf(e.defaultedQueryOptions)-r.indexOf(t.defaultedQueryOptions)))}onUpdate(e,t){const n=this.observers.indexOf(e);-1!==n&&(this.result=function(e,t,n){const r=e.slice(0);return r[t]=n,r}(this.result,n,t),this.notify())}notify(){L.batch((()=>{this.listeners.forEach((({listener:e})=>{e(this.result)}))}))}}function tt(e,t){return e.length?void 0===t?[e]:[e,t]:[]}const nt=["client","ssrContext","ssrState","abortOnUnmount"],rt=(0,r.createContext)(null);function it(e,t){const[n,r]=e;return[n,r,t?.trpc]}function ot(e){const t=(0,r.useRef)(e);return t.current.path=e.path,t.current}function at(e){const t=e?.unstable_overrides?.useMutation?.onSuccess??(e=>e.originalFn()),n=e?.context??rt,i=e?.reactQueryContext;function o(){return r.useContext(n)}function a(e,t,n){const{queryClient:r,ssrState:i}=o();return i&&"mounted"!==i&&"error"===r.getQueryCache().find(Se(e,t))?.state.status?{retryOnMount:!1,...n}:n}return{Provider:e=>{const{abortOnUnmount:t=!1,client:i,queryClient:o,ssrContext:a}=e,[s,l]=(0,r.useState)(e.ssrState??!1);return(0,r.useEffect)((()=>{l((e=>!!e&&"mounted"))}),[]),r.createElement(n.Provider,{value:{abortOnUnmount:t,queryClient:o,client:i,ssrContext:a||null,ssrState:s,fetchQuery:(0,r.useCallback)(((e,t)=>o.fetchQuery({...t,queryKey:Se(e,"query"),queryFn:()=>i.query(...it(e,t))})),[i,o]),fetchInfiniteQuery:(0,r.useCallback)(((e,t)=>o.fetchInfiniteQuery({...t,queryKey:Se(e,"infinite"),queryFn:({pageParam:n})=>{const[r,o]=e,a={...o,cursor:n};return i.query(...it([r,a],t))}})),[i,o]),prefetchQuery:(0,r.useCallback)(((e,t)=>o.prefetchQuery({...t,queryKey:Se(e,"query"),queryFn:()=>i.query(...it(e,t))})),[i,o]),prefetchInfiniteQuery:(0,r.useCallback)(((e,t)=>o.prefetchInfiniteQuery({...t,queryKey:Se(e,"infinite"),queryFn:({pageParam:n})=>{const[r,o]=e,a={...o,cursor:n};return i.query(...it([r,a],t))}})),[i,o]),ensureQueryData:(0,r.useCallback)(((e,t)=>o.ensureQueryData({...t,queryKey:Se(e,"query"),queryFn:()=>i.query(...it(e,t))})),[i,o]),invalidateQueries:(0,r.useCallback)(((e,t,n)=>o.invalidateQueries({...t,queryKey:Se(e,"any")},n)),[o]),resetQueries:(0,r.useCallback)(((...e)=>{const[t,n,r]=e;return o.resetQueries({...n,queryKey:Se(t,"any")},r)}),[o]),refetchQueries:(0,r.useCallback)(((...e)=>{const[t,n,r]=e;return o.refetchQueries({...n,queryKey:Se(t,"any")},r)}),[o]),cancelQuery:(0,r.useCallback)((e=>o.cancelQueries({queryKey:Se(e,"any")})),[o]),setQueryData:(0,r.useCallback)(((...e)=>{const[t,...n]=e;return o.setQueryData(Se(t,"query"),...n)}),[o]),getQueryData:(0,r.useCallback)(((...e)=>{const[t,...n]=e;return o.getQueryData(Se(t,"query"),...n)}),[o]),setInfiniteQueryData:(0,r.useCallback)(((...e)=>{const[t,...n]=e;return o.setQueryData(Se(t,"infinite"),...n)}),[o]),getInfiniteQueryData:(0,r.useCallback)(((...e)=>{const[t,...n]=e;return o.getQueryData(Se(t,"infinite"),...n)}),[o])}},e.children)},createClient:e=>function(e){return new we(e)}(e),useContext:o,useQuery:function(t,n){const r=o();if(!r)throw new Error("Unable to retrieve application context. Did you forget to wrap your App inside \`withTRPC\` HoC?");const{abortOnUnmount:s,client:l,ssrState:c,queryClient:u,prefetchQuery:d}=r;"undefined"!==typeof window||"prepass"!==c||!1===n?.trpc?.ssr||!1===n?.enabled||u.getQueryCache().find(Se(t,"query"))||d(t,n);const A=a(t,"query",n),h=n?.trpc?.abortOnUnmount??e?.abortOnUnmount??s,p=qe(y({...A,queryKey:Se(t,"query"),queryFn:e=>{const n={...A,trpc:{...A?.trpc,...h?{signal:e.signal}:{}}};return l.query(...it(t,n))},context:i},f,m),xe);var f,m;return p.trpc=ot({path:t[0]}),p},useQueries:(e,t)=>{const{ssrState:n,queryClient:i,prefetchQuery:a,client:s}=o(),l=function(e){return he((t=>{const n=t.path.join("."),[r,...i]=t.args;return{queryKey:tt(n,r),queryFn:()=>e.query(n,r),...i[0]}}))}(s),c=e(l);if("undefined"!==typeof window&&"prepass"===n)for(const r of c){const e=r;!1===e.trpc?.ssr||i.getQueryCache().find(Se(e.queryKey,"query"))||a(e.queryKey,e)}return function({queries:e,context:t}){const n=Le({context:t}),i=Ue(),o=De(),a=r.useMemo((()=>e.map((e=>{const t=n.defaultQueryOptions(e);return t._optimisticResults=i?"isRestoring":"optimistic",t}))),[e,n,i]);a.forEach((e=>{ze(e),He(e,o)})),Ge(o);const[s]=r.useState((()=>new et(n,a))),l=s.getOptimisticResult(a);Be(r.useCallback((e=>i?()=>{}:s.subscribe(L.batchCalls(e))),[s,i]),(()=>s.getCurrentResult()),(()=>s.getCurrentResult())),r.useEffect((()=>{s.setQueries(a,{listeners:!1})}),[a,s]);const c=l.some(((e,t)=>Ye(a[t],e,i)))?l.flatMap(((e,t)=>{const n=a[t],r=s.getObservers()[t];if(n&&r){if(Ye(n,e,i))return Ke(n,r,o);We(e,i)&&Ke(n,r,o)}return[]})):[];if(c.length>0)throw Promise.all(c);const u=s.getQueries(),d=l.find(((e,t)=>{var n,r;return Ve({result:e,errorResetBoundary:o,useErrorBoundary:null!=(n=null==(r=a[t])?void 0:r.useErrorBoundary)&&n,query:u[t]})}));if(null!=d&&d.error)throw d.error;return l}({queries:c.map((e=>({...e,queryKey:Se(e.queryKey,"query")}))),context:t})},useMutation:function(e,n){const{client:r}=o(),a=Le({context:i}),s=Array.isArray(e)?e[0]:e,l=Xe({...n,mutationKey:[s.split(".")],mutationFn:e=>r.mutation(...it([s,e],n)),context:i,onSuccess:(...e)=>t({originalFn:()=>n?.onSuccess?.(...e),queryClient:a,meta:n?.meta??{}})});return l.trpc=ot({path:s}),l},useSubscription:function(e,t){const n=t?.enabled??!0,i=S(e),{client:a}=o();return(0,r.useEffect)((()=>{if(!n)return;const[r,i]=e;let o=!1;const s=a.subscription(r,i??void 0,{onStarted:()=>{o||t.onStarted?.()},onData:e=>{o||t.onData(e)},onError:e=>{o||t.onError?.(e)}});return()=>{o=!0,s.unsubscribe()}}),[i,n])},useDehydratedState:(e,t)=>(0,r.useMemo)((()=>t?e.runtime.transformer.deserialize(t):t),[t,e]),useInfiniteQuery:function(e,t){const[n,r]=e,{client:s,ssrState:l,prefetchInfiniteQuery:c,queryClient:u,abortOnUnmount:d}=o();"undefined"!==typeof window||"prepass"!==l||!1===t?.trpc?.ssr||!1===t?.enabled||u.getQueryCache().find(Se(e,"infinite"))||c(e,t);const A=a(e,"infinite",t),h=t?.trpc?.abortOnUnmount??d,p=qe(y({...A,queryKey:Se(e,"infinite"),queryFn:e=>{const i={...A,trpc:{...A?.trpc,...h?{signal:e.signal}:{}}},o={...r??{},cursor:e.pageParam??t?.initialCursor};return s.query(...it([n,o],i))},context:i},f,m),$e);var f,m;return p.trpc=ot({path:n}),p}}}function st(e){return pe((t=>{return"useContext"===t?()=>{const t=e.useContext();return(0,r.useMemo)((()=>function(e){return pe((t=>{const n=t;return"client"===n?Ee(e.client):nt.includes(n)?e[n]:he((({path:n,args:r})=>{const i=[t,...n],o=i.pop(),a=i.join("."),{queryKey:s,rest:l,updater:c}=(e=>{if(["setData","setInfiniteData"].includes(e)){const[e,t,...n]=r;return{queryKey:tt(a,e),updater:t,rest:n}}const[t,...n]=r;return{queryKey:tt(a,t),rest:n}})(o);return{fetch:()=>e.fetchQuery(s,...l),fetchInfinite:()=>e.fetchInfiniteQuery(s,...l),prefetch:()=>e.prefetchQuery(s,...l),prefetchInfinite:()=>e.prefetchInfiniteQuery(s,...l),ensureData:()=>e.ensureQueryData(s,...l),invalidate:()=>e.invalidateQueries(s,...l),reset:()=>e.resetQueries(s,...l),refetch:()=>e.refetchQueries(s,...l),cancel:()=>e.cancelQuery(s,...l),setData:()=>e.setQueryData(s,c,...l),setInfiniteData:()=>e.setInfinite`;

  // Block letter patterns (6x6 each)
  const letters = {
    C: [
      'CCCCCC',
      'CCCCCC',
      'CC    ',
      'CC    ',
      'CCCCCC',
      'CCCCCC'
    ],
    L: [
      'LL    ',
      'LL    ',
      'LL    ',
      'LL    ',
      'LLLLLL',
      'LLLLLL'
    ],
    E: [
      'EEEEEE',
      'EE    ',
      'EEEEE ',
      'EE    ',
      'EE    ',
      'EEEEEE'
    ],
    V: [
      'VV  VV',
      'VV  VV',
      'VV  VV',
      'VV  VV',
      ' VVVV ',
      ' VVVV '
    ],
    R: [
      'RRRRRR',
      'RR  RR',
      'RR  RR',
      'RRRRR ',
      'RR  RR',
      'RR  RR'
    ],
    N: [
      'NN  NN',
      'NNN NN',
      'NN NNN',
      'NN NNN',
      'NN  NN',
      'NN  NN'
    ],
    T: [
      'TTTTTT',
      'TTTTTT',
      '  TT  ',
      '  TT  ',
      '  TT  ',
      '  TT  '
    ],
    U: [
      'UU  UU',
      'UU  UU',
      'UU  UU',
      'UU  UU',
      'UUUUUU',
      'UUUUUU'
    ],
    S: [
      'SSSSSS',
      'SS    ',
      'SSSS  ',
      '  SSSS',
      '    SS',
      'SSSSSS'
    ]
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const GRID_WIDTH = 70;
    const GRID_HEIGHT = 40;
    const CHAR_SIZE = 17; // Size of each character in pixels for high resolution
    
    // Set canvas size for high resolution
    canvas.width = GRID_WIDTH * CHAR_SIZE;
    canvas.height = GRID_HEIGHT * CHAR_SIZE;
    
    // Create the character grid
    const grid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(' '));
    
    // Fill grid with JavaScript code
    let codeIndex = 0;
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        grid[y][x] = jsCode[codeIndex % jsCode.length];
        codeIndex++;
      }
    }
    
    // Calculate positions for CLEVER and VENTURES (centered)
    const word1 = 'CLEVER';
    const word2 = 'VENTURES';
    const letterSpacing = 7; // Space between letters
    const wordSpacing = 3; // Vertical space between words
    
    // Calculate total width needed for each word
    const word1Width = word1.length * 6 + (word1.length - 1) * (letterSpacing - 6);
    const word2Width = word2.length * 6 + (word2.length - 1) * (letterSpacing - 6);
    
    // Center positions
    const word1StartX = Math.floor((GRID_WIDTH - word1Width) / 2);
    const word2StartX = Math.floor((GRID_WIDTH - word2Width) / 2);
    const word1StartY = Math.floor((GRID_HEIGHT - (6 * 2 + wordSpacing)) / 2);
    const word2StartY = word1StartY + 6 + wordSpacing;
    
    // Overlay CLEVER
    let currentX = word1StartX;
    for (let i = 0; i < word1.length; i++) {
      const letter = word1[i];
      const pattern = letters[letter];
      
      for (let ly = 0; ly < 6; ly++) {
        for (let lx = 0; lx < 6; lx++) {
          if (pattern[ly][lx] !== ' ') {
            const gridY = word1StartY + ly;
            const gridX = currentX + lx;
            if (gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
              grid[gridY][gridX] = pattern[ly][lx];
            }
          }
        }
      }
      currentX += letterSpacing;
    }
    
    // Overlay VENTURES
    currentX = word2StartX;
    for (let i = 0; i < word2.length; i++) {
      const letter = word2[i];
      const pattern = letters[letter];
      
      for (let ly = 0; ly < 6; ly++) {
        for (let lx = 0; lx < 6; lx++) {
          if (pattern[ly][lx] !== ' ') {
            const gridY = word2StartY + ly;
            const gridX = currentX + lx;
            if (gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
              grid[gridY][gridX] = pattern[ly][lx];
            }
          }
        }
      }
      currentX += letterSpacing;
    }
    
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set font
    ctx.font = `${CHAR_SIZE * 0.8}px 'Courier New', monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Draw the grid
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const char = grid[y][x];
        const isLetter = /[CLEVRNTUS]/.test(char);
        
        // Set color based on whether it's part of CLEVER VENTURES
        ctx.fillStyle = isLetter ? '#FFFFFF' : '#404040';

        if(isLetter){
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 0.5;
          ctx.strokeText(char, x * CHAR_SIZE + CHAR_SIZE * 0.1, y * CHAR_SIZE + CHAR_SIZE * 0.1);
        }

        // Draw character
        ctx.fillText(char, x * CHAR_SIZE + CHAR_SIZE * 0.1, y * CHAR_SIZE + CHAR_SIZE * 0.1);
      }
    }
    
    // Generate download URL
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    }, 'image/png');
  }, [jsCode]);

  const downloadImage = () => {
    const link = document.createElement('a');
    link.download = 'clever-ventures-logo.png';
    link.href = imageUrl;
    link.click();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-8">
      <div className="bg-black p-8 rounded-lg shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">CLEVER VENTURES Logo Generator</h1>
        
        <div className="mb-6 overflow-auto max-w-full">
          <canvas 
            ref={canvasRef}
            className="border border-gray-600"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={downloadImage}
            disabled={!imageUrl}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            Download High-Resolution PNG
          </button>
          
          <div className="text-gray-400 text-sm text-center">
            <p>Canvas Size: 2000 x 1000 pixels</p>
            <p>Grid: 100 x 50 characters</p>
            <p>Ready for print!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoGenerator;