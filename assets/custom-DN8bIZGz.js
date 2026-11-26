import{C as e,D as t,E as n,O as r,S as i,T as a,_ as o,a as s,b as c,d as l,h as u,i as d,l as f,m as ee,o as p,p as te,s as m,t as ne,v as h,w as g,y as re}from"./index-BMMCTmO8.js";import{r as ie,t as ae}from"./electrical-CJOpG8nD.js";import{t as _}from"./conversions-DTEGoSf9.js";import{r as oe,t as se}from"./fluids-CLU36H0z.js";import{t as ce}from"./math-BzuJ6Dyu.js";import{t as le}from"./mechanical-BVcKmd5a.js";import{r as ue,t as de}from"./physics-ByafIN8h.js";var fe=class e{registry;entries=new Map;constructor(e){this.registry=e}static standard(){let t=[...ie,...oe,...ue],n=new e(new f(t));return n.register(ae),n.register(_),n.register(se),n.register(ce),n.register(le),n.register(de),n}list(){return[...this.entries.values()]}get(e){return this.entries.get(e)}requireEntry(e){let t=this.entries.get(e);if(t===void 0)throw new n(`Unknown subcalculator "${e}".`);return t}getTable(e){return this.registry.getTable(e)}accepts(e){return e.computeState===void 0}register(e){for(let t of e)if(this.accepts(t)){if(this.entries.has(t.id))throw new n(`Subcalculator "${t.id}" is registered twice.`);this.entries.set(t.id,{definition:t,config:t.config??[],variables:e=>t.buildVariables?.(e)??t.variables})}}},v=`value`;function y(e,t){return`${e}.${t}`}function b(e){let t=e.indexOf(`.`);if(t<=0||t===e.length-1)return null;let n=e.slice(0,t),r=e.slice(t+1);return r.includes(`.`)?null:{stepId:n,variable:r}}function x(e,t){return`${e}_${t}`}function S(e){return`${JSON.stringify(e,null,2)}\n`}function pe(e){let t;try{t=JSON.parse(e)}catch(e){throw new n(`The custom text is not valid JSON.`,{cause:e})}return C(t)}function C(e){if(!k(e))throw O(`A custom must be an object.`);if(e.version!==1)throw O(`A custom version must be 1.`);let t=T(e,`id`,`A custom`);if(!u(t))throw O(`Custom id "${t}" must use lowercase letters, digits, and hyphens.`);let n=T(e,`title`,`A custom`),r=E(e,`description`,`A custom`),i=e.steps;if(!Array.isArray(i))throw O(`A custom must have a "steps" array.`);return{version:1,id:t,title:n,steps:i.map((e,t)=>me(e,t)),...r===void 0?{}:{description:r}}}function me(e,t){let n=`Step ${t+1}`;if(!k(e))throw O(`${n} must be an object.`);let r=T(e,`id`,n),i=T(e,`label`,n),a=D(e,`hidden`,n),s={id:r,label:i,...a===void 0?{}:{hidden:a}};switch(e.kind){case`subcalc`:return{kind:`subcalc`,...s,calculatorId:T(e,`calculatorId`,n),config:he(e.config,n),values:ge(e.values,n),variables:_e(e.variables,n)};case`variable`:{let t=T(e,`unit`,n);if(!o(t))throw O(`${n} has an unknown unit "${t}".`);let r=be(e,`default`,n);return{kind:`variable`,...s,unit:t,...r===void 0?{}:{default:r},variable:w(e.variable,`${n} value`)}}case`text`:{let t=E(e,`default`,n);return{kind:`text`,...s,...t===void 0?{}:{default:t},variable:w(e.variable,`${n} value`)}}default:throw O(`${n} has an unknown kind.`)}}function w(e,t){if(e===void 0)return{};if(!k(e))throw O(`${t} wiring must be an object.`);let n=E(e,`takeFrom`,t),r=D(e,`hidden`,t);return{...n===void 0?{}:{takeFrom:n},...r===void 0?{}:{hidden:r}}}function he(e,t){if(e===void 0)return{};if(!k(e))throw O(`${t} settings must be an object.`);let n={};for(let[r,i]of Object.entries(e))n[r]=ve(i,`${t} setting "${r}"`);return n}function ge(e,t){if(e===void 0)return{};if(!k(e))throw O(`${t} values must be an object.`);let n={};for(let[r,i]of Object.entries(e))n[r]=ye(i,`${t} value "${r}"`);return n}function _e(e,t){if(e===void 0)return{};if(!k(e))throw O(`${t} variables must be an object.`);let n={};for(let[r,i]of Object.entries(e))n[r]=w(i,`${t} variable "${r}"`);return n}function ve(e,t){if(typeof e==`number`){if(!Number.isFinite(e))throw O(`${t} must be a finite number.`);return e}if(typeof e==`string`||typeof e==`boolean`)return e;throw O(`${t} must be a number, text, or true/false.`)}function ye(e,t){if(e===null)return null;if(typeof e==`number`){if(!Number.isFinite(e))throw O(`${t} must be a finite number.`);return e}if(typeof e==`string`){if(e.length>2e3)throw O(`${t} is too long.`);return e}throw O(`${t} must be a number, text, or null.`)}function T(e,t,n){let r=e[t];if(typeof r!=`string`)throw O(`${n} must have a "${t}" string.`);return r}function E(e,t,n){let r=e[t];if(r!==void 0){if(typeof r!=`string`)throw O(`${n} "${t}" must be a string.`);if(r.length>2e3)throw O(`${n} "${t}" is too long.`);return r}}function D(e,t,n){let r=e[t];if(r!==void 0){if(typeof r!=`boolean`)throw O(`${n} "${t}" must be true or false.`);return r}}function be(e,t,n){let r=e[t];if(r!==void 0){if(typeof r!=`number`||!Number.isFinite(r))throw O(`${n} "${t}" must be a finite number.`);return r}}function O(e){return new n(e)}function k(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}var A=`calcurio.customs.v1`,j=class{storage;constructor(e){this.storage=e}list(){return this.readIndex().customs}get(e){return this.list().find(t=>t.id===e)}has(e){return this.get(e)!==void 0}save(e){let n=N(C(e)),r=this.readIndex(),i=r.customs.findIndex(e=>e.id===n.id);if(i===-1&&r.customs.length>=200)throw new t(`You already have 200 customs. Delete one before saving another.`);let a=[...r.customs];return i===-1?a.push(n):a[i]=n,this.writeIndex({version:1,customs:a}),n}delete(e){let n=this.readIndex();if(!n.customs.some(t=>t.id===e))throw new t(`That custom no longer exists.`);let r=n.customs.filter(t=>t.id!==e);this.writeIndex({version:1,customs:r})}importCustom(e){let n=N(C(e)),r=this.readIndex();if(r.customs.length>=200)throw new t(`You already have 200 customs. Delete one before importing.`);let i=new Set(r.customs.map(e=>e.id)),a={...n,id:xe(n.id,i)};return this.writeIndex({version:1,customs:[...r.customs,a]}),a}importJson(e){return this.importCustom(pe(e))}readIndex(){let e;try{e=this.storage.getItem(A)}catch(e){throw new t(`Could not read customs: ${r(e)}`,{cause:e})}if(e===null||e===``)return{version:1,customs:[]};let n;try{n=JSON.parse(e)}catch(e){throw new t(`Custom data is not valid JSON and was not changed.`,{cause:e})}return M(n)}writeIndex(e){try{this.storage.setItem(A,JSON.stringify(e))}catch(e){throw new t(`Could not save customs: ${r(e)}`,{cause:e})}}};function M(e){if(!Se(e))throw new t(`Custom data must be an object.`);if(e.version!==1)throw new t(`Custom data has an unsupported version and was not changed.`);let n=e.customs;if(!Array.isArray(n))throw new t(`Custom data must contain a "customs" array.`);return{version:1,customs:n.map((e,n)=>{try{return C(e)}catch(e){throw new t(`Saved custom ${n+1} is invalid: ${r(e)}`,{cause:e})}})}}function N(e){let t=e.title.trim(),n=(t===``?`Untitled`:t).slice(0,80);return n===e.title?e:{...e,title:n}}function xe(e,n){if(!n.has(e))return e;for(let t=2;t<=n.size+1;t+=1){let r=`${e}-${t}`;if(!n.has(r))return r}throw new t(`Could not find a free id for "${e}".`)}function Se(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}function P(e){return e.kind===`variable`?{name:v,label:e.label,unit:e.unit,...e.default===void 0?{}:{default:e.default}}:{name:v,label:e.label,...e.default===void 0?{}:{default:e.default}}}function F(e,t){let n={};for(let r of e)n[r.name]=t[r.name]??r.default;return n}function I(e){return F(e,{})}function L(e,t){if(e.kind===`subcalc`){let n=t.get(e.calculatorId);return n===void 0?[]:n.variables(F(n.config,e.config))}return[P(e)]}function R(e,t){return L(e,t).map(t=>({name:t.name,definition:t,wiring:e.kind===`subcalc`?e.variables[t.name]??{}:e.variable}))}function Ce(e,t){let n=[];for(let r of e.steps){if(r.kind!==`subcalc`)continue;let e=t.requireEntry(r.calculatorId);for(let t of e.config)n.push({name:x(r.id,t.name),label:`${r.label}: ${t.label}`,kind:t.kind,default:r.config[t.name]??t.default,...t.description===void 0?{}:{description:t.description},...t.options===void 0?{}:{options:t.options},...t.min===void 0?{}:{min:t.min},...t.max===void 0?{}:{max:t.max}})}return n}function we(e,t,n){let r={};for(let i of t.config){let t=n[x(e.id,i.name)];t!==void 0&&(r[i.name]=t)}return F(t.config,r)}function z(e,t){let n=[];for(let r of e.steps)for(let e of R(r,t))n.push({path:y(r.id,e.name),stepId:r.id,stepLabel:r.label,variable:e.name,variableLabel:e.definition.label,definition:e.definition});return n}function Te(e,t){let n=new Set(z(e,t).map(e=>e.path)),r=e.steps.map(e=>Ee(e,t,n));return{...e,steps:r}}function Ee(e,t,n){if(e.kind!==`subcalc`)return{...e,variable:B(e.variable,n)??{}};if(t.get(e.calculatorId)===void 0)return e;let r=new Set(L(e,t).map(e=>e.name)),i={};for(let t of r){let r=e.variables[t];if(r===void 0)continue;let a=B(r,n);a!==void 0&&(i[t]=a)}return{...e,values:De(e.values,r),variables:i}}function B(e,t){let n=e.takeFrom!==void 0&&t.has(e.takeFrom)?e.takeFrom:void 0,r={...n===void 0?{}:{takeFrom:n},...e.hidden===void 0?{}:{hidden:e.hidden}};return Object.keys(r).length===0?void 0:r}function De(e,t){let n={};for(let[r,i]of Object.entries(e))t.has(r)&&(n[r]=i);return n}var Oe=/^[a-z][a-z0-9]*$/;function V(e,t){let n=[],r=new Set;e.version!==1&&n.push(`version must be 1.`),u(e.id)||n.push(`id "${e.id}" must use lowercase letters, digits, and single hyphens.`),e.title.trim()===``&&n.push(`title must not be empty.`),e.steps.length===0?n.push(`at least one step is required.`):e.steps.some(e=>e.kind===`subcalc`)||n.push(`at least one subcalculator step is required.`);for(let[i,a]of e.steps.entries()){let e=`step ${i+1} ("${a.id}")`;Oe.test(a.id)?r.has(a.id)&&n.push(`${e}: duplicate step id.`):n.push(`${e}: id must start with a lowercase letter and contain only lowercase letters and digits.`),r.add(a.id),a.label.trim()===``&&n.push(`${e}: label must not be empty.`),n.push(...Ae(e,a,t))}return n.push(...Fe(e,t)),n}function ke(e,t){let r=V(e,t);if(r.length>0)throw new n(`Invalid custom "${e.id}":\n- ${r.join(`
- `)}`)}function Ae(e,t,n){switch(t.kind){case`subcalc`:return je(e,t,n);case`variable`:return Me(e,t);case`text`:return Ne(e,t)}}function je(e,t,n){let r=[],i=n.get(t.calculatorId);if(i===void 0)return r.push(`${e}: unknown subcalculator "${t.calculatorId}".`),r;n.accepts(i.definition)||r.push(`${e}: "${t.calculatorId}" cannot be embedded because it runs an asynchronous simulation.`);let a=new Map(i.config.map(e=>[e.name,e]));for(let[n,i]of Object.entries(t.config)){let t=a.get(n);t===void 0?r.push(`${e}: unknown setting "${n}".`):r.push(...Pe(`${e} setting "${n}"`,t,i))}let o=L(t,n),s=new Set(o.map(e=>e.name));for(let n of Object.keys(t.values))s.has(n)||r.push(`${e}: unknown value "${n}".`);for(let i of o){if(!Object.hasOwn(t.values,i.name))continue;let a=t.values[i.name]??null;r.push(...H(`${e} value "${i.name}"`,i,a,n))}for(let n of Object.keys(t.variables))s.has(n)||r.push(`${e}: unknown variable "${n}".`);return r}function Me(e,t){let n=[];return re(t.unit)===null&&n.push(`${e}: unknown unit "${t.unit}".`),t.default===void 0||typeof t.default==`number`&&Number.isFinite(t.default)||n.push(`${e}: default must be a finite number.`),n}function Ne(e,t){let n=[];return t.default!==void 0&&typeof t.default!=`string`&&n.push(`${e}: default must be a string.`),n}function Pe(e,t,n){switch(t.kind){case`number`:return typeof n!=`number`||!Number.isFinite(n)?[`${e}: must be a finite number.`]:t.min!==void 0&&n<t.min?[`${e}: must be at least ${t.min}.`]:t.max!==void 0&&n>t.max?[`${e}: must be at most ${t.max}.`]:[];case`boolean`:return typeof n==`boolean`?[]:[`${e}: must be true or false.`];case`string`:return typeof n==`string`?[]:[`${e}: must be text.`];case`select`:return typeof n==`string`&&(t.options??[]).includes(n)?[]:[`${e}: must be one of the listed options.`]}}function H(e,t,n,r){if(n===null)return[];if(g(t)){if(typeof n!=`string`)return[`${e}: must be a row key or null.`];let i=r.getTable(t.table);return i===void 0?[`${e}: table "${t.table}" is not available.`]:l(i,n)===void 0?[`${e}: row "${n}" is not in table "${t.table}".`]:[]}return a(t)?typeof n==`string`?[]:[`${e}: must be text or null.`]:typeof n!=`number`||!Number.isFinite(n)?[`${e}: must be a finite number or null.`]:[]}function Fe(e,t){let n=[],r=new Map;for(let n of z(e,t))r.set(n.path,n);for(let i of e.steps)for(let e of R(i,t)){let t=e.wiring.takeFrom;if(t===void 0)continue;let a=y(i.id,e.name);n.push(...Ie(`wire into "${a}"`,t,a,e.definition,r))}return n}function Ie(e,t,n,r,i){if(t===``)return[`${e}: take from must not be empty.`];if(t===n)return[`${e}: a field cannot take its value from itself.`];if(b(t)===null)return[`${e}: "${t}" is not a "step.variable" path.`];let a=i.get(t);return a===void 0?[`${e}: "${t}" does not name a field of this custom.`]:Le(e,t,a.definition,r)}function Le(e,t,n,r){if(U(n,r))return[];let i=W(n),a=W(r);return i===a?i===`tableSelect`?[`${e}: "${t}" selects from table "${n.table}" but the field selects from "${r.table}".`]:[`${e}: "${t}" measures a different kind than the field.`]:[`${e}: "${t}" is ${i} but the field is ${a}.`]}function U(e,t){let n=W(e);if(n!==W(t))return!1;if(n===`tableSelect`)return e.table===t.table;if(n===`number`){let n=e.unit,r=t.unit;return h(n)===h(r)}return!0}function W(e){return g(e)?`tableSelect`:a(e)?`text`:`number`}function Re(e,t){ke(e,t);let n=Ce(e,t),r=n=>ze(e,t,n);return{id:e.id,title:e.title,...e.description===void 0?{}:{description:e.description},config:n,variables:r(I(n)),buildVariables:r}}function ze(e,t,n){let r=[];for(let i of e.steps)i.kind===`subcalc`?r.push(...Be(i,t,n)):r.push(Ve(i));let i=new Set(r.map(e=>e.base.name));return r.map(e=>Ge(e,i))}function Be(e,t,n){let r=t.requireEntry(e.calculatorId),i=r.variables(we(e,r,n)),a=i.map(e=>e.name);return i.map(t=>({step:e,wiring:e.variables[t.name]??{},base:Ue(e,t,a)}))}function Ve(e){if(e.kind===`subcalc`)throw Error(`A subcalculator step is not a standalone variable.`);return{step:e,wiring:e.variable,base:He(e)}}function He(e){let t=x(e.id,v);return e.kind===`variable`?{name:t,label:e.label,unit:e.unit,...e.default===void 0?{}:{default:e.default}}:{name:t,label:e.label,...e.default===void 0?{}:{default:e.default}}}function Ue(e,t,n){let r=x(e.id,t.name),i=`${e.label}: ${t.label}`,o=e.values[t.name]??null;if(g(t))return{name:r,label:i,table:t.table,...o===void 0||typeof o!=`string`?{}:{default:o},...G(t)};if(a(t)){let a=t.computable,s=a===void 0&&typeof o==`string`?{default:o}:{},c=a===void 0?{}:{computable:t=>a(K(t,e.id,n))};return{name:r,label:i,...G(t),...s,...c}}let s=t.computable,c=s===void 0&&t.tableSelect===void 0&&typeof o==`number`&&Number.isFinite(o)?{default:o}:{},l=s===void 0?{}:{computable:t=>s(K(t,e.id,n))},u=t.tableSelect===void 0?{}:{tableSelect:x(e.id,t.tableSelect),...t.tableField===void 0?{}:{tableField:t.tableField}},d=t.equivalent===void 0?{}:{equivalent:We(e.id,t.equivalent)};return{name:r,label:i,unit:t.unit,...t.defaultDisplayUnit===void 0?{}:{defaultDisplayUnit:t.defaultDisplayUnit},...t.unitOptions===void 0?{}:{unitOptions:t.unitOptions},...G(t),...c,...l,...u,...d}}function G(e){return{...e.editable===void 0?{}:{editable:e.editable},...e.description===void 0?{}:{description:e.description}}}function K(e,t,n){let r={};for(let i of n)r[i]=e[x(t,i)]??null;return r}function We(e,t){let n={};for(let[r,i]of Object.entries(t))n[x(e,r)]=i;return n}function Ge(e,t){let n=Ke(e.wiring.takeFrom,t),r=e.step.hidden===!0||e.wiring.hidden===!0;return{...e.base,...n===void 0?{}:{takeFrom:n},...r?{hidden:!0}:{}}}function Ke(e,t){if(e===void 0)return;let n=b(e);if(n===null)return;let r=x(n.stepId,n.variable);return t.has(r)?r:void 0}var qe=class{catalog;store;handle;compiled=new Map;problems=new Map;readError=null;constructor(e,t,n){this.handle=e,this.store=t,this.catalog=n}get error(){return this.readError}entries(){return this.readCustoms().map(e=>({custom:e,problem:this.problems.get(e.id)??null}))}get(e){return this.readCustoms().find(t=>t.id===e)}create(e){let t=this.requireStore().importCustom(e);return this.refresh(),t}save(e){let t=this.requireStore().save(e);return this.refresh(),t}remove(e){this.requireStore().delete(e),this.refresh()}importJson(e){let t=this.requireStore().importJson(e);return this.refresh(),t}refresh(){if(this.problems=new Map,this.store===null){this.readError=null;return}let e;try{e=this.store.list(),this.readError=null}catch(e){this.readError=r(e);return}let t=new Set;for(let n of e){t.add(n.id);let e=S(n),r=this.compiled.get(n.id);(r===void 0||r.json!==e)&&this.register(n,e)}for(let e of[...this.compiled.keys()])t.has(e)||(this.compiled.delete(e),this.handle.remove(e))}register(e,t){try{let n=Re(e,this.catalog);this.handle.upsert(n),this.compiled.set(e.id,{json:t,definition:n})}catch(t){this.compiled.delete(e.id),this.handle.remove(e.id),this.problems.set(e.id,r(t))}}readCustoms(){if(this.store===null)return[];try{return this.store.list()}catch(e){return this.readError=r(e),[]}}requireStore(){if(this.store===null)throw new t(`Customs cannot be saved in this browser.`);return this.store}},Je=0,Ye=class extends s{static properties={catalog:{attribute:!1},custom:{attribute:!1},stepIndex:{attribute:!1},onApply:{attribute:!1}};working=null;titleId=`calc-custom-step-title-${Je++}`;createRenderRoot(){return this}open(e,t){this.custom=e,this.stepIndex=t;let n=e.steps[t];this.working=n===void 0?null:X(n),this.requestUpdate(),this.updateComplete.then(()=>this.showDialog())}close(){let e=this.dialogElement;e!==null&&(e.open&&typeof e.close==`function`?e.close():e.removeAttribute(`open`))}render(){let e=this.working;return e===null?p:m`
      <dialog
        class="calc-dialog calc-custom-step-dialog"
        aria-labelledby=${this.titleId}
        @close=${()=>this.requestUpdate()}
      >
        <div class="calc-dialog-body">
          <header class="tool-bar calc-dialog-header">
            <h2 id=${this.titleId}>Edit step</h2>
            <span class="spacer"></span>
            <button class="button" type="button" @click=${this.close}>
              Cancel
            </button>
          </header>
          <label class="calc-custom-text">
            <span class="calc-field-label">Step label</span>
            <input
              class="form-control"
              type="text"
              data-testid="step-label"
              maxlength="80"
              .value=${e.label}
              @input=${this.handleLabel}
            />
          </label>
          ${this.renderBody(e)}
          <div class="calc-actions">
            <button
              class="button"
              type="button"
              data-testid="apply-step"
              @click=${this.handleApply}
            >
              Done
            </button>
          </div>
        </div>
      </dialog>
    `}renderBody(e){switch(e.kind){case`subcalc`:return this.renderSubcalc(e);case`variable`:return this.renderVariable(e);case`text`:return this.renderText(e)}}renderSubcalc(e){let t=this.catalog?.get(e.calculatorId);if(t===void 0)return m`
        <p class="alert danger">
          The subcalculator "${e.calculatorId}" is not available.
        </p>
      `;let n=q(t,e);return m`
      <p class="help">
        Subcalculator: <strong>${t.definition.title}</strong>
      </p>
      ${t.config.length===0?p:m`
              <div class="calc-config">
                <h3 class="calc-section-title">Settings</h3>
                <div class="calc-config-fields">
                  ${t.config.map(n=>this.renderConfigField(t,e,n.name))}
                </div>
              </div>
            `}
      <h3 class="calc-section-title">Fields</h3>
      <div class="calc-fields">
        ${n.map(t=>this.renderSubcalcField(e,t))}
      </div>
    `}renderConfigField(e,t,n){let r=e.config.find(e=>e.name===n);return r===void 0?m``:m`
      <label class="calc-config-field">
        <span class="calc-config-label">${r.label}</span>
        ${ne(r,t.config[r.name],e=>this.applyConfig(r.name,e))}
      </label>
      ${r.description===void 0?p:m`<p class="help calc-config-help">${r.description}</p>`}
    `}renderSubcalcField(e,t){let n=t.name,r=e.variables[n]??{},i=r.takeFrom!==void 0,a=y(e.id,n),o=this.optionsFor(t,a);return m`
      <div
        class="calc-field ${i?`highlight`:``}"
        data-testid=${`step-field-${n}`}
      >
        <div class="calc-field-header">
          <span class="calc-field-label">${t.label}</span>
          <label class="calc-custom-hidden">
            <input
              type="checkbox"
              data-testid=${`hidden-${n}`}
              ?checked=${r.hidden===!0}
              @change=${e=>this.handleHidden(e,e=>this.setWiring(n,e))}
            />
            Hidden
          </label>
        </div>
        ${i?m`<p class="help calc-field-source">
                Taken from ${this.sourceLabel(e,n)??r.takeFrom}
              </p>`:p}
        <label class="calc-custom-wire">
          <span class="help">Take from</span>
          <select
            class="form-control"
            data-testid=${`take-from-${n}`}
            @change=${e=>this.handleTakeFrom(e,e=>this.setWiring(n,e))}
          >
            <option value="" ?selected=${!i}>— none —</option>
            ${o.map(e=>m`
                <option
                  value=${e.path}
                  ?selected=${e.path===r.takeFrom}
                >
                  ${e.stepLabel}: ${e.variableLabel}
                </option>
              `)}
          </select>
        </label>
        ${this.renderValue(t,e.values[n]??null,i)}
        ${t.description===void 0?p:m`<p class="help calc-field-help">
                ${t.description}
              </p>`}
      </div>
    `}renderValue(e,t,n){if(!Xe(e))return m`<p class="help calc-field-help">
        Computed by the subcalculator.
      </p>`;if(g(e)){let r=this.catalog?.getTable(e.table);return m`
        <div class="calc-field-input">
          <select
            class="form-control calc-table-select"
            data-testid=${`value-${e.name}`}
            ?disabled=${n}
            @change=${t=>this.handleValue(t,e.name)}
          >
            <option value="" ?selected=${typeof t!=`string`}>
              — none —
            </option>
            ${(r?.rows??[]).map(e=>{let n=te(r,e)??``;return m`
                <option value=${n} ?selected=${n===t}>
                  ${ee(r,e)}
                </option>
              `})}
          </select>
        </div>
      `}return a(e)?m`
        <div class="calc-field-input">
          <input
            class="form-control calc-value-input"
            type="text"
            data-testid=${`value-${e.name}`}
            ?disabled=${n}
            .value=${typeof t==`string`?t:``}
            @change=${t=>this.handleValue(t,e.name)}
          />
        </div>
      `:m`
      <div class="calc-field-input">
        <input
          class="form-control calc-value-input"
          type="number"
          step="any"
          data-testid=${`value-${e.name}`}
          ?disabled=${n}
          .value=${typeof t==`number`?String(t):``}
          @change=${t=>this.handleValue(t,e.name)}
        />
        <span class="help calc-custom-unit">${e.unit}</span>
      </div>
    `}renderVariable(e){let t=P(e),n=e.variable.takeFrom!==void 0,r=this.optionsFor(t,y(e.id,v));return m`
      <label class="calc-custom-text">
        <span class="calc-field-label">Unit</span>
        <select
          class="form-control"
          data-testid="step-unit"
          @change=${this.handleUnit}
        >
          ${[...c()].map(([t,n])=>m`
              <optgroup label=${t}>
                ${n.map(t=>m`
                    <option value=${t} ?selected=${t===e.unit}>
                      ${t}
                    </option>
                  `)}
              </optgroup>
            `)}
        </select>
      </label>
      <label class="calc-custom-text">
        <span class="calc-field-label">Default</span>
        <input
          class="form-control"
          type="number"
          step="any"
          data-testid="step-default"
          ?disabled=${n}
          .value=${e.default===void 0?``:String(e.default)}
          @change=${this.handleDefault}
        />
      </label>
      ${this.renderStandaloneWiring(r,n,e.variable,`value`)}
    `}renderText(e){let t=P(e),n=e.variable.takeFrom!==void 0,r=this.optionsFor(t,y(e.id,v));return m`
      <label class="calc-custom-text">
        <span class="calc-field-label">Default text</span>
        <input
          class="form-control"
          type="text"
          data-testid="step-default"
          ?disabled=${n}
          .value=${e.default??``}
          @change=${this.handleText}
        />
      </label>
      ${this.renderStandaloneWiring(r,n,e.variable,`value`)}
    `}renderStandaloneWiring(e,t,n,r){let i=t?this.labelForPath(n.takeFrom):null;return m`
      <div class="calc-field ${t?`highlight`:``}">
        <div class="calc-field-header">
          <span class="calc-field-label">Wiring</span>
          <label class="calc-custom-hidden">
            <input
              type="checkbox"
              data-testid="hidden-value"
              ?checked=${n.hidden===!0}
              @change=${e=>this.handleHidden(e,e=>this.setStandaloneWiring(e))}
            />
            Hidden
          </label>
        </div>
        ${t?m`<p class="help calc-field-source">
                Taken from ${i??n.takeFrom}
              </p>`:p}
        <label class="calc-custom-wire">
          <span class="help">Take from</span>
          <select
            class="form-control"
            data-testid=${`take-from-${r}`}
            @change=${e=>this.handleTakeFrom(e,e=>this.setStandaloneWiring(e))}
          >
            <option value="" ?selected=${!t}>— none —</option>
            ${e.map(e=>m`
                <option
                  value=${e.path}
                  ?selected=${e.path===n.takeFrom}
                >
                  ${e.stepLabel}: ${e.variableLabel}
                </option>
              `)}
          </select>
        </label>
      </div>
    `}optionsFor(e,t){return this.allOptions().filter(n=>n.path!==t&&U(n.definition,e))}allOptions(){let e=this.custom,t=this.catalog,n=this.working;if(e===void 0||t===void 0||n===null)return[];let r=e.steps.map((e,t)=>t===this.stepIndex?n:e);return z({...e,steps:r},t)}labelForPath(e){if(e===void 0)return null;let t=this.allOptions().find(t=>t.path===e);return t===void 0?null:`${t.stepLabel}: ${t.variableLabel}`}sourceLabel(e,t){return this.labelForPath(e.variables[t]?.takeFrom)}applyConfig(e,t){let n=this.working,r=this.catalog?.get(n?.kind===`subcalc`?n.calculatorId:``);if(n===null||n.kind!==`subcalc`||r===void 0)return;let i={...n.config,[e]:t},a=new Set(q(r,{...n,config:i}).map(e=>e.name));this.working={...n,config:i,values:J(n.values,a),variables:J(n.variables,a)},this.requestUpdate()}setWiring(e,t){let n=this.working;if(n===null||n.kind!==`subcalc`)return;let r=n.variables[e]??{};this.working={...n,variables:{...n.variables,[e]:t(r)}},this.requestUpdate()}setStandaloneWiring(e){let t=this.working;t!==null&&t.kind!==`subcalc`&&(this.working={...t,variable:e(t.variable)},this.requestUpdate())}handleLabel=e=>{let t=e.target,n=this.working;n!==null&&t instanceof HTMLInputElement&&(this.working={...n,label:t.value})};handleTakeFrom=(e,t)=>{let n=e.target;if(!(n instanceof HTMLSelectElement))return;let r=n.value.trim();t(e=>Qe(e,r===``?void 0:r))};handleHidden=(e,t)=>{let n=e.target;if(!(n instanceof HTMLInputElement))return;let r=n.checked;t(e=>({...e,hidden:r}))};handleValue=(e,t)=>{let n=this.working,r=e.target;if(n===null||n.kind!==`subcalc`||!(r instanceof HTMLInputElement)&&!(r instanceof HTMLSelectElement))return;let i=q(this.catalog?.requireEntry(n.calculatorId),n).find(e=>e.name===t);if(i===void 0)return;let a=Ze(i,r.value);this.working={...n,values:{...n.values,[t]:a}}};handleUnit=e=>{let t=e.target,n=this.working;n!==null&&n.kind===`variable`&&t instanceof HTMLSelectElement&&(this.working={...n,unit:t.value})};handleDefault=e=>{let t=e.target,n=this.working;if(n===null||n.kind!==`variable`||!(t instanceof HTMLInputElement))return;let r=Number(t.value);this.working=Number.isFinite(r)?{...n,default:r}:Y(n)};handleText=e=>{let t=e.target,n=this.working;if(n===null||n.kind!==`text`||!(t instanceof HTMLInputElement))return;let r=t.value.trim();this.working=r===``?Y(n):{...n,default:r}};handleApply=()=>{let e=this.working;e!==null&&this.onApply?.(e),this.close()};get dialogElement(){return this.querySelector(`dialog.calc-dialog`)}showDialog(){let e=this.dialogElement;e===null||e.open||(typeof e.showModal==`function`?e.showModal():e.setAttribute(`open`,``))}};function Xe(t){return!i(t)||t.computable===void 0&&!e(t)}function q(e,t){return e.variables(F(e.config,t.config))}function J(e,t){let n={};for(let[r,i]of Object.entries(e))t.has(r)&&(n[r]=i);return n}function Ze(e,t){if(g(e)||a(e)){let e=t.trim();return e===``?null:e}let n=t.trim();if(n===``)return null;let r=Number(n);return Number.isFinite(r)?r:null}function Qe(e,t){return t===void 0?$e(e,`takeFrom`):{...e,takeFrom:t}}function $e(e,t){let{[t]:n,...r}=e;return r}function Y(e){let{default:t,...n}=e;return n}function X(e){return e.kind===`subcalc`?{kind:`subcalc`,id:e.id,label:e.label,...e.hidden===void 0?{}:{hidden:e.hidden},calculatorId:e.calculatorId,config:{...e.config},values:{...e.values},variables:et(e.variables)}:e.kind===`variable`?{kind:`variable`,id:e.id,label:e.label,...e.hidden===void 0?{}:{hidden:e.hidden},unit:e.unit,...e.default===void 0?{}:{default:e.default},variable:Z(e.variable)}:{kind:`text`,id:e.id,label:e.label,...e.hidden===void 0?{}:{hidden:e.hidden},...e.default===void 0?{}:{default:e.default},variable:Z(e.variable)}}function et(e){let t={};for(let[n,r]of Object.entries(e))t[n]=Z(r);return t}function Z(e){return{...e.takeFrom===void 0?{}:{takeFrom:e.takeFrom},...e.hidden===void 0?{}:{hidden:e.hidden}}}customElements.define(`calc-custom-step-dialog`,Ye);var tt=0,nt=class extends s{static properties={catalog:{attribute:!1},onChosen:{attribute:!1}};filter=``;titleId=`calc-calculator-browser-title-${tt++}`;createRenderRoot(){return this}open(){this.filter=``,this.requestUpdate(),this.updateComplete.then(()=>this.showDialog())}close(){let e=this.dialogElement;e!==null&&(e.open&&typeof e.close==`function`?e.close():e.removeAttribute(`open`))}render(){let e=this.visibleEntries();return m`
      <dialog
        class="calc-dialog"
        aria-labelledby=${this.titleId}
        @close=${this.handleClose}
      >
        <div class="calc-dialog-body">
          <header class="tool-bar calc-dialog-header">
            <h2 id=${this.titleId}>Add a subcalculator</h2>
            <span class="spacer"></span>
            <button class="button" type="button" @click=${this.close}>
              Close
            </button>
          </header>
          <label class="calc-custom-filter">
            <span class="calc-field-label">Filter</span>
            <input
              class="form-control"
              type="search"
              autocomplete="off"
              placeholder="Filter by name"
              .value=${this.filter}
              @input=${this.handleFilter}
            />
          </label>
          <div class="calc-tiles calc-custom-browser">
            ${e.map(e=>this.renderEntry(e))}
          </div>
          ${e.length===0?m`<p class="help">No calculators match this filter.</p>`:p}
        </div>
      </dialog>
    `}renderEntry(e){let t=e.definition.description??``;return m`
      <button
        class="card calc-tile"
        type="button"
        data-testid=${`choose-${e.definition.id}`}
        @click=${()=>this.choose(e.definition.id)}
      >
        <strong>${e.definition.title}</strong>
        ${t===``?p:m`<span class="help">${t}</span>`}
      </button>
    `}visibleEntries(){let e=this.catalog?.list()??[],t=this.filter.trim().toLowerCase();return t===``?e:e.filter(e=>e.definition.title.toLowerCase().includes(t)||e.definition.id.toLowerCase().includes(t))}handleFilter=e=>{let t=e.target;t instanceof HTMLInputElement&&(this.filter=t.value,this.requestUpdate())};choose(e){this.onChosen?.(e),this.close()}handleClose=()=>{this.filter=``,this.requestUpdate()};get dialogElement(){return this.querySelector(`dialog.calc-dialog`)}showDialog(){let e=this.dialogElement;e===null||e.open||(typeof e.showModal==`function`?e.showModal():e.setAttribute(`open`,``))}};customElements.define(`calc-calculator-browser`,nt);var rt=80,it=0,at=class extends s{static properties={catalog:{attribute:!1},library:{attribute:!1},onSaved:{attribute:!1},onDeleted:{attribute:!1}};working=null;isNew=!0;stepIndex=-1;error=``;confirmingDelete=!1;titleId=`calc-custom-editor-title-${it++}`;createRenderRoot(){return this}open(e){this.isNew=e===null,this.working=e===null?{version:1,id:`custom`,title:``,steps:[]}:Q(e),this.stepIndex=-1,this.error=``,this.confirmingDelete=!1,this.requestUpdate(),this.updateComplete.then(()=>this.showDialog())}close(){let e=this.dialogElement;e!==null&&(e.open&&typeof e.close==`function`?e.close():e.removeAttribute(`open`))}render(){let e=this.working;if(e===null)return p;let t=this.problems();return m`
      <dialog
        class="calc-dialog calc-custom-editor"
        aria-labelledby=${this.titleId}
      >
        <div class="calc-dialog-body">
          <header class="tool-bar calc-dialog-header">
            <h2 id=${this.titleId}>
              ${this.isNew?`New custom`:`Edit custom`}
            </h2>
            <span class="spacer"></span>
            <button class="button" type="button" @click=${this.close}>
              Cancel
            </button>
          </header>
          <label class="calc-custom-text">
            <span class="calc-field-label">Title</span>
            <input
              class="form-control"
              type="text"
              data-testid="custom-title"
              maxlength=${rt}
              .value=${e.title}
              @input=${this.handleTitle}
            />
          </label>
          <label class="calc-custom-text">
            <span class="calc-field-label">Description</span>
            <input
              class="form-control"
              type="text"
              data-testid="custom-description"
              .value=${e.description??``}
              @input=${this.handleDescription}
            />
          </label>
          <p class="help">Saved as <code>${e.id}</code></p>
          <h3 class="calc-section-title">Steps</h3>
          ${this.renderSteps(e)} ${this.renderAddActions()}
          ${this.renderProblems(t)} ${this.renderError()}
          <div class="calc-actions">
            ${this.renderDelete()}
            <span class="spacer"></span>
            <button
              class="button"
              type="button"
              data-testid="save-custom"
              ?disabled=${t.length>0||this.library===void 0}
              @click=${this.handleSave}
            >
              Save
            </button>
          </div>
        </div>
      </dialog>
      <calc-custom-step-dialog
        .catalog=${this.catalog}
        .onApply=${this.applyStep}
      ></calc-custom-step-dialog>
      <calc-calculator-browser
        .catalog=${this.catalog}
        .onChosen=${this.addSubcalc}
      ></calc-calculator-browser>
    `}renderSteps(e){return e.steps.length===0?m`
        <p class="help" data-testid="no-steps">
          Add a subcalculator to start building.
        </p>
      `:m`
      <ol class="calc-custom-steps">
        ${e.steps.map((t,n)=>this.renderStepRow(t,n,e.steps.length))}
      </ol>
    `}renderStepRow(e,t,n){return m`
      <li class="calc-custom-step" data-testid=${`step-${t}`}>
        <span class="calc-custom-step-index">${t+1}</span>
        <div class="calc-custom-step-main">
          <strong>${e.label}</strong>
          <span class="help">${ot(e,this.catalog)}</span>
        </div>
        <label class="calc-custom-hidden">
          <input
            type="checkbox"
            data-testid=${`step-hidden-${t}`}
            ?checked=${e.hidden===!0}
            @change=${e=>this.handleStepHidden(e,t)}
          />
          Hidden
        </label>
        <div class="calc-custom-step-actions">
          <button
            class="button"
            type="button"
            data-testid=${`step-edit-${t}`}
            @click=${()=>this.editStep(t)}
          >
            Edit
          </button>
          <button
            class="button"
            type="button"
            data-testid=${`step-up-${t}`}
            ?disabled=${t===0}
            @click=${()=>this.moveStep(t,-1)}
          >
            ↑
          </button>
          <button
            class="button"
            type="button"
            data-testid=${`step-down-${t}`}
            ?disabled=${t===n-1}
            @click=${()=>this.moveStep(t,1)}
          >
            ↓
          </button>
          <button
            class="button"
            type="button"
            data-testid=${`step-remove-${t}`}
            @click=${()=>this.removeStep(t)}
          >
            Remove
          </button>
        </div>
      </li>
    `}renderAddActions(){return m`
      <div class="calc-actions">
        <button
          class="button"
          type="button"
          data-testid="add-subcalc"
          @click=${this.openBrowser}
        >
          Add subcalculator
        </button>
        <button
          class="button"
          type="button"
          data-testid="add-value"
          @click=${this.addValue}
        >
          Add value
        </button>
        <button
          class="button"
          type="button"
          data-testid="add-text"
          @click=${this.addText}
        >
          Add text
        </button>
      </div>
    `}renderProblems(e){return e.length===0?p:m`
      <div class="alert danger calc-custom-problems" role="alert">
        <p>Fix these before saving:</p>
        <ul>
          ${e.map(e=>m`<li>${e}</li>`)}
        </ul>
      </div>
    `}renderError(){return this.error===``?p:m`
      <p class="alert danger" role="alert" data-testid="save-error">
        ${this.error}
      </p>
    `}renderDelete(){return this.isNew?p:m`
      <button
        class="button danger"
        type="button"
        data-testid="delete-custom"
        @click=${this.handleDelete}
      >
        ${this.confirmingDelete?`Confirm delete`:`Delete`}
      </button>
    `}problems(){let e=this.catalog,t=this.working;return e===void 0||t===null?[]:V(t,e)}applyStep=e=>{let t=this.working;if(t===null||this.stepIndex<0)return;let n=[...t.steps];n[this.stepIndex]=e,this.working={...t,steps:n},this.prune(),this.requestUpdate()};editStep(e){let t=this.working;t!==null&&(this.stepIndex=e,this.stepDialog?.open(t,e))}addSubcalc=e=>{let t=this.catalog?.get(e),n=this.working;if(t===void 0||n===null)return;let r={kind:`subcalc`,id:this.freeStepId(e),label:t.definition.title,calculatorId:e,config:I(t.config),values:{},variables:{}};this.appendStep(r)};addValue=()=>{let e={kind:`variable`,id:this.freeStepId(`value`),label:`Value`,unit:`1`,variable:{}};this.appendStep(e)};addText=()=>{let e={kind:`text`,id:this.freeStepId(`text`),label:`Text`,variable:{}};this.appendStep(e)};appendStep(e){let t=this.working;if(t===null)return;let n=[...t.steps,e];this.working={...t,steps:n},this.requestUpdate();let r=n.length-1;this.updateComplete.then(()=>this.editStep(r))}moveStep(e,t){let n=this.working;if(n===null)return;let r=e+t;if(r<0||r>=n.steps.length)return;let i=[...n.steps],a=i[e],o=i[r];a!==void 0&&o!==void 0&&(i[e]=o,i[r]=a,this.working={...n,steps:i},this.prune(),this.requestUpdate())}removeStep(e){let t=this.working;if(t===null)return;let n=t.steps.filter((t,n)=>n!==e);this.working={...t,steps:n},this.prune(),this.requestUpdate()}handleStepHidden=(e,t)=>{let n=e.target,r=this.working;if(r===null||!(n instanceof HTMLInputElement))return;let i=r.steps[t];if(i===void 0)return;let a=[...r.steps];a[t]=lt(i,n.checked),this.working={...r,steps:a},this.requestUpdate()};handleTitle=e=>{let t=e.target,n=this.working;if(n===null||!(t instanceof HTMLInputElement))return;let r=t.value,i={...n,title:r};this.working=this.isNew?{...i,id:ct(r,this.takenIds())}:i,this.requestUpdate()};handleDescription=e=>{let t=e.target,n=this.working;if(n===null||!(t instanceof HTMLInputElement))return;let r=t.value.trim(),{description:i,...a}=n;this.working=r===``?a:{...a,description:r},this.requestUpdate()};handleSave=()=>{let e=this.library,t=this.working;if(e===void 0||t===null)return;let n=ut(t);try{let t=this.isNew?e.create(n):e.save(n);this.working=Q(t),this.isNew=!1,this.onSaved?.(t),this.close()}catch(e){this.error=r(e),this.requestUpdate()}};handleDelete=()=>{let e=this.library,t=this.working;if(e!==void 0&&t!==null){if(!this.confirmingDelete)this.confirmingDelete=!0,this.requestUpdate();else try{e.remove(t.id),this.onDeleted?.(t.id),this.close()}catch(e){this.error=r(e),this.requestUpdate()}}};openBrowser=()=>{this.browserDialog?.open()};prune(){let e=this.catalog;e!==void 0&&this.working!==null&&(this.working=Te(this.working,e))}freeStepId(e){return st(e,new Set((this.working?.steps??[]).map(e=>e.id)))}takenIds(){let e=this.library?.entries()??[];return new Set(e.map(e=>e.custom.id))}get dialogElement(){return this.querySelector(`dialog.calc-dialog`)}get stepDialog(){return this.querySelector(`calc-custom-step-dialog`)}get browserDialog(){return this.querySelector(`calc-calculator-browser`)}showDialog(){let e=this.dialogElement;e===null||e.open||(typeof e.showModal==`function`?e.showModal():e.setAttribute(`open`,``))}};function ot(e,t){switch(e.kind){case`subcalc`:return t?.get(e.calculatorId)?.definition.title??e.calculatorId;case`variable`:return`Number (${e.unit})`;case`text`:return`Text output`}}function st(e,t){let n=e.toLowerCase().replace(/[^a-z0-9]/g,``)||`step`;if(!t.has(n))return n;for(let e=2;e<=t.size+2;e+=1){let r=`${n}${e}`;if(!t.has(r))return r}return`${n}${t.size+2}`}function ct(e,t){let n=e.toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``).slice(0,48),r=n===``?`custom`:n;if(!t.has(r))return r;for(let e=2;e<=t.size+2;e+=1){let n=`${r}-${e}`;if(!t.has(n))return n}return`${r}-${t.size+2}`}function lt(e,t){if(t)return{...e,hidden:!0};let{hidden:n,...r}=e;return r}function ut(e){let t=e.title.trim();return t===e.title?e:{...e,title:t}}function Q(e){return{version:e.version,id:e.id,title:e.title,...e.description===void 0?{}:{description:e.description},steps:e.steps.map(e=>X(e))}}customElements.define(`calc-custom-editor`,at);var dt=0,ft=class extends s{static properties={library:{attribute:!1},onImported:{attribute:!1}};text=``;error=``;titleId=`calc-custom-import-title-${dt++}`;createRenderRoot(){return this}open(){this.text=``,this.error=``,this.requestUpdate(),this.updateComplete.then(()=>this.showDialog())}close(){let e=this.dialogElement;e!==null&&(e.open&&typeof e.close==`function`?e.close():e.removeAttribute(`open`))}render(){return m`
      <dialog
        class="calc-dialog"
        aria-labelledby=${this.titleId}
        @close=${this.handleClose}
      >
        <div class="calc-dialog-body">
          <header class="tool-bar calc-dialog-header">
            <h2 id=${this.titleId}>Import custom</h2>
            <span class="spacer"></span>
            <button class="button" type="button" @click=${this.close}>
              Close
            </button>
          </header>
          <p class="help">
            Paste exported JSON, or choose a .json file saved from another
            custom.
          </p>
          <label class="calc-custom-file">
            <span class="calc-field-label">File</span>
            <input
              class="form-control"
              type="file"
              accept=".json,application/json"
              data-testid="import-file"
              @change=${this.handleFile}
            />
          </label>
          <textarea
            class="form-control calc-custom-json"
            data-testid="import-json"
            rows="10"
            spellcheck="false"
            placeholder='{ "version": 1, "id": "...", "title": "...", ... }'
            .value=${this.text}
            @input=${this.handleText}
          ></textarea>
          ${this.error===``?p:m`<p class="alert danger" role="alert">${this.error}</p>`}
          <div class="calc-actions">
            <button
              class="button"
              type="button"
              data-testid="import-submit"
              ?disabled=${this.text.trim()===``}
              @click=${this.handleImport}
            >
              Import
            </button>
          </div>
        </div>
      </dialog>
    `}handleText=e=>{let t=e.target;t instanceof HTMLTextAreaElement&&(this.text=t.value,this.error=``,this.requestUpdate())};handleFile=e=>{let t=e.target;if(!(t instanceof HTMLInputElement))return;let n=t.files?.[0];n!==void 0&&n.text().then(e=>{this.text=e.trim(),this.error=``,this.requestUpdate()},e=>{this.error=`Could not read that file: ${r(e)}`,this.requestUpdate()})};handleImport=()=>{let e=this.library;if(e!==void 0)try{let t=e.importJson(this.text.trim());this.onImported?.(t),this.close()}catch(e){this.error=r(e),this.requestUpdate()}};handleClose=()=>{this.error=``,this.requestUpdate()};get dialogElement(){return this.querySelector(`dialog.calc-dialog`)}showDialog(){let e=this.dialogElement;e===null||e.open||(typeof e.showModal==`function`?e.showModal():e.setAttribute(`open`,``))}};customElements.define(`calc-custom-import`,ft);var pt=0,mt=class extends s{custom=null;text=``;status=``;titleId=`calc-custom-export-title-${pt++}`;createRenderRoot(){return this}open(e){this.custom=e,this.text=S(e),this.status=``,this.requestUpdate(),this.updateComplete.then(()=>this.showDialog())}close(){let e=this.dialogElement;e!==null&&(e.open&&typeof e.close==`function`?e.close():e.removeAttribute(`open`))}render(){let e=this.custom;return e===null?p:m`
      <dialog
        class="calc-dialog"
        aria-labelledby=${this.titleId}
        @close=${this.handleClose}
      >
        <div class="calc-dialog-body">
          <header class="tool-bar calc-dialog-header">
            <h2 id=${this.titleId}>Export "${e.title}"</h2>
            <span class="spacer"></span>
            <button class="button" type="button" @click=${this.close}>
              Close
            </button>
          </header>
          <p class="help">
            Copy this JSON, or download it as a file to share with others.
          </p>
          <textarea
            class="form-control calc-custom-json"
            data-testid="export-json"
            readonly
            rows="12"
            spellcheck="false"
            .value=${this.text}
          ></textarea>
          ${this.status===``?p:m`<p class="help calc-status" role="status">
                  ${this.status}
                </p>`}
          <div class="calc-actions">
            <button
              class="button"
              type="button"
              data-testid="copy-json"
              @click=${this.handleCopy}
            >
              Copy
            </button>
            <button
              class="button"
              type="button"
              data-testid="download-json"
              @click=${this.handleDownload}
            >
              Download file
            </button>
          </div>
        </div>
      </dialog>
    `}handleCopy=async()=>{let e=navigator.clipboard;if(e!==void 0&&typeof e.writeText==`function`)try{await e.writeText(this.text),this.status=`Copied to the clipboard.`,this.requestUpdate();return}catch{}this.textArea?.select(),this.status=`Press Ctrl+C (or ⌘C) to copy the selected text.`,this.requestUpdate()};handleDownload=()=>{let e=this.custom;if(e===null)return;let t=new Blob([this.text],{type:`application/json`}),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=`${$(e.id)}.json`,r.style.display=`none`,document.body.append(r),r.click(),r.remove(),URL.revokeObjectURL(n),this.status=`Downloaded ${$(e.id)}.json.`,this.requestUpdate()};handleClose=()=>{this.status=``,this.requestUpdate()};get textArea(){return this.querySelector(`textarea`)}get dialogElement(){return this.querySelector(`dialog.calc-dialog`)}showDialog(){let e=this.dialogElement;e===null||e.open||(typeof e.showModal==`function`?e.showModal():e.setAttribute(`open`,``))}};function $(e){let t=e.replace(/[^a-z0-9-]+/gi,`-`).replace(/^-+|-+$/g,``);return(t===``?`custom`:t).slice(0,64)}customElements.define(`calc-custom-export`,mt);var ht=class extends s{static properties={handle:{attribute:!1},store:{attribute:!1},openCalculator:{attribute:!1},onChanged:{attribute:!1}};library=null;catalog=null;pendingDelete=null;createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),this.ensureLibrary()}render(){this.ensureLibrary();let e=this.library;return e===null?m`<p class="help" data-testid="custom-preparing">
        Preparing the Custom category…
      </p>`:m`
      <div class="calc-actions calc-custom-toolbar">
        <button
          class="button"
          type="button"
          data-testid="new-custom"
          @click=${this.openEditor}
        >
          New custom
        </button>
        <button
          class="button"
          type="button"
          data-testid="import-custom"
          @click=${this.openImport}
        >
          Import
        </button>
      </div>
      ${this.renderError(e)} ${this.renderEntries(e)}
      <calc-custom-editor
        .catalog=${this.catalog}
        .library=${e}
        .onSaved=${this.handleSaved}
        .onDeleted=${this.handleDeleted}
      ></calc-custom-editor>
      <calc-custom-import
        .library=${e}
        .onImported=${this.handleImported}
      ></calc-custom-import>
      <calc-custom-export></calc-custom-export>
    `}renderError(e){let t=e.error;return t===null?p:m`
      <p class="alert danger" role="alert" data-testid="custom-read-error">
        ${t}
      </p>
    `}renderEntries(e){let t=e.entries();return t.length===0?m`
        <p class="help" data-testid="custom-empty">
          You have no saved customs yet. Create one, or import one shared with
          you.
        </p>
      `:m`
      <div class="calc-custom-list">
        ${t.map(e=>this.renderEntry(e))}
      </div>
    `}renderEntry(e){let t=e.custom,n=`${t.steps.length} step${t.steps.length===1?``:`s`}`;return m`
      <div class="calc-custom-entry" data-testid=${`custom-${t.id}`}>
        <div class="calc-custom-entry-main">
          <strong>${t.title}</strong>
          <span class="help">${n}</span>
          ${t.description===void 0||t.description.trim()===``?p:m`<span class="help">${t.description}</span>`}
        </div>
        ${e.problem===null?p:m`
                <p
                  class="alert danger"
                  role="alert"
                  data-testid=${`custom-problem-${t.id}`}
                >
                  ${e.problem}
                </p>
              `}
        <div class="calc-actions">
          <button
            class="button"
            type="button"
            data-testid=${`custom-open-${t.id}`}
            ?disabled=${e.problem!==null}
            @click=${()=>this.openCalculator?.(t.id)}
          >
            Open
          </button>
          <button
            class="button"
            type="button"
            data-testid=${`custom-edit-${t.id}`}
            @click=${()=>this.edit(t.id)}
          >
            Edit
          </button>
          <button
            class="button"
            type="button"
            data-testid=${`custom-export-${t.id}`}
            @click=${()=>this.exportDialog?.open(t)}
          >
            Export
          </button>
          <button
            class="button danger"
            type="button"
            data-testid=${`custom-delete-${t.id}`}
            @click=${()=>this.removeCustom(t.id)}
          >
            ${this.pendingDelete===t.id?`Confirm delete`:`Delete`}
          </button>
        </div>
      </div>
    `}ensureLibrary(){this.library===null&&this.handle!==void 0&&(this.catalog=fe.standard(),this.library=new qe(this.handle,this.resolveStore(),this.catalog),this.library.refresh())}resolveStore(){if(this.store!==void 0)return this.store;let e=d();return e===null?null:new j(e)}openEditor=()=>{this.editorDialog?.open(null)};edit(e){let t=this.library?.get(e);t!==void 0&&this.editorDialog?.open(t)}openImport=()=>{this.importDialog?.open()};removeCustom(e){let t=this.library;if(t!==null){if(this.pendingDelete!==e)this.pendingDelete=e,this.requestUpdate();else{this.pendingDelete=null;try{t.remove(e)}catch{}this.onChanged?.(),this.requestUpdate()}}}handleSaved=e=>{this.onChanged?.(),this.requestUpdate(),this.openCalculator?.(e.id)};handleDeleted=()=>{this.onChanged?.(),this.requestUpdate()};handleImported=()=>{this.onChanged?.(),this.requestUpdate()};get editorDialog(){return this.querySelector(`calc-custom-editor`)}get importDialog(){return this.querySelector(`calc-custom-import`)}get exportDialog(){return this.querySelector(`calc-custom-export`)}};customElements.define(`calc-custom-hub`,ht);var gt=[],_t=[];export{gt as calculators,_t as tables};
//# sourceMappingURL=custom-DN8bIZGz.js.map