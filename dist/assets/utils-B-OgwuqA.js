import{r as b,g as P,R as V}from"./vendor-wpXbf5jk.js";var w={exports:{}},S={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var T=b,A=Symbol.for("react.element"),C=Symbol.for("react.fragment"),L=Object.prototype.hasOwnProperty,k=T.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,z={key:!0,ref:!0,__self:!0,__source:!0};function D(e,t,r){var o,n={},u=null,c=null;r!==void 0&&(u=""+r),t.key!==void 0&&(u=""+t.key),t.ref!==void 0&&(c=t.ref);for(o in t)L.call(t,o)&&!z.hasOwnProperty(o)&&(n[o]=t[o]);if(e&&e.defaultProps)for(o in t=e.defaultProps,t)n[o]===void 0&&(n[o]=t[o]);return{$$typeof:A,type:e,key:u,ref:c,props:n,_owner:k.current}}S.Fragment=C;S.jsx=D;S.jsxs=D;w.exports=S;var de=w.exports;const U={BASE_URL:"/",DEV:!1,MODE:"production",PROD:!0,SSR:!1},R=e=>{let t;const r=new Set,o=(s,l)=>{const a=typeof s=="function"?s(t):s;if(!Object.is(a,t)){const i=t;t=l??(typeof a!="object"||a===null)?a:Object.assign({},t,a),r.forEach(f=>f(t,i))}},n=()=>t,p={setState:o,getState:n,getInitialState:()=>E,subscribe:s=>(r.add(s),()=>r.delete(s)),destroy:()=>{(U?"production":void 0)!=="production"&&console.warn("[DEPRECATED] The `destroy` method will be unsupported in a future version. Instead use unsubscribe function returned by subscribe. Everything will be garbage-collected if store is garbage-collected."),r.clear()}},E=t=e(o,n,p);return p},W=e=>e?R(e):R;var O={exports:{}},x={},j={exports:{}},$={};/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var d=b;function F(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var M=typeof Object.is=="function"?Object.is:F,B=d.useState,N=d.useEffect,G=d.useLayoutEffect,J=d.useDebugValue;function Y(e,t){var r=t(),o=B({inst:{value:r,getSnapshot:t}}),n=o[0].inst,u=o[1];return G(function(){n.value=r,n.getSnapshot=t,y(n)&&u({inst:n})},[e,r,t]),N(function(){return y(n)&&u({inst:n}),e(function(){y(n)&&u({inst:n})})},[e]),J(r),r}function y(e){var t=e.getSnapshot;e=e.value;try{var r=t();return!M(e,r)}catch{return!0}}function H(e,t){return t()}var K=typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"?H:Y;$.useSyncExternalStore=d.useSyncExternalStore!==void 0?d.useSyncExternalStore:K;j.exports=$;var Q=j.exports;/**
 * @license React
 * use-sync-external-store-shim/with-selector.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var m=b,X=Q;function Z(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var q=typeof Object.is=="function"?Object.is:Z,ee=X.useSyncExternalStore,te=m.useRef,re=m.useEffect,oe=m.useMemo,ne=m.useDebugValue;x.useSyncExternalStoreWithSelector=function(e,t,r,o,n){var u=te(null);if(u.current===null){var c={hasValue:!1,value:null};u.current=c}else c=u.current;u=oe(function(){function p(i){if(!E){if(E=!0,s=i,i=o(i),n!==void 0&&c.hasValue){var f=c.value;if(n(f,i))return l=f}return l=i}if(f=l,q(s,i))return f;var _=o(i);return n!==void 0&&n(f,_)?(s=i,f):(s=i,l=_)}var E=!1,s,l,a=r===void 0?null:r;return[function(){return p(t())},a===null?void 0:function(){return p(a())}]},[t,r,o,n]);var v=ee(e,u[0],u[1]);return re(function(){c.hasValue=!0,c.value=v},[v]),ne(v),v};O.exports=x;var ue=O.exports;const se=P(ue),I={BASE_URL:"/",DEV:!1,MODE:"production",PROD:!0,SSR:!1},{useDebugValue:ie}=V,{useSyncExternalStoreWithSelector:ce}=se;let h=!1;const ae=e=>e;function fe(e,t=ae,r){(I?"production":void 0)!=="production"&&r&&!h&&(console.warn("[DEPRECATED] Use `createWithEqualityFn` instead of `create` or use `useStoreWithEqualityFn` instead of `useStore`. They can be imported from 'zustand/traditional'. https://github.com/pmndrs/zustand/discussions/1937"),h=!0);const o=ce(e.subscribe,e.getState,e.getServerState||e.getInitialState,t,r);return ie(o),o}const g=e=>{(I?"production":void 0)!=="production"&&typeof e!="function"&&console.warn("[DEPRECATED] Passing a vanilla store will be unsupported in a future version. Instead use `import { useStore } from 'zustand'`.");const t=typeof e=="function"?W(e):e,r=(o,n)=>fe(t,o,n);return Object.assign(r,t),r},ve=e=>e?g(e):g;export{ve as c,de as j};
