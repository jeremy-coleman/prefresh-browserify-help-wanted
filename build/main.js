!function(){var e,n,t,_,o={},r={},i=[],l=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;function u(e,n){for(var t in n)e[t]=n[t];return e}function c(e){var n=e.parentNode;n&&n.removeChild(e)}function s(e,n,t){var _,o,r,i=arguments,l={};for(r in n)"key"==r?_=n[r]:"ref"==r?o=n[r]:l[r]=n[r];if(arguments.length>3)for(t=[t],r=3;r<arguments.length;r++)t.push(i[r]);if(null!=t&&(l.children=t),"function"==typeof e&&null!=e.defaultProps)for(r in e.defaultProps)void 0===l[r]&&(l[r]=e.defaultProps[r]);return f(e,l,_,o,null)}function f(n,t,_,o,r){var i={type:n,props:t,key:_,ref:o,__k:null,__:null,__b:0,__e:null,__d:void 0,__c:null,__h:null,constructor:void 0,__v:null==r?++e.__v:r};return null!=e.vnode&&e.vnode(i),i}function a(e){return e.children}function p(e,n){this.props=e,this.context=n}function d(e,n){if(null==n)return e.__?d(e.__,e.__.__k.indexOf(e)+1):null;for(var t;n<e.__k.length;n++)if(null!=(t=e.__k[n])&&null!=t.__e)return t.__e;return"function"==typeof e.type?d(e):null}function h(e){var n,t;if(null!=(e=e.__)&&null!=e.__c){for(e.__e=e.__c.base=null,n=0;n<e.__k.length;n++)if(null!=(t=e.__k[n])&&null!=t.__e){e.__e=e.__c.base=t.__e;break}return h(e)}}function v(o){(!o.__d&&(o.__d=!0)&&n.push(o)&&!y.__r++||_!==e.debounceRendering)&&((_=e.debounceRendering)||t)(y)}function y(){for(var e;y.__r=n.length;)e=n.sort((function(e,n){return e.__v.__b-n.__v.__b})),n=[],e.some((function(e){var n,t,_,o,r,i;e.__d&&(r=(o=(n=e).__v).__e,(i=n.__P)&&(t=[],(_=u({},o)).__v=o.__v+1,w(i,o,_,n.__n,void 0!==i.ownerSVGElement,null!=o.__h?[r]:null,t,null==r?d(o):r,o.__h),E(t,o),o.__e!=r&&h(o)))}))}function m(e,n,t,_,o,l,u,c,s,p){var h,v,y,m,k,S,x,C=_&&_.__k||i,E=C.length;for(t.__k=[],h=0;h<n.length;h++)if(null!=(m=t.__k[h]=null==(m=n[h])||"boolean"==typeof m?null:"string"==typeof m||"number"==typeof m?f(null,m,null,null,m):Array.isArray(m)?f(a,{children:m},null,null,null):m.__b>0?f(m.type,m.props,m.key,null,m.__v):m)){if(m.__=t,m.__b=t.__b+1,null===(y=C[h])||y&&m.key==y.key&&m.type===y.type)C[h]=void 0;else for(v=0;v<E;v++){if((y=C[v])&&m.key==y.key&&m.type===y.type){C[v]=void 0;break}y=null}w(e,m,y=y||r,o,l,u,c,s,p),k=m.__e,(v=m.ref)&&y.ref!=v&&(x||(x=[]),y.ref&&x.push(y.ref,null,m),x.push(v,m.__c||k,m)),null!=k?(null==S&&(S=k),"function"==typeof m.type&&null!=m.__k&&m.__k===y.__k?m.__d=s=g(m,s,e):s=b(e,m,y,C,k,s),p||"option"!==t.type?"function"==typeof t.type&&(t.__d=s):e.value=""):s&&y.__e==s&&s.parentNode!=e&&(s=d(y))}for(t.__e=S,h=E;h--;)null!=C[h]&&("function"==typeof t.type&&null!=C[h].__e&&C[h].__e==t.__d&&(t.__d=d(_,h+1)),P(C[h],C[h]));if(x)for(h=0;h<x.length;h++)H(x[h],x[++h],x[++h])}function g(e,n,t){var _,o;for(_=0;_<e.__k.length;_++)(o=e.__k[_])&&(o.__=e,n="function"==typeof o.type?g(o,n,t):b(t,o,o,e.__k,o.__e,n));return n}function b(e,n,t,_,o,r){var i,l,u;if(void 0!==n.__d)i=n.__d,n.__d=void 0;else if(null==t||o!=r||null==o.parentNode)e:if(null==r||r.parentNode!==e)e.appendChild(o),i=null;else{for(l=r,u=0;(l=l.nextSibling)&&u<_.length;u+=2)if(l==o)break e;e.insertBefore(o,r),i=r}return void 0!==i?i:o.nextSibling}function k(e,n,t){"-"===n[0]?e.setProperty(n,t):e[n]=null==t?"":"number"!=typeof t||l.test(n)?t:t+"px"}function S(e,n,t,_,o){var r;e:if("style"===n)if("string"==typeof t)e.style.cssText=t;else{if("string"==typeof _&&(e.style.cssText=_=""),_)for(n in _)t&&n in t||k(e.style,n,"");if(t)for(n in t)_&&t[n]===_[n]||k(e.style,n,t[n])}else if("o"===n[0]&&"n"===n[1])r=n!==(n=n.replace(/Capture$/,"")),n=n.toLowerCase()in e?n.toLowerCase().slice(2):n.slice(2),e.l||(e.l={}),e.l[n+r]=t,t?_||e.addEventListener(n,r?C:x,r):e.removeEventListener(n,r?C:x,r);else if("dangerouslySetInnerHTML"!==n){if(o)n=n.replace(/xlink[H:h]/,"h").replace(/sName$/,"s");else if("href"!==n&&"list"!==n&&"form"!==n&&"download"!==n&&n in e)try{e[n]=null==t?"":t;break e}catch(e){}"function"==typeof t||(null!=t&&(!1!==t||"a"===n[0]&&"r"===n[1])?e.setAttribute(n,t):e.removeAttribute(n))}}function x(n){this.l[n.type+!1](e.event?e.event(n):n)}function C(n){this.l[n.type+!0](e.event?e.event(n):n)}function w(n,t,_,o,r,i,l,c,s){var f,d,h,v,y,g,b,k,S,x,C,w=t.type;if(void 0!==t.constructor)return null;null!=_.__h&&(s=_.__h,c=t.__e=_.__e,t.__h=null,i=[c]),(f=e.__b)&&f(t);try{e:if("function"==typeof w){if(k=t.props,S=(f=w.contextType)&&o[f.__c],x=f?S?S.props.value:f.__:o,_.__c?b=(d=t.__c=_.__c).__=d.__E:("prototype"in w&&w.prototype.render?t.__c=d=new w(k,x):(t.__c=d=new p(k,x),d.constructor=w,d.render=T),S&&S.sub(d),d.props=k,d.state||(d.state={}),d.context=x,d.__n=o,h=d.__d=!0,d.__h=[]),null==d.__s&&(d.__s=d.state),null!=w.getDerivedStateFromProps&&(d.__s==d.state&&(d.__s=u({},d.__s)),u(d.__s,w.getDerivedStateFromProps(k,d.__s))),v=d.props,y=d.state,h)null==w.getDerivedStateFromProps&&null!=d.componentWillMount&&d.componentWillMount(),null!=d.componentDidMount&&d.__h.push(d.componentDidMount);else{if(null==w.getDerivedStateFromProps&&k!==v&&null!=d.componentWillReceiveProps&&d.componentWillReceiveProps(k,x),!d.__e&&null!=d.shouldComponentUpdate&&!1===d.shouldComponentUpdate(k,d.__s,x)||t.__v===_.__v){d.props=k,d.state=d.__s,t.__v!==_.__v&&(d.__d=!1),d.__v=t,t.__e=_.__e,t.__k=_.__k,d.__h.length&&l.push(d);break e}null!=d.componentWillUpdate&&d.componentWillUpdate(k,d.__s,x),null!=d.componentDidUpdate&&d.__h.push((function(){d.componentDidUpdate(v,y,g)}))}d.context=x,d.props=k,d.state=d.__s,(f=e.__r)&&f(t),d.__d=!1,d.__v=t,d.__P=n,f=d.render(d.props,d.state,d.context),d.state=d.__s,null!=d.getChildContext&&(o=u(u({},o),d.getChildContext())),h||null==d.getSnapshotBeforeUpdate||(g=d.getSnapshotBeforeUpdate(v,y)),C=null!=f&&f.type===a&&null==f.key?f.props.children:f,m(n,Array.isArray(C)?C:[C],t,_,o,r,i,l,c,s),d.base=t.__e,t.__h=null,d.__h.length&&l.push(d),b&&(d.__E=d.__=null),d.__e=!1}else null==i&&t.__v===_.__v?(t.__k=_.__k,t.__e=_.__e):t.__e=A(_.__e,t,_,o,r,i,l,s);(f=e.diffed)&&f(t)}catch(n){t.__v=null,(s||null!=i)&&(t.__e=c,t.__h=!!s,i[i.indexOf(c)]=null),e.__e(n,t,_)}}function E(n,t){e.__c&&e.__c(t,n),n.some((function(t){try{n=t.__h,t.__h=[],n.some((function(e){e.call(t)}))}catch(n){e.__e(n,t.__v)}}))}function A(e,n,t,_,o,l,u,s){var f,a,p,d,h=t.props,v=n.props,y=n.type,g=0;if("svg"===y&&(o=!0),null!=l)for(;g<l.length;g++)if((f=l[g])&&(f===e||(y?f.localName==y:3==f.nodeType))){e=f,l[g]=null;break}if(null==e){if(null===y)return document.createTextNode(v);e=o?document.createElementNS("http://www.w3.org/2000/svg",y):document.createElement(y,v.is&&v),l=null,s=!1}if(null===y)h===v||s&&e.data===v||(e.data=v);else{if(l=l&&i.slice.call(e.childNodes),a=(h=t.props||r).dangerouslySetInnerHTML,p=v.dangerouslySetInnerHTML,!s){if(null!=l)for(h={},d=0;d<e.attributes.length;d++)h[e.attributes[d].name]=e.attributes[d].value;(p||a)&&(p&&(a&&p.__html==a.__html||p.__html===e.innerHTML)||(e.innerHTML=p&&p.__html||""))}if(function(e,n,t,_,o){var r;for(r in t)"children"===r||"key"===r||r in n||S(e,r,null,t[r],_);for(r in n)o&&"function"!=typeof n[r]||"children"===r||"key"===r||"value"===r||"checked"===r||t[r]===n[r]||S(e,r,n[r],t[r],_)}(e,v,h,o,s),p)n.__k=[];else if(g=n.props.children,m(e,Array.isArray(g)?g:[g],n,t,_,o&&"foreignObject"!==y,l,u,e.firstChild,s),null!=l)for(g=l.length;g--;)null!=l[g]&&c(l[g]);s||("value"in v&&void 0!==(g=v.value)&&(g!==e.value||"progress"===y&&!g)&&S(e,"value",g,h.value,!1),"checked"in v&&void 0!==(g=v.checked)&&g!==e.checked&&S(e,"checked",g,h.checked,!1))}return e}function H(n,t,_){try{"function"==typeof n?n(t):n.current=t}catch(n){e.__e(n,_)}}function P(n,t,_){var o,r,i;if(e.unmount&&e.unmount(n),(o=n.ref)&&(o.current&&o.current!==n.__e||H(o,null,t)),_||"function"==typeof n.type||(_=null!=(r=n.__e)),n.__e=n.__d=void 0,null!=(o=n.__c)){if(o.componentWillUnmount)try{o.componentWillUnmount()}catch(n){e.__e(n,t)}o.base=o.__P=null}if(o=n.__k)for(i=0;i<o.length;i++)o[i]&&P(o[i],t,_);null!=r&&c(r)}function T(e,n,t){return this.constructor(e,t)}function M(n,t,_){var o,l,u;e.__&&e.__(n,t),l=(o="function"==typeof _)?null:_&&_.__k||t.__k,u=[],w(t,n=(!o&&_||t).__k=s(a,null,[n]),l||r,r,void 0!==t.ownerSVGElement,!o&&_?[_]:l?null:t.firstChild?i.slice.call(t.childNodes):null,u,!o&&_?_:l?l.__e:t.firstChild,o),E(u,n)}e={__e:function(e,n){for(var t,_,o;n=n.__;)if((t=n.__c)&&!t.__)try{if((_=t.constructor)&&null!=_.getDerivedStateFromError&&(t.setState(_.getDerivedStateFromError(e)),o=t.__d),null!=t.componentDidCatch&&(t.componentDidCatch(e),o=t.__d),o)return t.__E=t}catch(n){e=n}throw e},__v:0},p.prototype.setState=function(e,n){var t;t=null!=this.__s&&this.__s!==this.state?this.__s:this.__s=u({},this.state),"function"==typeof e&&(e=e(u({},t),this.props)),e&&u(t,e),null!=e&&this.__v&&(n&&this.__h.push(n),v(this))},p.prototype.forceUpdate=function(e){this.__v&&(this.__e=!0,e&&this.__h.push(e),v(this))},p.prototype.render=a,n=[],t="function"==typeof Promise?Promise.prototype.then.bind(Promise.resolve()):setTimeout,y.__r=0,o.render=M,o.options=e;var j,D,F,N={},U=0,O=[],L=o.options.__b,W=o.options.__r,q=o.options.diffed,z=o.options.__c,B=o.options.unmount;function I(e,n){o.options.__h&&o.options.__h(D,e,U||n),U=0;var t=D.__H||(D.__H={__:[],__h:[]});return e>=t.__.length&&t.__.push({}),t.__[e]}function R(e){return U=1,$(X,e)}function $(e,n,t){var _=I(j++,2);return _.t=e,_.__c||(_.__=[t?t(n):X(void 0,n),function(e){var n=_.t(_.__[0],e);_.__[0]!==n&&(_.__=[n,_.__[1]],_.__c.setState({}))}],_.__c=D),_.__}function G(e,n){var t=I(j++,7);return Q(t.__H,n)&&(t.__=e(),t.__H=n,t.__h=e),t.__}function V(){O.forEach((function(e){if(e.__P)try{e.__H.__h.forEach(J),e.__H.__h.forEach(K),e.__H.__h=[]}catch(t){e.__H.__h=[],o.options.__e(t,e.__v)}})),O=[]}o.options.__b=function(e){D=null,L&&L(e)},o.options.__r=function(e){W&&W(e),j=0;var n=(D=e.__c).__H;n&&(n.__h.forEach(J),n.__h.forEach(K),n.__h=[])},o.options.diffed=function(e){q&&q(e);var n=e.__c;n&&n.__H&&n.__H.__h.length&&(1!==O.push(n)&&F===o.options.requestAnimationFrame||((F=o.options.requestAnimationFrame)||function(e){var n,t=function(){clearTimeout(_),Y&&cancelAnimationFrame(n),setTimeout(e)},_=setTimeout(t,100);Y&&(n=requestAnimationFrame(t))})(V)),D=void 0},o.options.__c=function(e,n){n.some((function(e){try{e.__h.forEach(J),e.__h=e.__h.filter((function(e){return!e.__||K(e)}))}catch(t){n.some((function(e){e.__h&&(e.__h=[])})),n=[],o.options.__e(t,e.__v)}})),z&&z(e,n)},o.options.unmount=function(e){B&&B(e);var n=e.__c;if(n&&n.__H)try{n.__H.__.forEach(J)}catch(e){o.options.__e(e,n.__v)}};var Y="function"==typeof requestAnimationFrame;function J(e){var n=D;"function"==typeof e.__c&&e.__c(),D=n}function K(e){var n=D;e.__c=e.__(),D=n}function Q(e,n){return!e||e.length!==n.length||n.some((function(n,t){return n!==e[t]}))}function X(e,n){return"function"==typeof n?n(e):n}N.useState=R,N.useMemo=G;var Z={},ee=te();function ne(e){if(!e)throw new Error("invalid activation");try{return ee}finally{ee=e}}function te(e){var n=Object.assign({},{on:new Set,clear:function(){return function(e){if(e){var n=Array.from(e.on);e.on.clear();for(var t=0,_=n;t<_.length;t+=1)_[t].delete(e)}}(n)},notify:oe,add:_e,run:function(){}},e);return n}function _e(e,n){void 0===n&&(n=ee),n&&(n.on.add(e),e.add(n))}function oe(e){for(var n=0,t=Array.from(e);n<t.length;n+=1){var _=t[n];ee!==_&&_.run()}}var re=Symbol();function ie(e,n,t){var _=e[re]||(e[re]={}),o=_[n];return!o&&t&&(o=_[n]=new Set),o}function le(e,n,t){var _=ie(e,t,!0);if("function"==typeof n)return function(){var o=e[t];try{return n.apply(e,arguments)}finally{e[t]!==o&&oe(_)}};_e(_)}var ue=function(e,n,t){return n?function(e,n,t){var _=function(e){return e[fe]||(e[fe]=ue({}))};return{get:function(){var e=_(this);return n in e||!t.initializer||(e[n]=t.initializer()),e[n]},set:function(e){_(this)[n]=e}}}(0,n,t):se(e)},ce=Symbol();function se(e){var n=e[ce];return n||(n=e[ce]=new Proxy(e,{get:ae,set:pe})),n}var fe=Symbol();function ae(e,n){var t=e[n],_=function(e,n){return e instanceof Map||e instanceof Set?le(e,n,"size"):e instanceof Array?le(e,n,"length"):void 0}(e,t);if(_)return _;if("symbol"!=typeof n){var o=ie(e,n,!0);if(ee.add(o),t instanceof Object)return se(t)}return t}function pe(e,n,t){var _=e[n];e[n]=t;var o=ie(e,n);return o&&t!==_&&ee.notify(o),!0}Z.observable=ue,Z.useObserver=function(e){var n=N.useState(null)[1],t=N.useMemo((function(){return te({run:function(){t.clear(),n(Object.create(null))}})}),[]),_=ne(t);try{return e()}finally{ne(_)}};var de={};Object.defineProperty(de,"__esModule",{value:!0}),de.model=void 0;const he=(0,Z.observable)({counter:0});de.model=he;var ve={},ye=[],me=[];function ge(e,n){if(n=n||{},void 0===e)throw new Error("insert-css: You need to provide a CSS string. Usage: insertCss(cssString[, options]).");var t,_=!0===n.prepend?"prepend":"append",o=void 0!==n.container?n.container:document.querySelector("head"),r=ye.indexOf(o);return-1===r&&(r=ye.push(o)-1,me[r]={}),void 0!==me[r]&&void 0!==me[r][_]?t=me[r][_]:(t=me[r][_]=function(){var e=document.createElement("style");return e.setAttribute("type","text/css"),e}(),"prepend"===_?o.insertBefore(t,o.childNodes[0]):o.appendChild(t)),65279===e.charCodeAt(0)&&(e=e.substr(1,e.length)),t.styleSheet?t.styleSheet.cssText+=e:t.textContent+=e,t}(ve=ge).insertCss=ge;var be="body {\n  font-family: sans-serif;\n}\nheader {\n  border-bottom: 1px solid #ccc;\n  color: #0400ff;\n  padding: 1em 0;\n}\n";ve(be);var ke={};function Se(e,n,t,_,r){var i={};for(var l in n)"ref"!=l&&(i[l]=n[l]);var u,c,s={type:e,props:i,key:t,ref:n&&n.ref,__k:null,__:null,__b:0,__e:null,__d:void 0,__c:null,__h:null,constructor:void 0,__v:++o.options.__v,__source:_,__self:r};if("function"==typeof e&&(u=e.defaultProps))for(c in u)void 0===i[c]&&(i[c]=u[c]);return o.options.vnode&&o.options.vnode(s),s}o.Fragment,ke.jsx=Se,ke.jsxs=Se;(0,o.render)((0,ke.jsx)(()=>(0,Z.useObserver)(()=>(0,ke.jsxs)("div",{children:[(0,ke.jsx)("header",{children:"App Headers"}),(0,ke.jsxs)("h1",{style:{textAlign:"center"},children:["Count: ",de.model.counter]}),(0,ke.jsx)("input",{type:"range",min:0,max:1e3,value:de.model.counter,onInput:e=>de.model.counter=Number(e.target.value),style:{width:"100%"}})]})),{}),document.body)}();