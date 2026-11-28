import{A as e,C as t,D as n,F as r,I as i,M as a,N as o,O as s,P as c,T as l,a as u,f as d,i as f,j as ee,o as p,p as te,s as m,t as ne,u as h,w as re,y as g}from"./index-B0-IRmMJ.js";var _=`value`;function v(e,t){return`${e}.${t}`}function y(e){let t=e.indexOf(`.`);if(t<=0||t===e.length-1)return null;let n=e.slice(0,t),r=e.slice(t+1);return r.includes(`.`)?null:{stepId:n,variable:r}}function ie(e,t){return`${e}:${t}`}function b(e){let t=e.indexOf(`:`);if(t<=0||t===e.length-1)return null;let n=e.slice(0,t),r=e.slice(t+1);return r.includes(`:`)?null:{categoryId:n,calculatorId:r}}function x(e,t){return`${e}_${t}`}var ae=class{app;embeddedIds;constructor(e,t={}){this.app=e;let n=new Set(t.exclude??[]);this.embeddedIds=e.categoryIds.filter(t=>!n.has(t)&&e.manifest[t]?.hub===void 0)}categories(){let e=[];for(let t of this.embeddedIds){let n=this.app.manifest[t];n!==void 0&&e.push({id:t,title:n.title,description:n.description})}return e}async load(e){await this.app.categories[e]?.load()}isLoaded(e){return this.app.categories[e]?.isLoaded??!1}entries(e){let t=this.app.categories[e];return t===void 0?[]:t.calculators.filter(e=>this.accepts(e.definition)).map(t=>this.entry(e,t.definition))}get(e){let t=b(e);if(t===null)return;let n=this.app.categories[t.categoryId]?.get(t.calculatorId)?.definition;if(n!==void 0&&this.accepts(n))return this.entry(t.categoryId,n)}requireEntry(e){let t=this.get(e);if(t===void 0)throw new c(`Unknown subcalculator "${e}".`);return t}getTable(e){for(let t of this.embeddedIds){let n=this.app.categories[t]?.getTable(e);if(n!==void 0)return n}}accepts(e){return e.computeState===void 0}entry(e,t){return{definition:t,categoryId:e,ref:ie(e,t.id),config:t.config??[],variables:e=>t.buildVariables?.(e)??t.variables}}};function S(e){return`${JSON.stringify(e,null,2)}\n`}function oe(e){let t;try{t=JSON.parse(e)}catch(e){throw new c(`The custom text is not valid JSON.`,{cause:e})}return C(t)}function C(e){if(!j(e))throw A(`A custom must be an object.`);if(e.version!==2)throw A(`A custom version must be 2.`);let t=D(e,`id`,`A custom`);if(!g(t))throw A(`Custom id "${t}" must use lowercase letters, digits, and hyphens.`);let n=D(e,`title`,`A custom`),r=O(e,`description`,`A custom`),i=e.steps;if(!Array.isArray(i))throw A(`A custom must have a "steps" array.`);return{version:2,id:t,title:n,steps:i.map((e,t)=>se(e,t)),...r===void 0?{}:{description:r}}}function se(e,t){let n=`Step ${t+1}`;if(!j(e))throw A(`${n} must be an object.`);let r=D(e,`id`,n),i=D(e,`label`,n),a=k(e,`hidden`,n),o={id:r,label:i,...a===void 0?{}:{hidden:a}};switch(e.kind){case`subcalc`:return{kind:`subcalc`,...o,calculatorRef:D(e,`calculatorRef`,n),config:T(e.config,n),values:E(e.values,n),variables:ce(e.variables,n)};case`variable`:{let t=D(e,`unit`,n);if(!re(t))throw A(`${n} has an unknown unit "${t}".`);let r=de(e,`default`,n);return{kind:`variable`,...o,unit:t,...r===void 0?{}:{default:r},variable:w(e.variable,`${n} value`)}}case`text`:{let t=O(e,`default`,n);return{kind:`text`,...o,...t===void 0?{}:{default:t},variable:w(e.variable,`${n} value`)}}default:throw A(`${n} has an unknown kind.`)}}function w(e,t){if(e===void 0)return{};if(!j(e))throw A(`${t} wiring must be an object.`);let n=O(e,`takeFrom`,t),r=k(e,`hidden`,t);return{...n===void 0?{}:{takeFrom:n},...r===void 0?{}:{hidden:r}}}function T(e,t){if(e===void 0)return{};if(!j(e))throw A(`${t} settings must be an object.`);let n={};for(let[r,i]of Object.entries(e))n[r]=le(i,`${t} setting "${r}"`);return n}function E(e,t){if(e===void 0)return{};if(!j(e))throw A(`${t} values must be an object.`);let n={};for(let[r,i]of Object.entries(e))n[r]=ue(i,`${t} value "${r}"`);return n}function ce(e,t){if(e===void 0)return{};if(!j(e))throw A(`${t} variables must be an object.`);let n={};for(let[r,i]of Object.entries(e))n[r]=w(i,`${t} variable "${r}"`);return n}function le(e,t){if(typeof e==`number`){if(!Number.isFinite(e))throw A(`${t} must be a finite number.`);return e}if(typeof e==`string`||typeof e==`boolean`)return e;throw A(`${t} must be a number, text, or true/false.`)}function ue(e,t){if(e===null)return null;if(typeof e==`number`){if(!Number.isFinite(e))throw A(`${t} must be a finite number.`);return e}if(typeof e==`string`){if(e.length>2e3)throw A(`${t} is too long.`);return e}throw A(`${t} must be a number, text, or null.`)}function D(e,t,n){let r=e[t];if(typeof r!=`string`)throw A(`${n} must have a "${t}" string.`);return r}function O(e,t,n){let r=e[t];if(r!==void 0){if(typeof r!=`string`)throw A(`${n} "${t}" must be a string.`);if(r.length>2e3)throw A(`${n} "${t}" is too long.`);return r}}function k(e,t,n){let r=e[t];if(r!==void 0){if(typeof r!=`boolean`)throw A(`${n} "${t}" must be true or false.`);return r}}function de(e,t,n){let r=e[t];if(r!==void 0){if(typeof r!=`number`||!Number.isFinite(r))throw A(`${n} "${t}" must be a finite number.`);return r}}function A(e){return new c(e)}function j(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}var M=`calcurio.customs.v2`,fe=class{storage;constructor(e){this.storage=e}list(){return this.readIndex().customs}get(e){return this.list().find(t=>t.id===e)}has(e){return this.get(e)!==void 0}save(e){let t=N(C(e)),n=this.readIndex(),i=n.customs.findIndex(e=>e.id===t.id);if(i===-1&&n.customs.length>=200)throw new r(`You already have 200 customs. Delete one before saving another.`);let a=[...n.customs];return i===-1?a.push(t):a[i]=t,this.writeIndex({version:2,customs:a}),t}delete(e){let t=this.readIndex();if(!t.customs.some(t=>t.id===e))throw new r(`That custom no longer exists.`);let n=t.customs.filter(t=>t.id!==e);this.writeIndex({version:2,customs:n})}importCustom(e){let t=N(C(e)),n=this.readIndex();if(n.customs.length>=200)throw new r(`You already have 200 customs. Delete one before importing.`);let i=new Set(n.customs.map(e=>e.id)),a={...t,id:me(t.id,i)};return this.writeIndex({version:2,customs:[...n.customs,a]}),a}importJson(e){return this.importCustom(oe(e))}readIndex(){let e;try{e=this.storage.getItem(M)}catch(e){throw new r(`Could not read customs: ${i(e)}`,{cause:e})}if(e===null||e===``)return{version:2,customs:[]};let t;try{t=JSON.parse(e)}catch(e){throw new r(`Custom data is not valid JSON and was not changed.`,{cause:e})}return pe(t)}writeIndex(e){try{this.storage.setItem(M,JSON.stringify(e))}catch(e){throw new r(`Could not save customs: ${i(e)}`,{cause:e})}}};function pe(e){if(!he(e))throw new r(`Custom data must be an object.`);if(e.version!==2)throw new r(`Custom data has an unsupported version and was not changed.`);let t=e.customs;if(!Array.isArray(t))throw new r(`Custom data must contain a "customs" array.`);return{version:2,customs:t.map((e,t)=>{try{return C(e)}catch(e){throw new r(`Saved custom ${t+1} is invalid: ${i(e)}`,{cause:e})}})}}function N(e){let t=e.title.trim(),n=(t===``?`Untitled`:t).slice(0,80);return n===e.title?e:{...e,title:n}}function me(e,t){if(!t.has(e))return e;for(let n=2;n<=t.size+1;n+=1){let r=`${e}-${n}`;if(!t.has(r))return r}throw new r(`Could not find a free id for "${e}".`)}function he(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}function P(e){return e.kind===`variable`?{name:_,label:e.label,unit:e.unit,...e.default===void 0?{}:{default:e.default}}:{name:_,label:e.label,...e.default===void 0?{}:{default:e.default}}}function F(e,t){let n={};for(let r of e)n[r.name]=t[r.name]??r.default;return n}function I(e){return F(e,{})}function L(e,t){if(e.kind===`subcalc`){let n=t.get(e.calculatorRef);return n===void 0?[]:n.variables(F(n.config,e.config))}return[P(e)]}function R(e,t){return L(e,t).map(t=>({name:t.name,definition:t,wiring:e.kind===`subcalc`?e.variables[t.name]??{}:e.variable}))}function z(e,t){let n=[];for(let r of e.steps)for(let e of R(r,t))n.push({path:v(r.id,e.name),stepId:r.id,stepLabel:r.label,variable:e.name,variableLabel:e.definition.label,definition:e.definition});return n}function ge(e,t){let n=new Set(z(e,t).map(e=>e.path)),r=e.steps.map(e=>_e(e,t,n));return{...e,steps:r}}function _e(e,t,n){if(e.kind!==`subcalc`)return{...e,variable:B(e.variable,n)??{}};if(t.get(e.calculatorRef)===void 0)return e;let r=new Set(L(e,t).map(e=>e.name)),i={};for(let t of r){let r=e.variables[t];if(r===void 0)continue;let a=B(r,n);a!==void 0&&(i[t]=a)}return{...e,values:ve(e.values,r),variables:i}}function B(e,t){let n=e.takeFrom!==void 0&&t.has(e.takeFrom)?e.takeFrom:void 0,r={...n===void 0?{}:{takeFrom:n},...e.hidden===void 0?{}:{hidden:e.hidden}};return Object.keys(r).length===0?void 0:r}function ve(e,t){let n={};for(let[r,i]of Object.entries(e))t.has(r)&&(n[r]=i);return n}var ye=/^[a-z][a-z0-9]*$/;function V(e,t){let n=[],r=new Set;e.version!==2&&n.push(`version must be 2.`),g(e.id)||n.push(`id "${e.id}" must use lowercase letters, digits, and single hyphens.`),e.title.trim()===``&&n.push(`title must not be empty.`),e.steps.length===0?n.push(`at least one step is required.`):e.steps.some(e=>e.kind===`subcalc`)||n.push(`at least one subcalculator step is required.`);for(let[i,a]of e.steps.entries()){let e=`step ${i+1} ("${a.id}")`;ye.test(a.id)?r.has(a.id)&&n.push(`${e}: duplicate step id.`):n.push(`${e}: id must start with a lowercase letter and contain only lowercase letters and digits.`),r.add(a.id),a.label.trim()===``&&n.push(`${e}: label must not be empty.`),n.push(...xe(e,a,t))}return n.push(...De(e,t)),n}function be(e,t){let n=V(e,t);if(n.length>0)throw new c(`Invalid custom "${e.id}":\n- ${n.join(`
- `)}`)}function xe(e,t,n){switch(t.kind){case`subcalc`:return Se(e,t,n);case`variable`:return Ce(e,t);case`text`:return we(e,t)}}function Se(e,t,n){let r=[],i=n.get(t.calculatorRef);if(i===void 0)return r.push(`${e}: unknown subcalculator "${t.calculatorRef}".`),r;n.accepts(i.definition)||r.push(`${e}: "${t.calculatorRef}" cannot be embedded because it runs an asynchronous simulation.`);let a=new Map(i.config.map(e=>[e.name,e]));for(let[n,i]of Object.entries(t.config)){let t=a.get(n);t===void 0?r.push(`${e}: unknown setting "${n}".`):r.push(...Te(`${e} setting "${n}"`,t,i))}let o=L(t,n),s=new Set(o.map(e=>e.name));for(let n of Object.keys(t.values))s.has(n)||r.push(`${e}: unknown value "${n}".`);for(let i of o){if(!Object.hasOwn(t.values,i.name))continue;let a=t.values[i.name]??null;r.push(...Ee(`${e} value "${i.name}"`,i,a,n))}for(let n of Object.keys(t.variables))s.has(n)||r.push(`${e}: unknown variable "${n}".`);return r}function Ce(e,t){let r=[];return n(t.unit)===null&&r.push(`${e}: unknown unit "${t.unit}".`),t.default===void 0||typeof t.default==`number`&&Number.isFinite(t.default)||r.push(`${e}: default must be a finite number.`),r}function we(e,t){let n=[];return t.default!==void 0&&typeof t.default!=`string`&&n.push(`${e}: default must be a string.`),n}function Te(e,t,n){switch(t.kind){case`number`:return typeof n!=`number`||!Number.isFinite(n)?[`${e}: must be a finite number.`]:t.min!==void 0&&n<t.min?[`${e}: must be at least ${t.min}.`]:t.max!==void 0&&n>t.max?[`${e}: must be at most ${t.max}.`]:[];case`boolean`:return typeof n==`boolean`?[]:[`${e}: must be true or false.`];case`string`:return typeof n==`string`?[]:[`${e}: must be text.`];case`select`:return typeof n==`string`&&(t.options??[]).includes(n)?[]:[`${e}: must be one of the listed options.`]}}function Ee(e,t,n,r){if(n===null)return[];if(a(t)){if(typeof n!=`string`)return[`${e}: must be a row key or null.`];let i=r.getTable(t.table);return i===void 0?[`${e}: table "${t.table}" is not available.`]:h(i,n)===void 0?[`${e}: row "${n}" is not in table "${t.table}".`]:[]}return o(t)?typeof n==`string`?[]:[`${e}: must be text or null.`]:typeof n!=`number`||!Number.isFinite(n)?[`${e}: must be a finite number or null.`]:[]}function De(e,t){let n=[],r=new Map;for(let n of z(e,t))r.set(n.path,n);for(let i of e.steps)for(let e of R(i,t)){let t=e.wiring.takeFrom;if(t===void 0)continue;let a=v(i.id,e.name);n.push(...Oe(`wire into "${a}"`,t,a,e.definition,r))}return n}function Oe(e,t,n,r,i){if(t===``)return[`${e}: take from must not be empty.`];if(t===n)return[`${e}: a field cannot take its value from itself.`];if(y(t)===null)return[`${e}: "${t}" is not a "step.variable" path.`];let a=i.get(t);return a===void 0?[`${e}: "${t}" does not name a field of this custom.`]:ke(e,t,a.definition,r)}function ke(e,t,n,r){if(H(n,r))return[];let i=U(n),a=U(r);return i===a?i===`tableSelect`?[`${e}: "${t}" selects from table "${n.table}" but the field selects from "${r.table}".`]:[`${e}: "${t}" measures a different kind than the field.`]:[`${e}: "${t}" is ${i} but the field is ${a}.`]}function H(e,n){let r=U(e);if(r!==U(n))return!1;if(r===`tableSelect`)return e.table===n.table;if(r===`number`){let r=e.unit,i=n.unit;return t(r)||t(i)?!0:l(r)===l(i)}return!0}function U(e){return a(e)?`tableSelect`:o(e)?`text`:`number`}function Ae(e,t){return be(e,t),{id:e.id,title:e.title,...e.description===void 0?{}:{description:e.description},variables:je(e,t)}}function je(e,t){let n=[];for(let r of e.steps)r.kind===`subcalc`?n.push(...Me(r,t)):n.push(Ne(r));let r=new Set(n.map(e=>e.base.name));return n.map(e=>Le(e,r))}function Me(e,t){let n=L(e,t),r=n.map(e=>e.name);return n.map(t=>({step:e,wiring:e.variables[t.name]??{},base:Fe(e,t,r)}))}function Ne(e){if(e.kind===`subcalc`)throw Error(`A subcalculator step is not a standalone variable.`);return{step:e,wiring:e.variable,base:Pe(e)}}function Pe(e){let t=x(e.id,_);return e.kind===`variable`?{name:t,label:e.label,unit:e.unit,...e.default===void 0?{}:{default:e.default}}:{name:t,label:e.label,...e.default===void 0?{}:{default:e.default}}}function Fe(e,t,n){let r=x(e.id,t.name),i=`${e.label}: ${t.label}`,s=e.values[t.name]??null;if(a(t))return{name:r,label:i,table:t.table,...s===void 0||typeof s!=`string`?{}:{default:s},...W(t)};if(o(t)){let a=t.computable,o=a===void 0&&typeof s==`string`?{default:s}:{},c=a===void 0?{}:{computable:t=>a(G(t,e.id,n))};return{name:r,label:i,...W(t),...o,...c}}let c=t.computable,l=c===void 0&&t.tableSelect===void 0&&typeof s==`number`&&Number.isFinite(s)?{default:s}:{},u=c===void 0?{}:{computable:t=>c(G(t,e.id,n))},d=t.tableSelect===void 0?{}:{tableSelect:x(e.id,t.tableSelect),...t.tableField===void 0?{}:{tableField:t.tableField}},f=t.equivalent===void 0?{}:{equivalent:Ie(e.id,t.equivalent)};return{name:r,label:i,unit:t.unit,...t.defaultDisplayUnit===void 0?{}:{defaultDisplayUnit:t.defaultDisplayUnit},...t.unitOptions===void 0?{}:{unitOptions:t.unitOptions},...W(t),...l,...u,...d,...f}}function W(e){return{...e.editable===void 0?{}:{editable:e.editable},...e.description===void 0?{}:{description:e.description}}}function G(e,t,n){let r={};for(let i of n)r[i]=e[x(t,i)]??null;return r}function Ie(e,t){let n={};for(let[r,i]of Object.entries(t))n[x(e,r)]=i;return n}function Le(e,t){let n=Re(e.wiring.takeFrom,t),r=e.step.hidden===!0||e.wiring.hidden===!0;return{...e.base,...n===void 0?{}:{takeFrom:n},...r?{hidden:!0}:{}}}function Re(e,t){if(e===void 0)return;let n=y(e);if(n===null)return;let r=x(n.stepId,n.variable);return t.has(r)?r:void 0}var ze=class{catalog;store;handle;compiled=new Map;problems=new Map;readError=null;constructor(e,t,n){this.handle=e,this.store=t,this.catalog=n}get error(){return this.readError}entries(){return this.readCustoms().map(e=>({custom:e,problem:this.problems.get(e.id)??null}))}get(e){return this.readCustoms().find(t=>t.id===e)}async create(e){let t=this.requireStore().importCustom(e);return await this.refresh(),t}async save(e){let t=this.requireStore().save(e);return await this.refresh(),t}async remove(e){this.requireStore().delete(e),await this.refresh()}async importJson(e){let t=this.requireStore().importJson(e);return await this.refresh(),t}async refresh(){if(this.problems=new Map,this.store===null){this.readError=null;return}let e;try{e=this.store.list(),this.readError=null}catch(e){this.readError=i(e);return}await this.loadReferencedCategories(e);let t=new Set;for(let n of e){t.add(n.id);let e=S(n),r=this.compiled.get(n.id);(r===void 0||r.json!==e)&&this.register(n,e)}for(let e of[...this.compiled.keys()])t.has(e)||(this.compiled.delete(e),this.handle.remove(e))}async loadReferencedCategories(e){let t=new Set;for(let n of e)for(let e of n.steps){if(e.kind!==`subcalc`)continue;let n=b(e.calculatorRef);n!==null&&t.add(n.categoryId)}await Promise.all([...t].map(e=>this.loadCategory(e)))}async loadCategory(e){try{await this.catalog.load(e)}catch{}}register(e,t){try{let n=Ae(e,this.catalog);this.handle.upsert(n),this.compiled.set(e.id,{json:t,definition:n})}catch(t){this.compiled.delete(e.id),this.handle.remove(e.id),this.problems.set(e.id,i(t))}}readCustoms(){if(this.store===null)return[];try{return this.store.list()}catch(e){return this.readError=i(e),[]}}requireStore(){if(this.store===null)throw new r(`Customs cannot be saved in this browser.`);return this.store}},Be=0,Ve=class extends u{static properties={catalog:{attribute:!1},custom:{attribute:!1},stepIndex:{attribute:!1},onApply:{attribute:!1}};working=null;titleId=`calc-custom-step-title-${Be++}`;createRenderRoot(){return this}open(e,t){this.custom=e,this.stepIndex=t;let n=e.steps[t];this.working=n===void 0?null:Y(n),this.requestUpdate(),this.updateComplete.then(()=>this.showDialog())}close(){let e=this.dialogElement;e!==null&&(e.open&&typeof e.close==`function`?e.close():e.removeAttribute(`open`))}render(){let e=this.working;return e===null?p:m`
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
    `}renderBody(e){switch(e.kind){case`subcalc`:return this.renderSubcalc(e);case`variable`:return this.renderVariable(e);case`text`:return this.renderText(e)}}renderSubcalc(e){let t=this.catalog?.get(e.calculatorRef);if(t===void 0)return m`
        <p class="alert danger">
          The subcalculator "${e.calculatorRef}" is not available.
        </p>
      `;let n=K(t,e);return m`
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
    `}renderSubcalcField(e,t){let n=t.name,r=e.variables[n]??{},i=r.takeFrom!==void 0,a=v(e.id,n),o=this.optionsFor(t,a);return m`
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
    `}renderValue(e,t,n){if(!He(e))return m`<p class="help calc-field-help">
        Computed by the subcalculator.
      </p>`;if(a(e)){let r=this.catalog?.getTable(e.table);return m`
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
            ${(r?.rows??[]).map(e=>{let n=d(r,e)??``;return m`
                <option value=${n} ?selected=${n===t}>
                  ${te(r,e)}
                </option>
              `})}
          </select>
        </div>
      `}return o(e)?m`
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
    `}renderVariable(e){let t=P(e),n=e.variable.takeFrom!==void 0,r=this.optionsFor(t,v(e.id,_));return m`
      <label class="calc-custom-text">
        <span class="calc-field-label">Unit</span>
        <select
          class="form-control"
          data-testid="step-unit"
          @change=${this.handleUnit}
        >
          ${[...s()].map(([t,n])=>m`
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
    `}renderText(e){let t=P(e),n=e.variable.takeFrom!==void 0,r=this.optionsFor(t,v(e.id,_));return m`
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
    `}optionsFor(e,t){return this.allOptions().filter(n=>n.path!==t&&H(n.definition,e))}allOptions(){let e=this.custom,t=this.catalog,n=this.working;if(e===void 0||t===void 0||n===null)return[];let r=e.steps.map((e,t)=>t===this.stepIndex?n:e);return z({...e,steps:r},t)}labelForPath(e){if(e===void 0)return null;let t=this.allOptions().find(t=>t.path===e);return t===void 0?null:`${t.stepLabel}: ${t.variableLabel}`}sourceLabel(e,t){return this.labelForPath(e.variables[t]?.takeFrom)}applyConfig(e,t){let n=this.working,r=this.catalog?.get(n?.kind===`subcalc`?n.calculatorRef:``);if(n===null||n.kind!==`subcalc`||r===void 0)return;let i={...n.config,[e]:t},a=new Set(K(r,{...n,config:i}).map(e=>e.name));this.working={...n,config:i,values:q(n.values,a),variables:q(n.variables,a)},this.requestUpdate()}setWiring(e,t){let n=this.working;if(n===null||n.kind!==`subcalc`)return;let r=n.variables[e]??{};this.working={...n,variables:{...n.variables,[e]:t(r)}},this.requestUpdate()}setStandaloneWiring(e){let t=this.working;t!==null&&t.kind!==`subcalc`&&(this.working={...t,variable:e(t.variable)},this.requestUpdate())}handleLabel=e=>{let t=e.target,n=this.working;n!==null&&t instanceof HTMLInputElement&&(this.working={...n,label:t.value})};handleTakeFrom=(e,t)=>{let n=e.target;if(!(n instanceof HTMLSelectElement))return;let r=n.value.trim();t(e=>We(e,r===``?void 0:r))};handleHidden=(e,t)=>{let n=e.target;if(!(n instanceof HTMLInputElement))return;let r=n.checked;t(e=>({...e,hidden:r}))};handleValue=(e,t)=>{let n=this.working,r=e.target;if(n===null||n.kind!==`subcalc`||!(r instanceof HTMLInputElement)&&!(r instanceof HTMLSelectElement))return;let i=K(this.catalog?.requireEntry(n.calculatorRef),n).find(e=>e.name===t);if(i===void 0)return;let a=Ue(i,r.value);this.working={...n,values:{...n.values,[t]:a}}};handleUnit=e=>{let t=e.target,n=this.working;n!==null&&n.kind===`variable`&&t instanceof HTMLSelectElement&&(this.working={...n,unit:t.value})};handleDefault=e=>{let t=e.target,n=this.working;if(n===null||n.kind!==`variable`||!(t instanceof HTMLInputElement))return;let r=Number(t.value);this.working=Number.isFinite(r)?{...n,default:r}:J(n)};handleText=e=>{let t=e.target,n=this.working;if(n===null||n.kind!==`text`||!(t instanceof HTMLInputElement))return;let r=t.value.trim();this.working=r===``?J(n):{...n,default:r}};handleApply=()=>{let e=this.working;e!==null&&this.onApply?.(e),this.close()};get dialogElement(){return this.querySelector(`dialog.calc-dialog`)}showDialog(){let e=this.dialogElement;e===null||e.open||(typeof e.showModal==`function`?e.showModal():e.setAttribute(`open`,``))}};function He(t){return!e(t)||t.computable===void 0&&!ee(t)}function K(e,t){return e.variables(F(e.config,t.config))}function q(e,t){let n={};for(let[r,i]of Object.entries(e))t.has(r)&&(n[r]=i);return n}function Ue(e,t){if(a(e)||o(e)){let e=t.trim();return e===``?null:e}let n=t.trim();if(n===``)return null;let r=Number(n);return Number.isFinite(r)?r:null}function We(e,t){return t===void 0?Ge(e,`takeFrom`):{...e,takeFrom:t}}function Ge(e,t){let{[t]:n,...r}=e;return r}function J(e){let{default:t,...n}=e;return n}function Y(e){return e.kind===`subcalc`?{kind:`subcalc`,id:e.id,label:e.label,...e.hidden===void 0?{}:{hidden:e.hidden},calculatorRef:e.calculatorRef,config:{...e.config},values:{...e.values},variables:Ke(e.variables)}:e.kind===`variable`?{kind:`variable`,id:e.id,label:e.label,...e.hidden===void 0?{}:{hidden:e.hidden},unit:e.unit,...e.default===void 0?{}:{default:e.default},variable:X(e.variable)}:{kind:`text`,id:e.id,label:e.label,...e.hidden===void 0?{}:{hidden:e.hidden},...e.default===void 0?{}:{default:e.default},variable:X(e.variable)}}function Ke(e){let t={};for(let[n,r]of Object.entries(e))t[n]=X(r);return t}function X(e){return{...e.takeFrom===void 0?{}:{takeFrom:e.takeFrom},...e.hidden===void 0?{}:{hidden:e.hidden}}}customElements.define(`calc-custom-step-dialog`,Ve);var qe=0,Je=class extends u{static properties={catalog:{attribute:!1},onChosen:{attribute:!1}};stage=`categories`;categoryId=null;loading=!1;loadError=``;filter=``;titleId=`calc-calculator-browser-title-${qe++}`;createRenderRoot(){return this}open(){this.reset(),this.requestUpdate(),this.updateComplete.then(()=>this.showDialog())}close(){let e=this.dialogElement;e!==null&&(e.open&&typeof e.close==`function`?e.close():e.removeAttribute(`open`))}render(){return m`
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
          ${this.stage===`categories`?this.renderCategories():this.renderCalculators()}
        </div>
      </dialog>
    `}renderCategories(){let e=this.visibleCategories();return m`
      <p class="help">Choose a category.</p>
      ${this.renderFilter()}
      <div class="calc-tiles calc-custom-browser">
        ${e.map(e=>this.renderCategory(e))}
      </div>
      ${e.length===0?m`<p class="help">No categories match this filter.</p>`:p}
    `}renderCalculators(){let e=this.catalog?.categories().find(e=>e.id===this.categoryId);return m`
      <div class="calc-actions">
        <button
          class="button"
          type="button"
          data-testid="browser-back"
          @click=${this.backToCategories}
        >
          ← Categories
        </button>
        ${e===void 0?p:m`<strong>${e.title}</strong>`}
      </div>
      ${this.renderFilter()} ${this.renderCalculatorBody()}
    `}renderCalculatorBody(){if(this.loading)return m`<p class="help" data-testid="browser-loading">Loading…</p>`;if(this.loadError!==``)return m`<p class="alert danger" role="alert">${this.loadError}</p>`;let e=this.visibleEntries();return m`
      <div class="calc-tiles calc-custom-browser">
        ${e.map(e=>this.renderEntry(e))}
      </div>
      ${e.length===0?m`<p class="help">Nothing here can be added to a custom.</p>`:p}
    `}renderFilter(){return m`
      <label class="calc-custom-filter">
        <span class="calc-field-label">Filter</span>
        <input
          class="form-control"
          type="search"
          autocomplete="off"
          placeholder="Filter by name"
          data-testid="browser-filter"
          .value=${this.filter}
          @input=${this.handleFilter}
        />
      </label>
    `}renderCategory(e){let t=e.description;return m`
      <button
        class="card calc-tile"
        type="button"
        data-testid=${`choose-category-${e.id}`}
        @click=${()=>this.chooseCategory(e.id)}
      >
        <strong>${e.title}</strong>
        ${t===``?p:m`<span class="help">${t}</span>`}
      </button>
    `}renderEntry(e){let t=e.definition.description??``;return m`
      <button
        class="card calc-tile"
        type="button"
        data-testid=${`choose-${e.definition.id}`}
        @click=${()=>this.choose(e.ref)}
      >
        <strong>${e.definition.title}</strong>
        ${t===``?p:m`<span class="help">${t}</span>`}
      </button>
    `}visibleCategories(){let e=this.catalog?.categories()??[],t=this.filter.trim().toLowerCase();return t===``?e:e.filter(e=>e.title.toLowerCase().includes(t)||e.id.toLowerCase().includes(t))}visibleEntries(){let e=this.categoryId,t=e===null?[]:this.catalog?.entries(e)??[],n=this.filter.trim().toLowerCase();return n===``?t:t.filter(e=>e.definition.title.toLowerCase().includes(n)||e.definition.id.toLowerCase().includes(n))}chooseCategory(e){this.categoryId=e,this.stage=`calculators`,this.filter=``,this.loadError=``,this.loading=!(this.catalog?.isLoaded(e)??!1),this.requestUpdate(),this.loadCategory(e)}async loadCategory(e){let t=this.catalog;if(t===void 0)this.loading=!1,this.requestUpdate();else try{await t.load(e)}catch(e){this.loadError=i(e)}finally{this.loading=!1,this.requestUpdate()}}backToCategories=()=>{this.stage=`categories`,this.categoryId=null,this.loadError=``,this.loading=!1,this.filter=``,this.requestUpdate()};handleFilter=e=>{let t=e.target;t instanceof HTMLInputElement&&(this.filter=t.value,this.requestUpdate())};choose(e){this.onChosen?.(e),this.close()}handleClose=()=>{this.reset(),this.requestUpdate()};reset(){this.stage=`categories`,this.categoryId=null,this.loading=!1,this.loadError=``,this.filter=``}get dialogElement(){return this.querySelector(`dialog.calc-dialog`)}showDialog(){let e=this.dialogElement;e===null||e.open||(typeof e.showModal==`function`?e.showModal():e.setAttribute(`open`,``))}};customElements.define(`calc-calculator-browser`,Je);var Ye=80,Xe=0,Z=class extends u{static properties={catalog:{attribute:!1},library:{attribute:!1},onSaved:{attribute:!1},onDeleted:{attribute:!1}};working=null;isNew=!0;stepIndex=-1;error=``;confirmingDelete=!1;titleId=`calc-custom-editor-title-${Xe++}`;createRenderRoot(){return this}open(e){this.isNew=e===null,this.working=e===null?{version:2,id:`custom`,title:``,steps:[]}:Q(e),this.stepIndex=-1,this.error=``,this.confirmingDelete=!1,this.requestUpdate(),this.updateComplete.then(()=>this.showDialog())}close(){let e=this.dialogElement;e!==null&&(e.open&&typeof e.close==`function`?e.close():e.removeAttribute(`open`))}render(){let e=this.working;if(e===null)return p;let t=this.problems();return m`
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
              maxlength=${Ye}
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
              @click=${()=>void this.handleSave()}
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
          <span class="help">${Ze(e,this.catalog)}</span>
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
        @click=${()=>void this.handleDelete()}
      >
        ${this.confirmingDelete?`Confirm delete`:`Delete`}
      </button>
    `}problems(){let e=this.catalog,t=this.working;return e===void 0||t===null?[]:V(t,e)}applyStep=e=>{let t=this.working;if(t===null||this.stepIndex<0)return;let n=[...t.steps];n[this.stepIndex]=e,this.working={...t,steps:n},this.prune(),this.requestUpdate()};editStep(e){let t=this.working;t!==null&&(this.stepIndex=e,this.stepDialog?.open(t,e))}addSubcalc=e=>{let t=this.catalog?.get(e),n=this.working;if(t===void 0||n===null)return;let r={kind:`subcalc`,id:this.freeStepId(t.definition.id),label:t.definition.title,calculatorRef:e,config:I(t.config),values:{},variables:{}};this.appendStep(r)};addValue=()=>{let e={kind:`variable`,id:this.freeStepId(`value`),label:`Value`,unit:`1`,variable:{}};this.appendStep(e)};addText=()=>{let e={kind:`text`,id:this.freeStepId(`text`),label:`Text`,variable:{}};this.appendStep(e)};appendStep(e){let t=this.working;if(t===null)return;let n=[...t.steps,e];this.working={...t,steps:n},this.requestUpdate();let r=n.length-1;this.updateComplete.then(()=>this.editStep(r))}moveStep(e,t){let n=this.working;if(n===null)return;let r=e+t;if(r<0||r>=n.steps.length)return;let i=[...n.steps],a=i[e],o=i[r];a!==void 0&&o!==void 0&&(i[e]=o,i[r]=a,this.working={...n,steps:i},this.prune(),this.requestUpdate())}removeStep(e){let t=this.working;if(t===null)return;let n=t.steps.filter((t,n)=>n!==e);this.working={...t,steps:n},this.prune(),this.requestUpdate()}handleStepHidden=(e,t)=>{let n=e.target,r=this.working;if(r===null||!(n instanceof HTMLInputElement))return;let i=r.steps[t];if(i===void 0)return;let a=[...r.steps];a[t]=et(i,n.checked),this.working={...r,steps:a},this.requestUpdate()};handleTitle=e=>{let t=e.target,n=this.working;if(n===null||!(t instanceof HTMLInputElement))return;let r=t.value,i={...n,title:r};this.working=this.isNew?{...i,id:$e(r,this.takenIds())}:i,this.requestUpdate()};handleDescription=e=>{let t=e.target,n=this.working;if(n===null||!(t instanceof HTMLInputElement))return;let r=t.value.trim(),{description:i,...a}=n;this.working=r===``?a:{...a,description:r},this.requestUpdate()};handleSave=async()=>{let e=this.library,t=this.working;if(e===void 0||t===null)return;let n=tt(t);try{let t=this.isNew?await e.create(n):await e.save(n);this.working=Q(t),this.isNew=!1,this.onSaved?.(t),this.close()}catch(e){this.error=i(e),this.requestUpdate()}};handleDelete=async()=>{let e=this.library,t=this.working;if(e!==void 0&&t!==null){if(!this.confirmingDelete)this.confirmingDelete=!0,this.requestUpdate();else try{await e.remove(t.id),this.onDeleted?.(t.id),this.close()}catch(e){this.error=i(e),this.requestUpdate()}}};openBrowser=()=>{this.browserDialog?.open()};prune(){let e=this.catalog;e!==void 0&&this.working!==null&&(this.working=ge(this.working,e))}freeStepId(e){return Qe(e,new Set((this.working?.steps??[]).map(e=>e.id)))}takenIds(){let e=this.library?.entries()??[];return new Set(e.map(e=>e.custom.id))}get dialogElement(){return this.querySelector(`dialog.calc-dialog`)}get stepDialog(){return this.querySelector(`calc-custom-step-dialog`)}get browserDialog(){return this.querySelector(`calc-calculator-browser`)}showDialog(){let e=this.dialogElement;e===null||e.open||(typeof e.showModal==`function`?e.showModal():e.setAttribute(`open`,``))}};function Ze(e,t){switch(e.kind){case`subcalc`:return t?.get(e.calculatorRef)?.definition.title??e.calculatorRef;case`variable`:return`Number (${e.unit})`;case`text`:return`Text output`}}function Qe(e,t){let n=e.toLowerCase().replace(/[^a-z0-9]/g,``)||`step`;if(!t.has(n))return n;for(let e=2;e<=t.size+2;e+=1){let r=`${n}${e}`;if(!t.has(r))return r}return`${n}${t.size+2}`}function $e(e,t){let n=e.toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``).slice(0,48),r=n===``?`custom`:n;if(!t.has(r))return r;for(let e=2;e<=t.size+2;e+=1){let n=`${r}-${e}`;if(!t.has(n))return n}return`${r}-${t.size+2}`}function et(e,t){if(t)return{...e,hidden:!0};let{hidden:n,...r}=e;return r}function tt(e){let t=e.title.trim();return t===e.title?e:{...e,title:t}}function Q(e){return{version:e.version,id:e.id,title:e.title,...e.description===void 0?{}:{description:e.description},steps:e.steps.map(e=>Y(e))}}customElements.define(`calc-custom-editor`,Z);var nt=0,rt=class extends u{static properties={library:{attribute:!1},onImported:{attribute:!1}};text=``;error=``;titleId=`calc-custom-import-title-${nt++}`;createRenderRoot(){return this}open(){this.text=``,this.error=``,this.requestUpdate(),this.updateComplete.then(()=>this.showDialog())}close(){let e=this.dialogElement;e!==null&&(e.open&&typeof e.close==`function`?e.close():e.removeAttribute(`open`))}render(){return m`
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
            placeholder='{ "version": 2, "id": "...", "title": "...", ... }'
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
              @click=${()=>void this.handleImport()}
            >
              Import
            </button>
          </div>
        </div>
      </dialog>
    `}handleText=e=>{let t=e.target;t instanceof HTMLTextAreaElement&&(this.text=t.value,this.error=``,this.requestUpdate())};handleFile=e=>{let t=e.target;if(!(t instanceof HTMLInputElement))return;let n=t.files?.[0];n!==void 0&&n.text().then(e=>{this.text=e.trim(),this.error=``,this.requestUpdate()},e=>{this.error=`Could not read that file: ${i(e)}`,this.requestUpdate()})};handleImport=async()=>{let e=this.library;if(e!==void 0)try{let t=await e.importJson(this.text.trim());this.onImported?.(t),this.close()}catch(e){this.error=i(e),this.requestUpdate()}};handleClose=()=>{this.error=``,this.requestUpdate()};get dialogElement(){return this.querySelector(`dialog.calc-dialog`)}showDialog(){let e=this.dialogElement;e===null||e.open||(typeof e.showModal==`function`?e.showModal():e.setAttribute(`open`,``))}};customElements.define(`calc-custom-import`,rt);var it=0,at=class extends u{custom=null;text=``;status=``;titleId=`calc-custom-export-title-${it++}`;createRenderRoot(){return this}open(e){this.custom=e,this.text=S(e),this.status=``,this.requestUpdate(),this.updateComplete.then(()=>this.showDialog())}close(){let e=this.dialogElement;e!==null&&(e.open&&typeof e.close==`function`?e.close():e.removeAttribute(`open`))}render(){let e=this.custom;return e===null?p:m`
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
    `}handleCopy=async()=>{let e=navigator.clipboard;if(e!==void 0&&typeof e.writeText==`function`)try{await e.writeText(this.text),this.status=`Copied to the clipboard.`,this.requestUpdate();return}catch{}this.textArea?.select(),this.status=`Press Ctrl+C (or ⌘C) to copy the selected text.`,this.requestUpdate()};handleDownload=()=>{let e=this.custom;if(e===null)return;let t=new Blob([this.text],{type:`application/json`}),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=`${$(e.id)}.json`,r.style.display=`none`,document.body.append(r),r.click(),r.remove(),URL.revokeObjectURL(n),this.status=`Downloaded ${$(e.id)}.json.`,this.requestUpdate()};handleClose=()=>{this.status=``,this.requestUpdate()};get textArea(){return this.querySelector(`textarea`)}get dialogElement(){return this.querySelector(`dialog.calc-dialog`)}showDialog(){let e=this.dialogElement;e===null||e.open||(typeof e.showModal==`function`?e.showModal():e.setAttribute(`open`,``))}};function $(e){let t=e.replace(/[^a-z0-9-]+/gi,`-`).replace(/^-+|-+$/g,``);return(t===``?`custom`:t).slice(0,64)}customElements.define(`calc-custom-export`,at);var ot=class extends u{static properties={app:{attribute:!1},handle:{attribute:!1},store:{attribute:!1},openCalculator:{attribute:!1},onChanged:{attribute:!1}};library=null;catalog=null;prepared=!1;pendingDelete=null;createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),this.ensureLibrary()}render(){this.ensureLibrary();let e=this.library;return e===null||!this.prepared?m`<p class="help" data-testid="custom-preparing">
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
    `}ensureLibrary(){let e=this.app;this.library===null&&this.handle!==void 0&&e!==void 0&&(this.catalog=new ae(e),this.library=new ze(this.handle,this.resolveStore(),this.catalog),this.library.refresh().then(()=>{this.prepared=!0,this.requestUpdate()}))}resolveStore(){if(this.store!==void 0)return this.store;let e=f();return e===null?null:new fe(e)}openEditor=()=>{this.editorDialog?.open(null)};edit(e){let t=this.library?.get(e);t!==void 0&&this.editorDialog?.open(t)}openImport=()=>{this.importDialog?.open()};removeCustom(e){let t=this.library;t!==null&&(this.pendingDelete===e?(this.pendingDelete=null,t.remove(e).then(()=>this.finishChange(),()=>this.finishChange())):(this.pendingDelete=e,this.requestUpdate()))}finishChange(){this.onChanged?.(),this.requestUpdate()}handleSaved=e=>{this.onChanged?.(),this.requestUpdate(),this.openCalculator?.(e.id)};handleDeleted=()=>{this.onChanged?.(),this.requestUpdate()};handleImported=()=>{this.onChanged?.(),this.requestUpdate()};get editorDialog(){return this.querySelector(`calc-custom-editor`)}get importDialog(){return this.querySelector(`calc-custom-import`)}get exportDialog(){return this.querySelector(`calc-custom-export`)}};customElements.define(`calc-custom-hub`,ot);var st=[],ct=[];export{st as calculators,ct as tables};
//# sourceMappingURL=custom-30VDc76W.js.map