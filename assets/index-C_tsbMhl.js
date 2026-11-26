const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./electrical-DlWOApOZ.js","./inductor-types-BYRxLvLN.js","./fluids-C0HjWhF_.js","./materials-B4mDN07_.js","./materials-DjtVTVhz.js","./spice-DmN5KQAc.js"])))=>i.map(i=>d[i]);
(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=class extends Error{constructor(e){super(e),this.name=`CalculatorDefinitionError`}},t=class extends Error{constructor(e){super(e),this.name=`TableDefinitionError`}},n=class extends Error{constructor(e,t){super(e,t),this.name=`CustomDefinitionError`}},r=class extends Error{constructor(e){super(e),this.name=`StateLoadError`}},i=class extends Error{constructor(e,t){super(e,t),this.name=`BookmarkStorageError`}},a=class extends Error{constructor(e,t){super(e,t),this.name=`CustomStorageError`}},o=class extends Error{constructor(e,t){super(e,t),this.name=`TableRowsStorageError`}},s=class extends Error{constructor(e){super(e),this.name=`NumberFormatError`}};function c(e){if(e instanceof Error)return e.message;if(typeof e==`object`&&e){let t=e,n=typeof t.message==`string`?t.message:``,r=typeof t.name==`string`?t.name:``;if(n!==``)return r!==``&&r!==`Error`?`${r}: ${n}`:n;let i=l(e);if(i!==void 0&&i!==`{}`)return i}return String(e)}function l(e){try{return JSON.stringify(e)}catch{return}}function u(e){return`table`in e}function d(e){return e.tableSelect!==void 0}function f(e){let t=e.tableAxis;return t===void 0?[]:typeof t==`string`?[t]:t}function p(e){return!(`table`in e)&&!(`unit`in e)}function m(e){return`unit`in e}var ee=Symbol(`calcurio.unchanged`),h=Object.freeze({[ee]:!0});function g(){return h}function _(e){return typeof e!=`object`||!e?!1:e[ee]===!0}function te(e){return typeof e==`object`&&!!e&&`create`in e&&typeof e.create==`function`&&`add`in e&&typeof e.add==`function`&&`sub`in e&&typeof e.sub==`function`&&`mul`in e&&typeof e.mul==`function`&&`div`in e&&typeof e.div==`function`&&`lt`in e&&typeof e.lt==`function`&&`lte`in e&&typeof e.lte==`function`&&`gt`in e&&typeof e.gt==`function`&&`gte`in e&&typeof e.gte==`function`}var ne=class extends Error{},re={create(e){let t=Number(e);if(Number.isNaN(t))throw new ne(`"${e}" cannot be parsed into a number`);return t},add(e,t){return Number(e)+Number(t)},sub(e,t){return Number(e)-Number(t)},mul(e,t){return Number(e)*Number(t)},div(e,t){return Number(e)/Number(t)},lt(e,t){return Number(e)<Number(t)},lte(e,t){return Number(e)<=Number(t)},gt(e,t){return Number(e)>Number(t)},gte(e,t){return Number(e)>=Number(t)}};function ie(e){return typeof e==`object`&&!!e&&`numerator`in e&&(typeof e.numerator==`number`||typeof e.numerator==`string`)&&`denominator`in e&&(typeof e.denominator==`number`||typeof e.denominator==`string`)}var ae=class extends Error{},oe=class extends Error{},se=class extends Error{},ce=class extends Error{},le=class extends Error{},ue=class{constructor(e,t){this.destination=null,this.origin=null,this.cls=e.cls,this.val=this.cls.create(t||0),this.measureData=e.measures,this.unitCache=e.unitCache}from(e){if(this.destination!=null)throw new oe(`.from must be called before .to`);return this.origin=this.getUnit(e),this.origin??this.throwUnsupportedUnitError(e),this}convertFraction(e){return ie(e)?this.cls.div(e.numerator,e.denominator):this.cls.create(e)}to(e){if(this.origin==null)throw Error(`.to must be called after .from`);this.destination=this.getUnit(e),this.destination??this.throwUnsupportedUnitError(e);let t=this.destination,n=this.origin;if(n.abbr===t.abbr)return this.val;if(t.measure!=n.measure)throw new se(`Cannot convert incompatible measures of ${t.measure} and ${n.measure}`);let r=this.cls.mul(this.val,this.convertFraction(n.unit.to_anchor));if(n.unit.anchor_shift&&(r=this.cls.sub(r,this.convertFraction(n.unit.anchor_shift))),n.system!=t.system){let e=this.measureData[n.measure].anchors;if(e==null)throw new ce(`Unable to convert units. Anchors are missing for "${n.measure}" and "${t.measure}" measures.`);let i=e[n.system];if(i==null)throw new ce(`Unable to find anchor for "${n.measure}" to "${t.measure}". Please make sure it is defined.`);let a=i[t.system]?.transform,o=i[t.system]?.ratio;if(typeof a==`function`)r=a(r,this.cls);else if(typeof o==`number`)r=this.cls.mul(r,o);else if(ie(o))r=this.cls.mul(r,this.convertFraction(o));else throw new ce(`A system anchor needs to either have a defined ratio number or a transform function.`)}return t.unit.anchor_shift&&(r=this.cls.add(r,this.convertFraction(t.unit.anchor_shift))),this.cls.div(r,this.convertFraction(t.unit.to_anchor))}toBest(e){if(this.origin==null)throw new oe(`.toBest must be called after .from`);let t=this.cls.lt(this.val,0),n=[],r=t?-1:1,i=this.origin.system;typeof e==`object`&&(n=e.exclude??[],r=e.cutOffNumber??r,i=e.system??this.origin.system);let a=null;for(let e of this.possibilities()){let o=this.describe(e);if(n.indexOf(e)===-1&&o.system===i){let n=this.to(e);if(t?this.cls.gt(n,r):this.cls.lt(n,r))continue;(a===null||(t?this.cls.lte(n,r)&&this.cls.gt(n,a.val):this.cls.gte(n,r)&&this.cls.lt(n,a.val)))&&(a={val:n,unit:e,singular:o.singular,plural:o.plural})}}return a??{val:this.val,unit:this.origin.abbr,singular:this.origin.unit.name.singular,plural:this.origin.unit.name.plural}}getUnit(e){return this.unitCache.get(e)??null}describe(e){let t=this.getUnit(e);if(t!=null)return this.describeUnit(t);this.throwUnsupportedUnitError(e)}describeUnit(e){return{abbr:e.abbr,measure:e.measure,system:e.system,singular:e.unit.name.singular,plural:e.unit.name.plural}}list(e){let t=[];if(e==null)for(let[e,n]of Object.entries(this.measureData))for(let[r,i]of Object.entries(n.systems))for(let[n,a]of Object.entries(i))t.push(this.describeUnit({abbr:n,measure:e,system:r,unit:a}));else{if(!this.isMeasure(e))throw new le(`Meausure "${e}" not found.`);let n=this.measureData[e];for(let[r,i]of Object.entries(n.systems))for(let[n,a]of Object.entries(i))t.push(this.describeUnit({abbr:n,measure:e,system:r,unit:a}))}return t}isMeasure(e){return e in this.measureData}throwUnsupportedUnitError(e){let t=[];for(let e of Object.values(this.measureData))for(let n of Object.values(e.systems))t=t.concat(Object.keys(n));throw new ae(`Unsupported unit ${e}, use one of: ${t.join(`, `)}`)}possibilities(e){let t=[],n=[];typeof e==`string`&&this.isMeasure(e)?n.push(e):this.origin==null?n=Object.keys(this.measureData):n.push(this.origin.measure);for(let e of n){let n=this.measureData[e].systems;for(let e of Object.values(n))t=[...t,...Object.keys(e)]}return t}measures(){return Object.keys(this.measureData)}};function de(e){let t=new Map;for(let[n,r]of Object.entries(e))for(let[e,i]of Object.entries(r.systems))for(let[r,a]of Object.entries(i))t.set(r,{measure:n,system:e,abbr:r,unit:a});return t}function fe(e,t){if(typeof e!=`object`)throw TypeError(`The measures argument needs to be an object`);let n=de(e);return t!=null&&te(t)?r=>new ue({measures:e,unitCache:n,cls:t},r):t=>new ue({measures:e,unitCache:n,cls:re},t)}var pe={acceleration:{systems:{metric:{"g-force":{name:{singular:`g-force`,plural:`g-forces`},to_anchor:9.80665},"m/s2":{name:{singular:`Metre per second squared`,plural:`Metres per second squared`},to_anchor:1},g0:{name:{singular:`Standard Gravity`,plural:`Standard Gravities`},to_anchor:9.80665}}}},angle:{systems:{SI:{rad:{name:{singular:`radian`,plural:`radians`},to_anchor:{numerator:180,denominator:Math.PI}},deg:{name:{singular:`degree`,plural:`degrees`},to_anchor:1},grad:{name:{singular:`gradian`,plural:`gradians`},to_anchor:{numerator:9,denominator:10}},arcmin:{name:{singular:`arcminute`,plural:`arcminutes`},to_anchor:{numerator:1,denominator:60}},arcsec:{name:{singular:`arcsecond`,plural:`arcseconds`},to_anchor:{numerator:1,denominator:3600}}}}},apparentPower:{systems:{SI:{VA:{name:{singular:`Volt-Ampere`,plural:`Volt-Amperes`},to_anchor:1},mVA:{name:{singular:`Millivolt-Ampere`,plural:`Millivolt-Amperes`},to_anchor:.001},kVA:{name:{singular:`Kilovolt-Ampere`,plural:`Kilovolt-Amperes`},to_anchor:1e3},MVA:{name:{singular:`Megavolt-Ampere`,plural:`Megavolt-Amperes`},to_anchor:1e6},GVA:{name:{singular:`Gigavolt-Ampere`,plural:`Gigavolt-Amperes`},to_anchor:1e9}}}},area:{systems:{metric:{nm2:{name:{singular:`Square Nanometer`,plural:`Square Nanometers`},to_anchor:1e-18},μm2:{name:{singular:`Square Micrometer`,plural:`Square Micrometers`},to_anchor:1e-12},mm2:{name:{singular:`Square Millimeter`,plural:`Square Millimeters`},to_anchor:{numerator:1,denominator:1e6}},cm2:{name:{singular:`Square Centimeter`,plural:`Square Centimeters`},to_anchor:{numerator:1,denominator:1e4}},dm2:{name:{singular:`Square Decimeter`,plural:`Square Decimeters`},to_anchor:{numerator:1,denominator:100}},m2:{name:{singular:`Square Meter`,plural:`Square Meters`},to_anchor:1},a:{name:{singular:`Are`,plural:`Ares`},to_anchor:100},ha:{name:{singular:`Hectare`,plural:`Hectares`},to_anchor:1e4},km2:{name:{singular:`Square Kilometer`,plural:`Square Kilometers`},to_anchor:1e6}},imperial:{in2:{name:{singular:`Square Inch`,plural:`Square Inches`},to_anchor:{numerator:1,denominator:144}},yd2:{name:{singular:`Square Yard`,plural:`Square Yards`},to_anchor:9},ft2:{name:{singular:`Square Foot`,plural:`Square Feet`},to_anchor:1},ac:{name:{singular:`Acre`,plural:`Acres`},to_anchor:43560},mi2:{name:{singular:`Square Mile`,plural:`Square Miles`},to_anchor:27878400}}},anchors:{metric:{imperial:{ratio:10.7639}},imperial:{metric:{ratio:{numerator:1,denominator:10.7639}}}}},charge:{systems:{SI:{c:{name:{singular:`Coulomb`,plural:`Coulombs`},to_anchor:1},mC:{name:{singular:`Millicoulomb`,plural:`Millicoulombs`},to_anchor:{numerator:1,denominator:1e3}},μC:{name:{singular:`Microcoulomb`,plural:`Microcoulombs`},to_anchor:{numerator:1,denominator:1e6}},nC:{name:{singular:`Nanocoulomb`,plural:`Nanocoulombs`},to_anchor:1e-9},pC:{name:{singular:`Picocoulomb`,plural:`Picocoulombs`},to_anchor:1e-12}}}},current:{systems:{SI:{A:{name:{singular:`Ampere`,plural:`Amperes`},to_anchor:1},μA:{name:{singular:`Microampere`,plural:`Microamperes`},to_anchor:1e-6},mA:{name:{singular:`Milliampere`,plural:`Milliamperes`},to_anchor:.001},kA:{name:{singular:`Kiloampere`,plural:`Kiloamperes`},to_anchor:1e3},MA:{name:{singular:`Megaampere`,plural:`Megaamperes`},to_anchor:1e6}}}},digital:{systems:{bit:{bit:{name:{singular:`Bit`,plural:`Bits`},to_anchor:1},kb:{name:{singular:`Kilobit`,plural:`Kilobits`},to_anchor:1e3},Mb:{name:{singular:`Megabit`,plural:`Megabits`},to_anchor:1e6},Gb:{name:{singular:`Gigabit`,plural:`Gigabits`},to_anchor:1e9},Tb:{name:{singular:`Terabit`,plural:`Terabits`},to_anchor:0xe8d4a51000}},byte:{byte:{name:{singular:`Byte`,plural:`Bytes`},to_anchor:1},kB:{name:{singular:`Kilobyte`,plural:`Kilobytes`},to_anchor:1e3},MB:{name:{singular:`Megabyte`,plural:`Megabytes`},to_anchor:1e6},GB:{name:{singular:`Gigabyte`,plural:`Gigabytes`},to_anchor:1e9},TB:{name:{singular:`Terabyte`,plural:`Terabytes`},to_anchor:0xe8d4a51000}},IECBit:{Kib:{name:{singular:`Kibibit`,plural:`Kibibits`},to_anchor:1},Mib:{name:{singular:`Mebibit`,plural:`Mebibits`},to_anchor:1024},Gib:{name:{singular:`Gibibit`,plural:`Gibibits`},to_anchor:1048576},Tib:{name:{singular:`Tebibit`,plural:`Tebibits`},to_anchor:1073741824}},IECByte:{KiB:{name:{singular:`Kibibyte`,plural:`Kibibytes`},to_anchor:1},MiB:{name:{singular:`Mebibyte`,plural:`Mebibytes`},to_anchor:1024},GiB:{name:{singular:`Gibibyte`,plural:`Gibibytes`},to_anchor:1048576},TiB:{name:{singular:`Tebibyte`,plural:`Tebibytes`},to_anchor:1073741824}}},anchors:{bit:{byte:{ratio:.125},IECBit:{ratio:.0009765625},IECByte:{ratio:.0001220703125}},byte:{bit:{ratio:8},IECBit:{ratio:.0078125},IECByte:{ratio:.0009765625}},IECBit:{bit:{ratio:1024},byte:{ratio:128},IECByte:{ratio:.125}},IECByte:{bit:{ratio:8192},byte:{ratio:1024},IECBit:{ratio:8}}}},each:{systems:{metric:{ea:{name:{singular:`Each`,plural:`Each`},to_anchor:1},dz:{name:{singular:`Dozen`,plural:`Dozens`},to_anchor:12}}}},energy:{systems:{SI:{Ws:{name:{singular:`Watt-second`,plural:`Watt-seconds`},to_anchor:1},Wm:{name:{singular:`Watt-minute`,plural:`Watt-minutes`},to_anchor:60},Wh:{name:{singular:`Watt-hour`,plural:`Watt-hours`},to_anchor:3600},mWh:{name:{singular:`Milliwatt-hour`,plural:`Milliwatt-hours`},to_anchor:3.6},kWh:{name:{singular:`Kilowatt-hour`,plural:`Kilowatt-hours`},to_anchor:36e5},MWh:{name:{singular:`Megawatt-hour`,plural:`Megawatt-hours`},to_anchor:36e8},GWh:{name:{singular:`Gigawatt-hour`,plural:`Gigawatt-hours`},to_anchor:36e11},J:{name:{singular:`Joule`,plural:`Joules`},to_anchor:1},kJ:{name:{singular:`Kilojoule`,plural:`Kilojoules`},to_anchor:1e3},MJ:{name:{singular:`Megajoule`,plural:`Megajoules`},to_anchor:1e6},GJ:{name:{singular:`Gigajoule`,plural:`Gigajoules`},to_anchor:1e9}},nutrition:{cal:{name:{singular:`calorie`,plural:`calories`},to_anchor:1},kcal:{name:{singular:`Kilocalorie`,plural:`Kilocalories`},to_anchor:1e3}}},anchors:{SI:{nutrition:{ratio:{numerator:1,denominator:4.184}}},nutrition:{SI:{ratio:4.184}}}},force:{systems:{SI:{N:{name:{singular:`Newton`,plural:`Newtons`},to_anchor:1},kN:{name:{singular:`Kilonewton`,plural:`Kilonewtons`},to_anchor:1e3},lbf:{name:{singular:`Pound-force`,plural:`Pound-forces`},to_anchor:4.44822},kgf:{name:{singular:`Kilogram-force`,plural:`Kilogram-forces`},to_anchor:9.807}}}},frequency:{systems:{SI:{mHz:{name:{singular:`millihertz`,plural:`millihertz`},to_anchor:{numerator:1,denominator:1e3}},Hz:{name:{singular:`hertz`,plural:`hertz`},to_anchor:1},kHz:{name:{singular:`kilohertz`,plural:`kilohertz`},to_anchor:1e3},MHz:{name:{singular:`megahertz`,plural:`megahertz`},to_anchor:1e6},GHz:{name:{singular:`gigahertz`,plural:`gigahertz`},to_anchor:1e9},THz:{name:{singular:`terahertz`,plural:`terahertz`},to_anchor:0xe8d4a51000},rpm:{name:{singular:`rotation per minute`,plural:`rotations per minute`},to_anchor:{numerator:1,denominator:60}},"deg/s":{name:{singular:`degree per second`,plural:`degrees per second`},to_anchor:{numerator:1,denominator:360}},"rad/s":{name:{singular:`radian per second`,plural:`radians per second`},to_anchor:{numerator:1,denominator:6.283185307179586}}}}},illuminance:{systems:{metric:{lx:{name:{singular:`Lux`,plural:`Lux`},to_anchor:1}},imperial:{"ft-cd":{name:{singular:`Foot-candle`,plural:`Foot-candles`},to_anchor:1}}},anchors:{metric:{imperial:{ratio:{numerator:1,denominator:10.76391}}},imperial:{metric:{ratio:10.76391}}}},length:{systems:{metric:{nm:{name:{singular:`Nanometer`,plural:`Nanometers`},to_anchor:1e-9},μm:{name:{singular:`Micrometer`,plural:`Micrometers`},to_anchor:1e-6},mm:{name:{singular:`Millimeter`,plural:`Millimeters`},to_anchor:.001},cm:{name:{singular:`Centimeter`,plural:`Centimeters`},to_anchor:.01},dm:{name:{singular:`Decimeter`,plural:`Decimeters`},to_anchor:.1},m:{name:{singular:`Meter`,plural:`Meters`},to_anchor:1},km:{name:{singular:`Kilometer`,plural:`Kilometers`},to_anchor:1e3}},imperial:{mil:{name:{singular:`Mil`,plural:`Mils`},to_anchor:{numerator:1,denominator:12e3}},in:{name:{singular:`Inch`,plural:`Inches`},to_anchor:{numerator:1,denominator:12}},yd:{name:{singular:`Yard`,plural:`Yards`},to_anchor:3},"ft-us":{name:{singular:`US Survey Foot`,plural:`US Survey Feet`},to_anchor:1.000002},ft:{name:{singular:`Foot`,plural:`Feet`},to_anchor:1},fathom:{name:{singular:`Fathom`,plural:`Fathoms`},to_anchor:6},mi:{name:{singular:`Mile`,plural:`Miles`},to_anchor:5280},nMi:{name:{singular:`Nautical Mile`,plural:`Nautical Miles`},to_anchor:6076.12}}},anchors:{metric:{imperial:{ratio:3.28084}},imperial:{metric:{ratio:{numerator:1,denominator:3.28084}}}}},mass:{systems:{metric:{mcg:{name:{singular:`Microgram`,plural:`Micrograms`},to_anchor:{numerator:1,denominator:1e6}},mg:{name:{singular:`Milligram`,plural:`Milligrams`},to_anchor:{numerator:1,denominator:1e3}},g:{name:{singular:`Gram`,plural:`Grams`},to_anchor:1},kg:{name:{singular:`Kilogram`,plural:`Kilograms`},to_anchor:1e3},mt:{name:{singular:`Metric Tonne`,plural:`Metric Tonnes`},to_anchor:1e6}},imperial:{oz:{name:{singular:`Ounce`,plural:`Ounces`},to_anchor:{numerator:1,denominator:16}},lb:{name:{singular:`Pound`,plural:`Pounds`},to_anchor:1},st:{name:{singular:`Stone`,plural:`Stones`},to_anchor:14},t:{name:{singular:`Ton`,plural:`Tons`},to_anchor:2e3}}},anchors:{metric:{imperial:{ratio:{numerator:1,denominator:453.59237}}},imperial:{metric:{ratio:453.59237}}}},massFlowRate:{systems:{metric:{"kg/s":{name:{singular:`Kilogram per second`,plural:`Kilograms per second`},to_anchor:1},"kg/min":{name:{singular:`Kilogram per minute`,plural:`Kilograms per minute`},to_anchor:1/60},"kg/h":{name:{singular:`Kilogram per hour`,plural:`Kilograms per hour`},to_anchor:{numerator:1,denominator:3600}},"mt/h":{name:{singular:`Ton per hour`,plural:`Tons per hour`},to_anchor:{numerator:1,denominator:3.6}}},imperial:{"lb/s":{name:{singular:`Pound per second`,plural:`Pounds per second`},to_anchor:1},"lb/h":{name:{singular:`Pound per hour`,plural:`Pounds per hour`},to_anchor:{numerator:1,denominator:3600}}}},anchors:{metric:{imperial:{ratio:{numerator:1,denominator:.453592}}},imperial:{metric:{ratio:.453592}}}},pace:{systems:{metric:{"min/km":{name:{singular:`Minute per kilometre`,plural:`Minutes per kilometre`},to_anchor:.06},"s/m":{name:{singular:`Second per metre`,plural:`Seconds per metre`},to_anchor:1}},imperial:{"min/mi":{name:{singular:`Minute per mile`,plural:`Minutes per mile`},to_anchor:.0113636},"s/ft":{name:{singular:`Second per foot`,plural:`Seconds per foot`},to_anchor:1}}},anchors:{metric:{imperial:{ratio:.3048}},imperial:{metric:{ratio:{numerator:1,denominator:.3048}}}}},partsPer:{systems:{SI:{ppm:{name:{singular:`Part-per Million`,plural:`Parts-per Million`},to_anchor:1},ppb:{name:{singular:`Part-per Billion`,plural:`Parts-per Billion`},to_anchor:.001},ppt:{name:{singular:`Part-per Trillion`,plural:`Parts-per Trillion`},to_anchor:1e-6},ppq:{name:{singular:`Part-per Quadrillion`,plural:`Parts-per Quadrillion`},to_anchor:1e-9}}}},pieces:{systems:{unit:{pcs:{name:{singular:`Piece`,plural:`Pieces`},to_anchor:1},"bk-doz":{name:{singular:`Bakers Dozen`,plural:`Bakers Dozen`},to_anchor:13},cp:{name:{singular:`Couple`,plural:`Couples`},to_anchor:2},"doz-doz":{name:{singular:`Dozen Dozen`,plural:`Dozen Dozen`},to_anchor:144},doz:{name:{singular:`Dozen`,plural:`Dozens`},to_anchor:12},"gr-gr":{name:{singular:`Great Gross`,plural:`Great Gross`},to_anchor:1728},gros:{name:{singular:`Gross`,plural:`Gross`},to_anchor:144},"half-dozen":{name:{singular:`Half Dozen`,plural:`Half Dozen`},to_anchor:6},"long-hundred":{name:{singular:`Long Hundred`,plural:`Long Hundred`},to_anchor:120},ream:{name:{singular:`Reams`,plural:`Reams`},to_anchor:500},scores:{name:{singular:`Scores`,plural:`Scores`},to_anchor:20},"sm-gr":{name:{singular:`Small Gross`,plural:`Small Gross`},to_anchor:120},trio:{name:{singular:`Trio`,plural:`Trio`},to_anchor:3}}}},power:{systems:{metric:{W:{name:{singular:`Watt`,plural:`Watts`},to_anchor:1},mW:{name:{singular:`Milliwatt`,plural:`Milliwatts`},to_anchor:.001},kW:{name:{singular:`Kilowatt`,plural:`Kilowatts`},to_anchor:1e3},MW:{name:{singular:`Megawatt`,plural:`Megawatts`},to_anchor:1e6},GW:{name:{singular:`Gigawatt`,plural:`Gigawatts`},to_anchor:1e9},PS:{name:{singular:`Horsepower (metric)`,plural:`Horsepower (metric)`},to_anchor:735.49875}},imperial:{"Btu/s":{name:{singular:`British thermal unit per second`,plural:`British thermal units per second`},to_anchor:778.16937},"ft-lb/s":{name:{singular:`Foot-pound per second`,plural:`Foot-pounds per second`},to_anchor:1},hp:{name:{singular:`Horsepower (British)`,plural:`Horsepower (British)`},to_anchor:550}}},anchors:{metric:{imperial:{ratio:.737562149}},imperial:{metric:{ratio:{numerator:1,denominator:.737562149}}}}},pressure:{systems:{metric:{Pa:{name:{singular:`pascal`,plural:`pascals`},to_anchor:{numerator:1,denominator:1e3}},kPa:{name:{singular:`kilopascal`,plural:`kilopascals`},to_anchor:1},MPa:{name:{singular:`megapascal`,plural:`megapascals`},to_anchor:1e3},hPa:{name:{singular:`hectopascal`,plural:`hectopascals`},to_anchor:{numerator:1,denominator:10}},mbar:{name:{singular:`millibar`,plural:`millibar`},to_anchor:.1},bar:{name:{singular:`bar`,plural:`bar`},to_anchor:100},torr:{name:{singular:`torr`,plural:`torr`},to_anchor:{numerator:101325,denominator:76e4}},mH2O:{name:{singular:`meter of water @ 4°C`,plural:`meters of water @ 4°C`},to_anchor:9.80665},mmHg:{name:{singular:`millimeter of mercury`,plural:`millimeters of mercury`},to_anchor:.133322}},imperial:{psi:{name:{singular:`pound per square inch`,plural:`pounds per square inch`},to_anchor:{numerator:1,denominator:1e3}},ksi:{name:{singular:`kilopound per square inch`,plural:`kilopound per square inch`},to_anchor:1},inHg:{name:{singular:`Inch of mercury`,plural:`Inches of mercury`},to_anchor:491154e-9}}},anchors:{metric:{imperial:{ratio:.00014503768078}},imperial:{metric:{ratio:{numerator:1,denominator:.00014503768078}}}}},reactiveEnergy:{systems:{SI:{VARh:{name:{singular:`Volt-Ampere Reactive Hour`,plural:`Volt-Amperes Reactive Hour`},to_anchor:1},mVARh:{name:{singular:`Millivolt-Ampere Reactive Hour`,plural:`Millivolt-Amperes Reactive Hour`},to_anchor:.001},kVARh:{name:{singular:`Kilovolt-Ampere Reactive Hour`,plural:`Kilovolt-Amperes Reactive Hour`},to_anchor:1e3},MVARh:{name:{singular:`Megavolt-Ampere Reactive Hour`,plural:`Megavolt-Amperes Reactive Hour`},to_anchor:1e6},GVARh:{name:{singular:`Gigavolt-Ampere Reactive Hour`,plural:`Gigavolt-Amperes Reactive Hour`},to_anchor:1e9}}}},reactivePower:{systems:{SI:{VAR:{name:{singular:`Volt-Ampere Reactive`,plural:`Volt-Amperes Reactive`},to_anchor:1},mVAR:{name:{singular:`Millivolt-Ampere Reactive`,plural:`Millivolt-Amperes Reactive`},to_anchor:.001},kVAR:{name:{singular:`Kilovolt-Ampere Reactive`,plural:`Kilovolt-Amperes Reactive`},to_anchor:1e3},MVAR:{name:{singular:`Megavolt-Ampere Reactive`,plural:`Megavolt-Amperes Reactive`},to_anchor:1e6},GVAR:{name:{singular:`Gigavolt-Ampere Reactive`,plural:`Gigavolt-Amperes Reactive`},to_anchor:1e9}}}},speed:{systems:{metric:{"m/s":{name:{singular:`Metre per second`,plural:`Metres per second`},to_anchor:3.6},"km/h":{name:{singular:`Kilometre per hour`,plural:`Kilometres per hour`},to_anchor:1},"mm/h":{name:{singular:`Millimeter per hour`,plural:`Millimeters per hour`},to_anchor:1e-6}},imperial:{mph:{name:{singular:`Mile per hour`,plural:`Miles per hour`},to_anchor:1},knot:{name:{singular:`Knot`,plural:`Knots`},to_anchor:1.150779},"ft/s":{name:{singular:`Foot per second`,plural:`Feet per second`},to_anchor:.681818},"ft/min":{name:{singular:`Foot per minute`,plural:`Feet per minute`},to_anchor:.0113636},"in/h":{name:{singular:`Inch per hour`,plural:`Inches per hour`},to_anchor:1578e-8}}},anchors:{metric:{imperial:{ratio:{numerator:1,denominator:1.609344}}},imperial:{metric:{ratio:1.609344}}}},torque:{systems:{metric:{Nm:{name:{singular:`Newton-meter`,plural:`Newton-meters`},to_anchor:1},cNm:{name:{singular:`Centinewton-meter`,plural:`Centinewton-meters`},to_anchor:.01},dNm:{name:{singular:`Decinewton-meter`,plural:`Decinewton-meters`},to_anchor:.1},kgm:{name:{singular:`Kilogram-meter`,plural:`Kilogram-meters`},to_anchor:9.806649999787735},"kg-cm":{name:{singular:`Kilogram-centimeter`,plural:`Kilogram-centimeters`},to_anchor:.09806649999787735}},imperial:{"lbf-ft":{name:{singular:`Pound-foot`,plural:`Pound-feet`},to_anchor:1},"lbf-in":{name:{singular:`Pound-inch`,plural:`Pound-inches`},to_anchor:.08333333333333333},"ozf-in":{name:{singular:`Ounce-inch`,plural:`Ounce-inches`},to_anchor:.005208333271755643}}},anchors:{metric:{imperial:{ratio:{numerator:1,denominator:1.355818}}},imperial:{metric:{ratio:1.355818}}}},temperature:{systems:{metric:{C:{name:{singular:`degree Celsius`,plural:`degrees Celsius`},to_anchor:1,anchor_shift:0},K:{name:{singular:`Kelvin`,plural:`Kelvins`},to_anchor:1,anchor_shift:273.15}},imperial:{F:{name:{singular:`degree Fahrenheit`,plural:`degrees Fahrenheit`},to_anchor:1},R:{name:{singular:`degree Rankine`,plural:`degrees Rankine`},to_anchor:1,anchor_shift:459.67}}},anchors:{metric:{imperial:{transform:function(e,t){return t.add(t.div(e,t.div(5,9)),32)}}},imperial:{metric:{transform:function(e,t){return t.mul(t.sub(e,32),t.div(5,9))}}}}},time:{systems:{SI:{ns:{name:{singular:`Nanosecond`,plural:`Nanoseconds`},to_anchor:{numerator:1,denominator:1e9}},mu:{name:{singular:`Microsecond`,plural:`Microseconds`},to_anchor:{numerator:1,denominator:1e6}},ms:{name:{singular:`Millisecond`,plural:`Milliseconds`},to_anchor:{numerator:1,denominator:1e3}},s:{name:{singular:`Second`,plural:`Seconds`},to_anchor:1},min:{name:{singular:`Minute`,plural:`Minutes`},to_anchor:60},h:{name:{singular:`Hour`,plural:`Hours`},to_anchor:3600},d:{name:{singular:`Day`,plural:`Days`},to_anchor:86400},week:{name:{singular:`Week`,plural:`Weeks`},to_anchor:604800},month:{name:{singular:`Month`,plural:`Months`},to_anchor:{numerator:31557600,denominator:12}},year:{name:{singular:`Year`,plural:`Years`},to_anchor:31557600}}}},voltage:{systems:{SI:{V:{name:{singular:`Volt`,plural:`Volts`},to_anchor:1},μV:{name:{singular:`Microvolt`,plural:`Microvolts`},to_anchor:1e-6},mV:{name:{singular:`Millivolt`,plural:`Millivolts`},to_anchor:.001},kV:{name:{singular:`Kilovolt`,plural:`Kilovolts`},to_anchor:1e3},MV:{name:{singular:`Megavolt`,plural:`Megavolts`},to_anchor:1e6}}}},volume:{systems:{metric:{mm3:{name:{singular:`Cubic Millimeter`,plural:`Cubic Millimeters`},to_anchor:{numerator:1,denominator:1e6}},cm3:{name:{singular:`Cubic Centimeter`,plural:`Cubic Centimeters`},to_anchor:{numerator:1,denominator:1e3}},dm3:{name:{singular:`Cubic Decimeter`,plural:`Cubic Decimeters`},to_anchor:1},ml:{name:{singular:`Millilitre`,plural:`Millilitres`},to_anchor:{numerator:1,denominator:1e3}},cl:{name:{singular:`Centilitre`,plural:`Centilitres`},to_anchor:{numerator:1,denominator:100}},dl:{name:{singular:`Decilitre`,plural:`Decilitres`},to_anchor:{numerator:1,denominator:10}},l:{name:{singular:`Litre`,plural:`Litres`},to_anchor:1},kl:{name:{singular:`Kilolitre`,plural:`Kilolitres`},to_anchor:1e3},Ml:{name:{singular:`Megalitre`,plural:`Megalitres`},to_anchor:1e6},Gl:{name:{singular:`Gigalitre`,plural:`Gigalitres`},to_anchor:1e9},m3:{name:{singular:`Cubic meter`,plural:`Cubic meters`},to_anchor:1e3},km3:{name:{singular:`Cubic kilometer`,plural:`Cubic kilometers`},to_anchor:0xe8d4a51000},krm:{name:{singular:`Kryddmått`,plural:`Kryddmått`},to_anchor:{numerator:1,denominator:1e3}},tsk:{name:{singular:`Tesked`,plural:`Teskedar`},to_anchor:{numerator:5,denominator:1e3}},msk:{name:{singular:`Matsked`,plural:`Matskedar`},to_anchor:{numerator:15,denominator:1e3}},kkp:{name:{singular:`Kaffekopp`,plural:`Kaffekoppar`},to_anchor:{numerator:150,denominator:1e3}},glas:{name:{singular:`Glas`,plural:`Glas`},to_anchor:{numerator:200,denominator:1e3}},kanna:{name:{singular:`Kanna`,plural:`Kannor`},to_anchor:2.617}},imperial:{tsp:{name:{singular:`Teaspoon`,plural:`Teaspoons`},to_anchor:{numerator:1,denominator:6}},Tbs:{name:{singular:`Tablespoon`,plural:`Tablespoons`},to_anchor:{numerator:1,denominator:2}},in3:{name:{singular:`Cubic inch`,plural:`Cubic inches`},to_anchor:.55411},"fl-oz":{name:{singular:`Fluid Ounce`,plural:`Fluid Ounces`},to_anchor:1},cup:{name:{singular:`Cup`,plural:`Cups`},to_anchor:8},pnt:{name:{singular:`Pint`,plural:`Pints`},to_anchor:16},qt:{name:{singular:`Quart`,plural:`Quarts`},to_anchor:32},gal:{name:{singular:`Gallon`,plural:`Gallons`},to_anchor:128},ft3:{name:{singular:`Cubic foot`,plural:`Cubic feet`},to_anchor:957.506},yd3:{name:{singular:`Cubic yard`,plural:`Cubic yards`},to_anchor:25852.7}}},anchors:{metric:{imperial:{ratio:33.8140226}},imperial:{metric:{ratio:{numerator:1,denominator:33.8140226}}}}},volumeFlowRate:{systems:{metric:{"mm3/s":{name:{singular:`Cubic Millimeter per second`,plural:`Cubic Millimeters per second`},to_anchor:{numerator:1,denominator:1e6}},"cm3/s":{name:{singular:`Cubic Centimeter per second`,plural:`Cubic Centimeters per second`},to_anchor:{numerator:1,denominator:1e3}},"dm3/s":{name:{singular:`Cubic Decimeter per second`,plural:`Cubic Decimeters per second`},to_anchor:1},"dm3/min":{name:{singular:`Cubic Decimeter per minute`,plural:`Cubic Decimeters per minute`},to_anchor:1/60},"dm3/h":{name:{singular:`Cubic Decimeter per hour`,plural:`Cubic Decimeters per hour`},to_anchor:1/3600},"dm3/d":{name:{singular:`Cubic Decimeter per day`,plural:`Cubic Decimeters per day`},to_anchor:1/86400},"dm3/a":{name:{singular:`Cubic Decimeter per year`,plural:`Cubic Decimeters per year`},to_anchor:1/31557600},"ml/s":{name:{singular:`Millilitre per second`,plural:`Millilitres per second`},to_anchor:{numerator:1,denominator:1e3}},"cl/s":{name:{singular:`Centilitre per second`,plural:`Centilitres per second`},to_anchor:{numerator:1,denominator:100}},"dl/s":{name:{singular:`Decilitre per second`,plural:`Decilitres per second`},to_anchor:{numerator:1,denominator:10}},"l/s":{name:{singular:`Litre per second`,plural:`Litres per second`},to_anchor:1},"l/min":{name:{singular:`Litre per minute`,plural:`Litres per minute`},to_anchor:{numerator:1,denominator:60}},"l/h":{name:{singular:`Litre per hour`,plural:`Litres per hour`},to_anchor:{numerator:1,denominator:3600}},"l/d":{name:{singular:`Litre per day`,plural:`Litres per day`},to_anchor:1/86400},"l/a":{name:{singular:`Litre per year`,plural:`Litres per year`},to_anchor:1/31557600},"kl/s":{name:{singular:`Kilolitre per second`,plural:`Kilolitres per second`},to_anchor:1e3},"kl/min":{name:{singular:`Kilolitre per minute`,plural:`Kilolitres per minute`},to_anchor:{numerator:50,denominator:3}},"kl/h":{name:{singular:`Kilolitre per hour`,plural:`Kilolitres per hour`},to_anchor:{numerator:5,denominator:18}},"m3/s":{name:{singular:`Cubic meter per second`,plural:`Cubic meters per second`},to_anchor:1e3},"m3/min":{name:{singular:`Cubic meter per minute`,plural:`Cubic meters per minute`},to_anchor:{numerator:50,denominator:3}},"m3/h":{name:{singular:`Cubic meter per hour`,plural:`Cubic meters per hour`},to_anchor:{numerator:5,denominator:18}},"m3/d":{name:{singular:`Cubic meter per day`,plural:`Cubic meters per day`},to_anchor:5/432},"m3/a":{name:{singular:`Cubic meter per year`,plural:`Cubic meters per year`},to_anchor:5/157788},"km3/s":{name:{singular:`Cubic kilometer per second`,plural:`Cubic kilometers per second`},to_anchor:0xe8d4a51000}},imperial:{"tsp/s":{name:{singular:`Teaspoon per second`,plural:`Teaspoons per second`},to_anchor:{numerator:1,denominator:6}},"Tbs/s":{name:{singular:`Tablespoon per second`,plural:`Tablespoons per second`},to_anchor:{numerator:1,denominator:2}},"in3/s":{name:{singular:`Cubic inch per second`,plural:`Cubic inches per second`},to_anchor:.55411},"in3/min":{name:{singular:`Cubic inch per minute`,plural:`Cubic inches per minute`},to_anchor:{numerator:.55411,denominator:60}},"in3/h":{name:{singular:`Cubic inch per hour`,plural:`Cubic inches per hour`},to_anchor:{numerator:.55411,denominator:3600}},"fl-oz/s":{name:{singular:`Fluid Ounce per second`,plural:`Fluid Ounces per second`},to_anchor:1},"fl-oz/min":{name:{singular:`Fluid Ounce per minute`,plural:`Fluid Ounces per minute`},to_anchor:{numerator:1,denominator:60}},"fl-oz/h":{name:{singular:`Fluid Ounce per hour`,plural:`Fluid Ounces per hour`},to_anchor:{numerator:1,denominator:3600}},"cup/s":{name:{singular:`Cup per second`,plural:`Cups per second`},to_anchor:8},"pnt/s":{name:{singular:`Pint per second`,plural:`Pints per second`},to_anchor:16},"pnt/min":{name:{singular:`Pint per minute`,plural:`Pints per minute`},to_anchor:{numerator:4,denominator:15}},"pnt/h":{name:{singular:`Pint per hour`,plural:`Pints per hour`},to_anchor:{numerator:1,denominator:225}},"qt/s":{name:{singular:`Quart per second`,plural:`Quarts per second`},to_anchor:32},"gal/s":{name:{singular:`Gallon per second`,plural:`Gallons per second`},to_anchor:128},"gal/min":{name:{singular:`Gallon per minute`,plural:`Gallons per minute`},to_anchor:{numerator:32,denominator:15}},"gal/h":{name:{singular:`Gallon per hour`,plural:`Gallons per hour`},to_anchor:{numerator:8,denominator:225}},"ft3/s":{name:{singular:`Cubic foot per second`,plural:`Cubic feet per second`},to_anchor:957.506},"ft3/min":{name:{singular:`Cubic foot per minute`,plural:`Cubic feet per minute`},to_anchor:{numerator:957.506,denominator:60}},"ft3/h":{name:{singular:`Cubic foot per hour`,plural:`Cubic feet per hour`},to_anchor:{numerator:957.506,denominator:3600}},"yd3/s":{name:{singular:`Cubic yard per second`,plural:`Cubic yards per second`},to_anchor:25852.7},"yd3/min":{name:{singular:`Cubic yard per minute`,plural:`Cubic yards per minute`},to_anchor:{numerator:25852.7,denominator:60}},"yd3/h":{name:{singular:`Cubic yard per hour`,plural:`Cubic yards per hour`},to_anchor:{numerator:25852.7,denominator:3600}}}},anchors:{metric:{imperial:{ratio:33.8140227}},imperial:{metric:{ratio:{numerator:1,denominator:33.8140227}}}}}},me={systems:{SI:{mΩ:{name:{singular:`Milliohm`,plural:`Milliohms`},to_anchor:.001},Ω:{name:{singular:`Ohm`,plural:`Ohms`},to_anchor:1},kΩ:{name:{singular:`Kiloohm`,plural:`Kiloohms`},to_anchor:1e3},MΩ:{name:{singular:`Megaohm`,plural:`Megaohms`},to_anchor:1e6}}}},he={systems:{SI:{Ω·m:{name:{singular:`Ohm metre`,plural:`Ohm metres`},to_anchor:1},"Ω·mm²/m":{name:{singular:`Ohm square millimetre per metre`,plural:`Ohm square millimetres per metre`},to_anchor:1e-6},Ω·cm:{name:{singular:`Ohm centimetre`,plural:`Ohm centimetres`},to_anchor:.01},nΩ·m:{name:{singular:`Nanoohm metre`,plural:`Nanoohm metres`},to_anchor:1e-9},µΩ·cm:{name:{singular:`Microohm centimetre`,plural:`Microohm centimetres`},to_anchor:1e-8}}}},ge={systems:{SI:{nH:{name:{singular:`Nanohenry`,plural:`Nanohenries`},to_anchor:1e-9},µH:{name:{singular:`Microhenry`,plural:`Microhenries`},to_anchor:1e-6},mH:{name:{singular:`Millihenry`,plural:`Millihenries`},to_anchor:.001},H:{name:{singular:`Henry`,plural:`Henries`},to_anchor:1}}}},_e={systems:{SI:{pF:{name:{singular:`Picofarad`,plural:`Picofarads`},to_anchor:1e-12},nF:{name:{singular:`Nanofarad`,plural:`Nanofarads`},to_anchor:1e-9},µF:{name:{singular:`Microfarad`,plural:`Microfarads`},to_anchor:1e-6},mF:{name:{singular:`Millifarad`,plural:`Millifarads`},to_anchor:.001},F:{name:{singular:`Farad`,plural:`Farads`},to_anchor:1}}}},ve={systems:{metric:{"°C":{name:{singular:`Degree Celsius`,plural:`Degrees Celsius`},to_anchor:1,anchor_shift:0},K:{name:{singular:`Kelvin`,plural:`Kelvins`},to_anchor:1,anchor_shift:273.15}},imperial:{"°F":{name:{singular:`Degree Fahrenheit`,plural:`Degrees Fahrenheit`},to_anchor:1},"°R":{name:{singular:`Degree Rankine`,plural:`Degrees Rankine`},to_anchor:1,anchor_shift:459.67}}},anchors:{metric:{imperial:{transform:(e,t)=>t.add(t.div(e,t.div(5,9)),32)}},imperial:{metric:{transform:(e,t)=>t.mul(t.sub(e,32),t.div(5,9))}}}},ye={systems:{SI:{"kg/m3":{name:{singular:`Kilogram per cubic metre`,plural:`Kilograms per cubic metre`},to_anchor:1},"g/cm3":{name:{singular:`Gram per cubic centimetre`,plural:`Grams per cubic centimetre`},to_anchor:1e3},"g/mL":{name:{singular:`Gram per millilitre`,plural:`Grams per millilitre`},to_anchor:1e3},"kg/L":{name:{singular:`Kilogram per litre`,plural:`Kilograms per litre`},to_anchor:1e3},"lb/ft3":{name:{singular:`Pound per cubic foot`,plural:`Pounds per cubic foot`},to_anchor:16.01846337396014}}}},be={systems:{SI:{"J/(kg·K)":{name:{singular:`Joule per kilogram kelvin`,plural:`Joules per kilogram kelvin`},to_anchor:1},"kJ/(kg·K)":{name:{singular:`Kilojoule per kilogram kelvin`,plural:`Kilojoules per kilogram kelvin`},to_anchor:1e3},"cal/(g·°C)":{name:{singular:`Calorie per gram degree Celsius`,plural:`Calories per gram degree Celsius`},to_anchor:4184},"Btu/(lb·°F)":{name:{singular:`British thermal unit per pound degree Fahrenheit`,plural:`British thermal units per pound degree Fahrenheit`},to_anchor:4186.8}}}},xe={systems:{SI:{"J/kg":{name:{singular:`Joule per kilogram`,plural:`Joules per kilogram`},to_anchor:1},"kJ/kg":{name:{singular:`Kilojoule per kilogram`,plural:`Kilojoules per kilogram`},to_anchor:1e3},"cal/g":{name:{singular:`Calorie per gram`,plural:`Calories per gram`},to_anchor:4184},"Btu/lb":{name:{singular:`British thermal unit per pound`,plural:`British thermal units per pound`},to_anchor:2326}}}},Se={systems:{SI:{"W/(m·K)":{name:{singular:`Watt per metre kelvin`,plural:`Watts per metre kelvin`},to_anchor:1},"Btu/(h·ft·°F)":{name:{singular:`British thermal unit per hour foot degree Fahrenheit`,plural:`British thermal units per hour foot degree Fahrenheit`},to_anchor:1.730735}}}},Ce={systems:{SI:{Pa·s:{name:{singular:`Pascal second`,plural:`Pascal seconds`},to_anchor:1},mPa·s:{name:{singular:`Millipascal second`,plural:`Millipascal seconds`},to_anchor:.001},cP:{name:{singular:`Centipoise`,plural:`Centipoise`},to_anchor:.001},P:{name:{singular:`Poise`,plural:`Poise`},to_anchor:.1}}}},we={systems:{SI:{"1/K":{name:{singular:`Per kelvin`,plural:`Per kelvin`},to_anchor:1},"1/°C":{name:{singular:`Per degree Celsius`,plural:`Per degree Celsius`},to_anchor:1},"1/°F":{name:{singular:`Per degree Fahrenheit`,plural:`Per degree Fahrenheit`},to_anchor:1.8}}}},Te={systems:{SI:{1:{name:{singular:`Ratio`,plural:`Ratio`},to_anchor:1},"%":{name:{singular:`Percent`,plural:`Percent`},to_anchor:.01}}}},Ee={systems:{SI:{dB:{name:{singular:`Decibel`,plural:`Decibels`},to_anchor:1}}}},v=fe({...pe,resistance:me,resistivity:he,inductance:ge,capacitance:_e,temperature:ve,density:ye,specificHeat:be,specificEnergy:xe,thermalConductivity:Se,dynamicViscosity:Ce,thermalExpansion:we,ratio:Te,decibel:Ee}),De=new Set(v().measures());function y(e,t,n){return v(e).from(t).to(n)}function Oe(e){return[...v().from(e).possibilities()]}function ke(){let e=new Map;for(let t of v().measures()){if(!De.has(t))continue;let n=v().possibilities(t);e.set(t,n)}return e}function b(e){let{measure:t}=v().describe(e);if(!De.has(t))throw Error(`Unknown measurement kind "${t}".`);return t}function x(e){try{return v().describe(e)}catch{return null}}function Ae(e){return x(e)!==null}function S(e){let t=e.indexOf(`@`);if(t<=0||t===e.length-1)return null;let n=e.slice(0,t);if(!Ae(n))return null;let r=[];for(let n of e.slice(t+1).split(`,`)){let e=n.trim();if(!Ae(e))return null;r.push(e)}return r.length===0?null:{unit:n,axes:r}}function je(e,t){let n=[],r=t??Oe(e);for(let t of[e,...r])n.includes(t)||n.push(t);return n}var Me=/^[a-z0-9]+(?:-[a-z0-9]+)*$/,Ne=/^[A-Za-z][A-Za-z0-9_]*$/;function C(e){return Me.test(e)}function Pe(t){let n=[];C(t.id)||n.push(`id "${t.id}" must use lowercase letters, digits, and single hyphens.`),t.title.trim()===``&&n.push(`title must not be empty.`),t.headerHtml!==void 0&&typeof t.headerHtml!=`string`&&n.push(`headerHtml must be a string.`),t.variables.length===0&&n.push(`at least one variable is required.`),n.push(...Ie(t.variables)),n.push(...Ve(t)),t.computeState!==void 0&&(typeof t.computeState==`function`?We(t,n):n.push(`computeState must be a function.`));let r=Le(t.variables);for(let[e,i]of(t.testCases??[]).entries())Ue(`test case ${e+1}`,i,t.variables,r,n);if(n.length>0)throw new e(`Invalid calculator "${t.id}":\n- ${n.join(`
- `)}`)}function Fe(t,n=`variable list`){let r=Ie(t);if(r.length>0)throw new e(`Invalid ${n}:\n- ${r.join(`
- `)}`)}function Ie(e){let t=[],n=Le(e),r=new Set,i=0;for(let[n,a]of e.entries()){let e=`variable ${n+1} ("${a.name}")`;Ne.test(a.name)?r.has(a.name)&&t.push(`${e}: duplicate name.`):t.push(`${e}: name must start with a letter and contain only letters, digits, and underscores.`),r.add(a.name),a.label.trim()===``&&t.push(`${e}: label must not be empty.`),a.editable!==void 0&&typeof a.editable!=`boolean`&&t.push(`${e}: editable must be a boolean.`),a.input!==void 0&&typeof a.input!=`boolean`&&t.push(`${e}: input must be a boolean.`),a.autoUpdate!==void 0&&typeof a.autoUpdate!=`boolean`&&t.push(`${e}: autoUpdate must be a boolean.`),a.hidden!==void 0&&typeof a.hidden!=`boolean`&&t.push(`${e}: hidden must be a boolean.`),a.takeFrom!==void 0&&(i+=1),u(a)?(i+=1,Ge(e,a,t)):p(a)?(a.computable!==void 0&&(i+=1),Ke(e,a,t)):(d(a)?i+=1:a.computable===void 0?Ye(a)&&(i+=1):i+=1,qe(e,a,t))}for(let[r,i]of e.entries())m(i)&&d(i)&&Je(`variable ${r+1} ("${i.name}")`,i.tableSelect,n,t);for(let[r,i]of e.entries())!u(i)&&!p(i)&&Xe(`variable ${r+1} ("${i.name}")`,i,n,t);for(let[r,i]of e.entries())Re(`variable ${r+1} ("${i.name}")`,i,n,t);return i===0&&t.push(`at least one variable must be computable or derive from a table.`),t}function Le(e){let t=new Map;for(let n of e)t.set(n.name,n);return t}function Re(e,t,n,r){if(t.takeFrom!==void 0){if(typeof t.takeFrom!=`string`||t.takeFrom===``)r.push(`${e}: takeFrom must be a non-empty variable name.`);else if(t.takeFrom===t.name)r.push(`${e}: takeFrom must not name the variable itself.`);else{let i=n.get(t.takeFrom);i===void 0?r.push(`${e}: takeFrom names unknown variable "${t.takeFrom}".`):ze(e,`takeFrom`,t,i,r)}}if(t.sendTo===void 0)return;if(!Array.isArray(t.sendTo)){r.push(`${e}: sendTo must be an array of variable names.`);return}let i=new Set;for(let a of t.sendTo){if(typeof a!=`string`||a===``){r.push(`${e}: sendTo entries must be non-empty names.`);continue}if(a===t.name){r.push(`${e}: sendTo must not name the variable itself.`);continue}if(i.has(a)){r.push(`${e}: duplicate sendTo target "${a}".`);continue}i.add(a);let o=n.get(a);o===void 0?r.push(`${e}: sendTo names unknown variable "${a}".`):ze(e,`sendTo "${a}"`,t,o,r)}}function ze(e,t,n,r,i){let a=Be(n),o=Be(r);if(a!==o)i.push(`${e}: ${t} must be the same kind of variable (it is ${a}, "${r.name}" is ${o}).`);else if(a===`tableSelect`){let a=n.table,o=r.table;a!==o&&i.push(`${e}: ${t} must select from the same table ("${a}" vs "${o}").`)}else if(a===`number`){let a=n.unit,o=r.unit;b(a)!==b(o)&&i.push(`${e}: ${t} must measure the same kind ("${a}" vs "${o}").`)}}function Be(e){return u(e)?`tableSelect`:p(e)?`text`:`number`}function Ve(e){let t=[],n=new Set;for(let[r,i]of(e.config??[]).entries()){let e=`config field ${r+1} ("${i.name}")`;Ne.test(i.name)?n.has(i.name)&&t.push(`${e}: duplicate name.`):t.push(`${e}: name must start with a letter and contain only letters, digits, and underscores.`),n.add(i.name),i.label.trim()===``&&t.push(`${e}: label must not be empty.`),He(e,i,t)}return e.buildVariables!==void 0&&typeof e.buildVariables!=`function`&&t.push(`buildVariables must be a function.`),t}function He(e,t,n){switch(t.kind){case`number`:typeof t.default==`number`&&Number.isFinite(t.default)||n.push(`${e}: default must be a finite number.`),t.options!==void 0&&n.push(`${e}: options are only allowed on select fields.`),t.min!==void 0&&t.max!==void 0&&t.min>t.max&&n.push(`${e}: min must not exceed max.`);return;case`boolean`:typeof t.default!=`boolean`&&n.push(`${e}: default must be a boolean.`),t.options!==void 0&&n.push(`${e}: options are only allowed on select fields.`);return;case`string`:typeof t.default!=`string`&&n.push(`${e}: default must be a string.`),t.options!==void 0&&n.push(`${e}: options are only allowed on select fields.`);return;case`select`:{let r=t.options??[];r.length===0?n.push(`${e}: select fields must list at least one option.`):new Set(r).size!==r.length&&n.push(`${e}: select options must be unique.`),typeof t.default==`string`&&r.includes(t.default)||n.push(`${e}: default must be one of the options.`);return}default:n.push(`${e}: unknown kind "${String(t.kind)}".`)}}function Ue(e,t,n,r,i){for(let n of Object.keys(t))r.has(n)||i.push(`${e}: unknown variable "${n}".`);for(let r of n){if(!Object.hasOwn(t,r.name)){i.push(`${e}: missing variable "${r.name}".`);continue}let n=t[r.name];n!==null&&(u(r)?typeof n!=`string`&&i.push(`${e}: "${r.name}" must be a row key or null.`):p(r)?typeof n!=`string`&&i.push(`${e}: "${r.name}" must be text or null.`):typeof n==`number`&&Number.isFinite(n)||i.push(`${e}: "${r.name}" must be a finite number or null.`))}}function We(e,t){let n={};for(let t of e.variables)n[t.name]=null;let r=Object.freeze(n);for(let n of e.variables){if(u(n)||n.computable===void 0)continue;let e;try{e=n.computable(r)}catch(e){t.push(`variable "${n.name}": computeState is set but its computable threw ${c(e)}.`);continue}_(e)||t.push(`variable "${n.name}": when computeState is set every computable must return unchanged().`)}}function Ge(e,t,n){C(t.table??``)||n.push(`${e}: table must be a lowercase, hyphenated table id.`),t.default!==void 0&&(typeof t.default!=`string`||t.default.trim()===``)&&n.push(`${e}: default must be a non-empty row key.`),t.filter!==void 0&&(typeof t.filter!=`string`||t.filter.trim()===``)&&n.push(`${e}: filter must be a non-empty column key.`),`unit`in t&&n.push(`${e}: a table-select variable must not have a unit.`),`unitOptions`in t&&n.push(`${e}: a table-select variable must not have unit options.`),`computable`in t&&n.push(`${e}: a table-select variable is derived and must not have a computable function.`),(`tableSelect`in t||`tableField`in t)&&n.push(`${e}: a table-select variable cannot also reference another table select.`)}function Ke(e,t,n){t.default!==void 0&&typeof t.default!=`string`&&n.push(`${e}: default must be a string.`),(`unit`in t||`unitOptions`in t)&&n.push(`${e}: a text variable must not have a unit.`),`table`in t&&n.push(`${e}: a text variable must not reference a table.`)}function qe(e,t,n){let r=x(t.unit);if(r===null?n.push(`${e}: unknown unit "${t.unit}".`):t.unitOptions!==void 0&&Ze(e,t.unit,t.unitOptions,n),t.defaultDisplayUnit!==void 0){let i=x(t.defaultDisplayUnit);i===null?n.push(`${e}: unknown default display unit "${t.defaultDisplayUnit}".`):r!==null&&i.measure!==r.measure&&n.push(`${e}: default display unit "${t.defaultDisplayUnit}" measures "${i.measure}", expected "${r.measure}".`)}let i=t.tableSelect!==void 0,a=t.tableField!==void 0;if(i!==a&&n.push(`${e}: tableSelect and tableField must be provided together.`),a&&t.tableField===``&&n.push(`${e}: tableField must not be empty.`),t.tableAxis!==void 0){let r=f(t);(r.length===0||r.some(e=>e===``))&&n.push(`${e}: tableAxis must name at least one variable.`)}t.tableAxis!==void 0&&!a&&n.push(`${e}: tableAxis requires tableField.`),i&&t.computable!==void 0&&n.push(`${e}: a table-derived variable must not also have a computable function.`),t.default!==void 0&&(typeof t.default!=`number`||!Number.isFinite(t.default)?n.push(`${e}: default must be a finite number.`):(i||t.computable!==void 0)&&n.push(`${e}: only a plain input variable may declare a default.`))}function Je(e,t,n,r){if(t===void 0)return;let i=n.get(t);i===void 0?r.push(`${e}: tableSelect "${t}" is not a variable.`):u(i)||r.push(`${e}: tableSelect "${t}" is not a table-select variable.`)}function Ye(e){let t=e.equivalent;return typeof t==`object`&&!!t&&!Array.isArray(t)&&Object.keys(t).length>0}function Xe(e,t,n,r){let i=t.equivalent;if(i!==void 0){if(typeof i!=`object`||!i||Array.isArray(i))r.push(`${e}: equivalent must be an object of variables.`);else{t.computable!==void 0&&r.push(`${e}: a computable variable must not declare equivalent variables.`);for(let[a,o]of Object.entries(i)){if(a===t.name){r.push(`${e}: equivalent must not name the variable itself.`);continue}let i=n.get(a);i===void 0?r.push(`${e}: equivalent names unknown variable "${a}".`):u(i)||p(i)?r.push(`${e}: equivalent target "${a}" must be a numeric variable.`):typeof o==`function`?typeof i.equivalent?.[t.name]!=`function`&&r.push(`${e}: equivalent target "${a}" must declare the reverse conversion back to "${t.name}".`):r.push(`${e}: equivalent["${a}"] must be a function.`)}}}}function Ze(e,t,n,r){let i=b(t),a=new Set;for(let t of n){if(a.has(t)){r.push(`${e}: duplicate unit option "${t}".`);continue}a.add(t);let n=x(t);n===null?r.push(`${e}: unknown unit option "${t}".`):n.measure!==i&&r.push(`${e}: unit option "${t}" measures "${n.measure}", expected "${i}".`)}}function Qe(e){let t=e.trim();if(t===``)return null;let n=[],r=null,i=!1;for(let e of $e(t)){let t=e.indexOf(`@`);if(t===-1){let t=Number(e);if(!Number.isFinite(t)||i)return null;r=t,i=!0;continue}if(t===0||t===e.length-1)return null;let a=Number(e.slice(0,t).trim());if(!Number.isFinite(a))return null;let o=[];for(let n of e.slice(t+1).split(`,`)){let e=Number(n.trim());if(!Number.isFinite(e))return null;o.push(e)}if(o.length===0)return null;n.push({coords:o,y:a})}if(n.length===0&&!i)return null;n.sort(tt);for(let e=1;e<n.length;e+=1)if(nt(n[e].coords,n[e-1].coords))return null;return{points:n,fallback:r}}function w(e){return typeof e==`number`?Number.isFinite(e)?{points:[],fallback:e}:null:typeof e==`string`?Qe(e):null}function $e(e){return e.includes(`;`)?et(e,`;`):(e.match(/@/g)?.length??0)>1?et(e,`,`):[e]}function et(e,t){return e.split(t).map(e=>e.trim()).filter(e=>e!==``)}function tt(e,t){let n=Math.min(e.coords.length,t.coords.length);for(let r=0;r<n;r+=1){let n=e.coords[r]-t.coords[r];if(n!==0)return n}return e.coords.length-t.coords.length}function nt(e,t){return e.length===t.length&&e.every((e,n)=>e===t[n])}function rt(e,t){let n=[];for(let t of e){let e=t.coords[0];typeof e==`number`&&Number.isFinite(e)&&n.push({x:e,y:t.y})}if(n.length===0)return null;if(n.length===1)return n[0].y;let r=[...n].sort((e,t)=>e.x-t.x),i=r.length,a=Array(i-1),o=Array(i-1);for(let e=0;e<i-1;e+=1){let t=r[e],n=r[e+1],i=n.x-t.x;if(i<=0)return null;a[e]=i,o[e]=(n.y-t.y)/i}if(t<=r[0].x)return r[0].y+o[0]*(t-r[0].x);if(t>=r[i-1].x)return r[i-1].y+o[i-2]*(t-r[i-1].x);let s=Array(i);s[0]=o[0],s[i-1]=o[i-2];for(let e=1;e<i-1;e+=1){let t=o[e-1],n=o[e];if(t*n<=0)s[e]=0;else{let r=2*a[e]+a[e-1],i=a[e]+2*a[e-1];s[e]=(r+i)/(r/t+i/n)}}let c=0;for(;c<i-2&&t>r[c+1].x;)c+=1;let l=r[c],u=r[c+1],d=(t-l.x)/a[c],f=d*d,p=f*d,m=2*p-3*f+1,ee=p-2*f+d,h=-2*p+3*f,g=p-f;return m*l.y+ee*a[c]*s[c]+h*u.y+g*a[c]*s[c+1]}function it(e,t,n){if(e.points.length===0)return e.fallback;let r=Math.max(t.length,n.length);for(let t of e.points)r=Math.max(r,t.coords.length);if(r===0)return e.fallback;let i=[];for(let a=0;a<r;a+=1){let r=t[a]??n[a]??null;if(r===null)return e.fallback;i.push(r)}let a=[];for(let t of e.points){let e=[],i=!0;for(let a=0;a<r;a+=1){let r=t.coords[a]??n[a]??null;if(r===null){i=!1;break}e.push(r)}i&&a.push({coords:e,y:t.y})}return a.length===0?e.fallback:r===1?rt(a,i[0]):r===2?at(a,i[0],i[1]):e.fallback}function at(e,t,n){let r=st(e.map(e=>e.coords[0])),i=st(e.map(e=>e.coords[1]));if(r.length===0||i.length===0)return null;let a=new Map;for(let t of e)a.set(ct(t.coords[0],t.coords[1]),t.y);let o=(e,t)=>a.get(ct(e,t))??null,s=(t,n)=>{let r=null,i=1/0;for(let a of e){let e=a.coords[0]-t,o=a.coords[1]-n,s=e*e+o*o;s<i&&(i=s,r=a.y)}return r};if(r.length===1)return rt(i.map(e=>({coords:[e],y:o(r[0],e)??s(r[0],e)??0})),n);if(i.length===1)return rt(r.map(e=>({coords:[e],y:o(e,i[0])??s(e,i[0])??0})),t);let[c,l]=ot(r,t),[u,d]=ot(i,n),f=o(c,u)??s(c,u),p=o(c,d)??s(c,d),m=o(l,u)??s(l,u),ee=o(l,d)??s(l,d);if(f===null||p===null||m===null||ee===null)return null;let h=l===c?0:(t-c)/(l-c),g=d===u?0:(n-u)/(d-u);return f*(1-h)*(1-g)+p*(1-h)*g+m*h*(1-g)+ee*h*g}function ot(e,t){if(t<=e[0])return[e[0],e[1]??e[0]];let n=e.length-1;if(t>=e[n])return[e[n-1]??e[n],e[n]];let r=0;for(;r<n&&t>e[r+1];)r+=1;return[e[r],e[r+1]]}function st(e){let t=[...new Set(e)];return t.sort((e,t)=>e-t),t}function ct(e,t){return`${e}\u0000${t}`}var lt=/^[A-Za-z][A-Za-z0-9_]*$/;function ut(e){return`build`in e}var dt=class{tables=new Map;providers=new Map;constructor(e=[]){for(let t of e)this.add(t)}get size(){return this.tables.size+this.providers.size}get all(){for(let e of[...this.providers.keys()])this.materialize(e);return[...this.tables.values()]}getTable(e){return this.materialize(e)}requireTable(e){let n=this.getTable(e);if(n===void 0)throw new t(`Unknown table "${e}".`);return n}add(e){let n=this.tables.get(e.id)??this.providers.get(e.id);if(n!==void 0){if(n===e)return n;throw new t(`Table "${e.id}" is already registered.`)}if(ut(e)){if(!C(e.id))throw new t(`Table provider id "${e.id}" must use lowercase letters, digits, and hyphens.`);return this.providers.set(e.id,e),e}return ft(e),this.tables.set(e.id,e),e}materialize(e){let n=this.tables.get(e);if(n!==void 0)return n;let r=this.providers.get(e);if(r===void 0)return;let i=r.build();if(ft(i),i.id!==r.id)throw new t(`Table provider "${r.id}" built a table with id "${i.id}".`);return this.providers.delete(e),this.tables.set(e,i),i}};function ft(e){let n=[];C(e.id)||n.push(`id "${e.id}" must use lowercase letters, digits, and hyphens.`),e.title.trim()===``&&n.push(`title must not be empty.`),e.columns.length===0&&n.push(`at least one column is required.`);let r=new Map;for(let[t,i]of e.columns.entries()){let e=`column ${t+1} ("${i.key}")`;if(lt.test(i.key)?r.has(i.key)&&n.push(`${e}: duplicate key.`):n.push(`${e}: key must start with a letter and contain only letters, digits, and underscores.`),r.set(i.key,i),i.label.trim()===``&&n.push(`${e}: label must not be empty.`),i.kind!==void 0&&i.kind!==`text`&&i.kind!==`number`&&i.kind!==`boolean`&&i.kind!==`lookup`&&n.push(`${e}: unknown kind "${i.kind}".`),i.unit!==void 0&&S(i.unit)===null&&x(i.unit)===null&&n.push(`${e}: unknown unit "${i.unit}".`),i.unit!==void 0&&i.kind!==void 0&&(i.kind===`number`?S(i.unit)!==null&&n.push(`${e}: a number column must not have a composite unit.`):i.kind===`lookup`?S(i.unit)===null&&n.push(`${e}: a lookup column must have a composite unit such as "kg/m3@°C".`):n.push(`${e}: a ${i.kind} column must not have a unit.`)),i.standards!==void 0){D(i)||n.push(`${e}: standards are only allowed on a lookup column.`);let t=i.unit===void 0?null:S(i.unit);for(let[r,a]of Object.entries(i.standards))t!==null&&t.axes.includes(r)||n.push(`${e}: standard "${r}" is not one of the column's axes.`),typeof a==`number`&&Number.isFinite(a)||n.push(`${e}: standard "${r}" must be a finite number.`)}}let i=r.get(e.keyColumn);i===void 0?n.push(`key column "${e.keyColumn}" does not exist.`):mt(i)||n.push(`key column "${e.keyColumn}" must be text.`);let a=r.get(e.labelColumn);a===void 0?n.push(`label column "${e.labelColumn}" does not exist.`):mt(a)||n.push(`label column "${e.labelColumn}" must be text.`),e.rows.length===0&&n.push(`at least one row is required.`);let o=new Set;for(let[t,r]of e.rows.entries())n.push(...pt(e,r,`row ${t+1}`,o));if(n.length>0)throw new t(`Invalid table "${e.id}":\n- ${n.join(`
- `)}`)}function pt(e,t,n,r=new Set){let i=[],a=new Map(e.columns.map(e=>[e.key,e]));for(let r of e.columns)Object.hasOwn(t,r.key)||i.push(`${n}: missing column "${r.key}".`);for(let e of Object.keys(t))a.has(e)||i.push(`${n}: unknown column "${e}".`);let o=t[e.keyColumn];typeof o!=`string`||o.trim()===``?i.push(`${n}: key column must contain a non-empty string.`):r.has(o)?i.push(`${n}: duplicate key "${o}".`):r.add(o);for(let r of e.columns){let e=t[r.key];e!=null&&(E(r)?typeof e!=`boolean`&&i.push(`${n}: boolean column "${r.key}" must be true or false.`):D(r)?w(e)===null&&i.push(`${n}: lookup column "${r.key}" must hold samples such as "100@25; 39@844" or a plain number.`):mt(r)?typeof e!=`string`&&i.push(`${n}: text column "${r.key}" must be text.`):typeof e==`number`&&Number.isFinite(e)||i.push(`${n}: numeric column "${r.key}" must be a finite number.`))}return i}function mt(e){return e.kind===void 0?e.unit===void 0:e.kind===`text`}function T(e){return e.kind===void 0?e.unit!==void 0:e.kind===`number`}function E(e){return e.kind===`boolean`}function D(e){return e.kind===`lookup`}function ht(e,t){return e.columns.find(e=>e.key===t)}function O(e,t){let n=t[e.keyColumn];return typeof n==`string`?n:null}function gt(e,t){let n=t[e.labelColumn];return typeof n==`string`&&n.trim()!==``?n:O(e,t)??``}function k(e,t){return e.rows.find(n=>O(e,n)===t)}function A(e,t){if(t===void 0)return!0;let n=e[t];return n!=null&&n!==``}function _t(e){return typeof e==`number`&&Number.isFinite(e)?e:null}function vt(e){return typeof e==`boolean`?e:null}function yt(e){return typeof e==`string`?e:null}function bt(e,t){return`${e}.${t}`}var xt=class{id;title;description;loader;calculatorsById=new Map;tableRegistry=new dt;loadPromise=null;loaded=!1;constructor(e,t,n,r){this.id=e,this.title=t,this.description=n,this.loader=r}get isLoaded(){return this.loaded}get calculators(){return[...this.calculatorsById.values()]}get tables(){return this.tableRegistry.all}addTable(e){return this.tableRegistry.add(e)}getTable(e){return this.tableRegistry.getTable(e)}requireTable(e){return this.tableRegistry.requireTable(e)}add(e){Pe(e);let t=this.calculatorsById.get(e.id);if(t!==void 0){if(t.definition===e)return t;throw Error(`Calculator "${bt(this.id,e.id)}" is already registered.`)}let n={definition:e,categoryId:this.id,globalId:bt(this.id,e.id)};return this.calculatorsById.set(e.id,n),n}upsert(e){Pe(e);let t=this.calculatorsById.get(e.id);if(t!==void 0&&t.definition===e)return t;let n={definition:e,categoryId:this.id,globalId:bt(this.id,e.id)};return this.calculatorsById.set(e.id,n),n}remove(e){return this.calculatorsById.delete(e)}get(e){return this.calculatorsById.get(e)}load(){return this.loaded?Promise.resolve(this.calculators):(this.loadPromise??=this.performLoad(),this.loadPromise)}async performLoad(){try{let e=await this.loader();for(let t of e.tables??[])this.addTable(t);for(let t of e.calculators)this.add(t);return this.loaded=!0,this.calculators}catch(e){throw this.loadPromise=null,e}}},St=class{manifest;categories;constructor(e){this.manifest=e;let t={};for(let[n,r]of Object.entries(e))Ct(n,r),t[n]=new xt(n,r.title,r.description,r.load);this.categories=t}get categoryIds(){return Object.keys(this.manifest)}};function Ct(e,t){if(!C(e))throw Error(`Category id "${e}" must use lowercase letters, digits, and hyphens.`);if(t.title.trim()===``)throw Error(`Category "${e}" must have a title.`)}var wt=`modulepreload`,Tt=function(e,t){return new URL(e,t).href},Et={},Dt=function(e){return e.pathname.endsWith(`.css`)},Ot=function(e,t,n){if(t in e)return e[t];let r=n();if(!r){e[t]=void 0;return}let i=r.then(()=>{e[t]=void 0},n=>{throw e[t]=void 0,n});return e[t]=i,i},j=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e,i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?new URL(import.meta.resolve(e)):new URL(e,import.meta.url)}r=o(t.map(t=>{t=Tt(t,n);let r=s(t),i=Dt(r);return Ot(Et,r.href,()=>{if(e===void 0){e={all:new Set,styles:new Set};let t=document.getElementsByTagName(`link`);for(let n=t.length-1;n>=0;n--){let r=t[n];e.all.add(r.href),r.rel===`stylesheet`&&e.styles.add(r.href)}}if((i?e.styles:e.all).has(r.href))return;let t=document.createElement(`link`);if(t.rel=i?`stylesheet`:wt,i||(t.as=`script`),t.crossOrigin=``,t.href=r.href,a&&t.setAttribute(`nonce`,a),document.head.appendChild(t),i)return new Promise((e,n)=>{let i=a=>{t.removeEventListener(`load`,i),t.removeEventListener(`error`,i),a.type===`error`?n(Error(`Unable to preload CSS for ${r}`)):e(a)};t.addEventListener(`load`,i),t.addEventListener(`error`,i)})})}).filter(e=>e!==void 0))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},kt=new St({electrical:{title:`Electrical`,description:`Everyday electrical calculations.`,load:()=>j(()=>import(`./electrical-DlWOApOZ.js`),__vite__mapDeps([0,1]),import.meta.url)},math:{title:`Math`,description:`Arithmetic primitives and a general expression evaluator.`,load:()=>j(()=>import(`./math-1Ru5Riwx.js`),[],import.meta.url)},geometry:{title:`Geometry`,description:`Circles, spheres, and right-triangle geometry.`,load:()=>j(()=>import(`./geometry-DqNlMqL2.js`),[],import.meta.url)},mechanical:{title:`Mechanical`,description:`Cable tension, stored energy, and other mechanical work.`,load:()=>j(()=>import(`./mechanical-BiiOGNM6.js`),[],import.meta.url)},fluids:{title:`Fluids`,description:`Working-fluid properties and flow through pipes and orifices.`,load:()=>j(()=>import(`./fluids-C0HjWhF_.js`),__vite__mapDeps([2,3]),import.meta.url)},materials:{title:`Materials`,description:`Thermal and bulk properties of solids and liquids, including latent heat and temperature-dependent specific heat.`,load:()=>j(()=>import(`./materials-DjtVTVhz.js`),__vite__mapDeps([4,3]),import.meta.url)},physics:{title:`Physics`,description:`Wave propagation and the speed of light in media.`,load:()=>j(()=>import(`./physics-CrCgzuf4.js`),[],import.meta.url)},spice:{title:`SPICE`,description:`Transient circuit simulations run in the browser.`,load:()=>j(()=>import(`./spice-DmN5KQAc.js`),__vite__mapDeps([5,1]),import.meta.url)},conversions:{title:`Conversions`,description:`Everyday unit conversions between equivalent measures.`,load:()=>j(()=>import(`./conversions-zvz6vIOC.js`),[],import.meta.url)},random:{title:`Random`,description:`UUIDs, random numbers, and random choices.`,load:()=>j(()=>import(`./random-CeKLjyfe.js`),[],import.meta.url)},finance:{title:`Finance`,description:`Currency conversion with live exchange rates.`,load:()=>j(()=>import(`./finance-Bsd8dmaC.js`),[],import.meta.url)},custom:{title:`Custom`,description:`Build your own multistep calculators.`,load:()=>j(()=>import(`./custom-BwOxhEFX.js`),[],import.meta.url),hub:`calc-custom-hub`}}),At=globalThis,jt=At.ShadowRoot&&(At.ShadyCSS===void 0||At.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,Mt=Symbol(),Nt=new WeakMap,Pt=class{constructor(e,t,n){if(this._$cssResult$=!0,n!==Mt)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(jt&&e===void 0){let n=t!==void 0&&t.length===1;n&&(e=Nt.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),n&&Nt.set(t,e))}return e}toString(){return this.cssText}},Ft=e=>new Pt(typeof e==`string`?e:e+``,void 0,Mt),It=(e,t)=>{if(jt)e.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let n of t){let t=document.createElement(`style`),r=At.litNonce;r!==void 0&&t.setAttribute(`nonce`,r),t.textContent=n.cssText,e.appendChild(t)}},Lt=jt?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return Ft(t)})(e):e,{is:Rt,defineProperty:zt,getOwnPropertyDescriptor:Bt,getOwnPropertyNames:Vt,getOwnPropertySymbols:Ht,getPrototypeOf:Ut}=Object,Wt=globalThis,Gt=Wt.trustedTypes,Kt=Gt?Gt.emptyScript:``,qt=Wt.reactiveElementPolyfillSupport,M=(e,t)=>e,Jt={toAttribute(e,t){switch(t){case Boolean:e=e?Kt:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},Yt=(e,t)=>!Rt(e,t),Xt={attribute:!0,type:String,converter:Jt,reflect:!1,useDefault:!1,hasChanged:Yt};Symbol.metadata??=Symbol(`metadata`),Wt.litPropertyMetadata??=new WeakMap;var N=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=Xt){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&zt(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=Bt(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Xt}static _$Ei(){if(this.hasOwnProperty(M(`elementProperties`)))return;let e=Ut(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(M(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(M(`properties`))){let e=this.properties,t=[...Vt(e),...Ht(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(Lt(e))}else e!==void 0&&t.push(Lt(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return It(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?Jt:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?Jt:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??Yt)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};N.elementStyles=[],N.shadowRootOptions={mode:`open`},N[M(`elementProperties`)]=new Map,N[M(`finalized`)]=new Map,qt?.({ReactiveElement:N}),(Wt.reactiveElementVersions??=[]).push(`2.1.2`);var Zt=globalThis,Qt=e=>e,$t=Zt.trustedTypes,en=$t?$t.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,tn=`$lit$`,P=`lit$${Math.random().toFixed(9).slice(2)}$`,nn=`?`+P,rn=`<${nn}>`,F=document,I=()=>F.createComment(``),an=e=>e===null||typeof e!=`object`&&typeof e!=`function`,on=Array.isArray,sn=e=>on(e)||typeof e?.[Symbol.iterator]==`function`,cn=`[ 	
\f\r]`,ln=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,un=/-->/g,dn=/>/g,L=RegExp(`>|${cn}(?:([^\\s"'>=/]+)(${cn}*=${cn}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),fn=/'/g,pn=/"/g,mn=/^(?:script|style|textarea|title)$/i,R=(e=>(t,...n)=>({_$litType$:e,strings:t,values:n}))(1),z=Symbol.for(`lit-noChange`),B=Symbol.for(`lit-nothing`),hn=new WeakMap,V=F.createTreeWalker(F,129);function gn(e,t){if(!on(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return en===void 0?t:en.createHTML(t)}var _n=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=ln;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===ln?c[1]===`!--`?o=un:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=L):(mn.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=L):o=dn:o===L?c[0]===`>`?(o=i??ln,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?L:c[3]===`"`?pn:fn):o===pn||o===fn?o=L:o===un||o===dn?o=ln:(o=L,i=void 0);let d=o===L&&e[t+1].startsWith(`/>`)?` `:``;a+=o===ln?n+rn:l>=0?(r.push(s),n.slice(0,l)+tn+n.slice(l)+P+d):n+P+(l===-2?t:d)}return[gn(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},vn=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=_n(t,n);if(this.el=e.createElement(l,r),V.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=V.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(tn)){let t=u[o++],n=i.getAttribute(e).split(P),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?Sn:r[1]===`?`?Cn:r[1]===`@`?wn:xn}),i.removeAttribute(e)}else e.startsWith(P)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(mn.test(i.tagName)){let e=i.textContent.split(P),t=e.length-1;if(t>0){i.textContent=$t?$t.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],I()),V.nextNode(),c.push({type:2,index:++a});i.append(e[t],I())}}}else if(i.nodeType===8){if(i.data===nn)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(P,e+1))!==-1;)c.push({type:7,index:a}),e+=P.length-1}}a++}}static createElement(e,t){let n=F.createElement(`template`);return n.innerHTML=e,n}};function H(e,t,n=e,r){if(t===z)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=an(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=H(e,i._$AS(e,t.values),i,r)),t}var yn=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??F).importNode(t,!0);V.currentNode=r;let i=V.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new bn(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new Tn(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=V.nextNode(),a++)}return V.currentNode=F,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},bn=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=B,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=H(this,e,t),an(e)?e===B||e==null||e===``?(this._$AH!==B&&this._$AR(),this._$AH=B):e!==this._$AH&&e!==z&&this._(e):e._$litType$===void 0?e.nodeType===void 0?sn(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==B&&an(this._$AH)?this._$AA.nextSibling.data=e:this.T(F.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=vn.createElement(gn(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new yn(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=hn.get(e.strings);return t===void 0&&hn.set(e.strings,t=new vn(e)),t}k(t){on(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(I()),this.O(I()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=Qt(e).nextSibling;Qt(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},xn=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=B,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=B}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=H(this,e,t,0),a=!an(e)||e!==this._$AH&&e!==z,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=H(this,r[n+o],t,o),s===z&&(s=this._$AH[o]),a||=!an(s)||s!==this._$AH[o],s===B?e=B:e!==B&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===B?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},Sn=class extends xn{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===B?void 0:e}},Cn=class extends xn{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==B)}},wn=class extends xn{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=H(this,e,t,0)??B)===z)return;let n=this._$AH,r=e===B&&n!==B||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==B&&(n===B||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},Tn=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){H(this,e)}},En={M:tn,P,A:nn,C:1,L:_n,R:yn,D:sn,V:H,I:bn,H:xn,N:Cn,U:wn,B:Sn,F:Tn},Dn=Zt.litHtmlPolyfillSupport;Dn?.(vn,bn),(Zt.litHtmlVersions??=[]).push(`3.3.3`);var On=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new bn(t.insertBefore(I(),e),e,void 0,n??{})}return i._$AI(e),i},kn=globalThis,U=class extends N{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=On(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return z}};U._$litElement$=!0,U.finalized=!0,kn.litElementHydrateSupport?.({LitElement:U});var An=kn.litElementPolyfillSupport;An?.({LitElement:U}),(kn.litElementVersions??=[]).push(`4.2.2`);var jn=Symbol.for(``),Mn=e=>{if(e?.r===jn)return e?._$litStatic$},Nn=e=>({_$litStatic$:e,r:jn}),Pn=new Map,Fn=(e=>(t,...n)=>{let r=n.length,i,a,o=[],s=[],c,l=0,u=!1;for(;l<r;){for(c=t[l];l<r&&(a=n[l],(i=Mn(a))!==void 0);)c+=i+t[++l],u=!0;l!==r&&s.push(a),o.push(c),l++}if(l===r&&o.push(t[r]),u){let e=o.join(`$$lit$$`);(t=Pn.get(e))===void 0&&(o.raw=o,Pn.set(e,t=o)),n=s}return e(t,...n)})(R),In=`calcurio.bookmarks.v1`,Ln=class{storage;constructor(e){this.storage=e}list(e){return(this.readIndex().byCalculator[e]??[]).map(Hn).sort((e,t)=>t.savedAt.localeCompare(e.savedAt))}save(e,t,n){let r=this.readIndex(),a=r.byCalculator[e]??[];if(a.length>=100)throw new i(`This calculator already has 100 bookmarks. Delete one before saving another.`);let o={id:Wn(),name:Un(t),savedAt:new Date().toISOString(),state:{...n.state},units:{...n.units}},s={...r.byCalculator,[e]:[o,...a]};return this.writeIndex({version:1,byCalculator:s}),Hn(o)}delete(e,t){let n=this.readIndex(),r=n.byCalculator[e]??[];if(!r.some(e=>e.id===t))throw new i(`That bookmark no longer exists.`);let a=r.filter(e=>e.id!==t),o={...n.byCalculator};a.length===0?delete o[e]:o[e]=a,this.writeIndex({version:1,byCalculator:o})}readIndex(){let e;try{e=this.storage.getItem(In)}catch(e){throw new i(`Could not read bookmarks: ${c(e)}`,{cause:e})}if(e===null||e===``)return{version:1,byCalculator:{}};let t;try{t=JSON.parse(e)}catch(e){throw new i(`Bookmark data is not valid JSON and was not changed.`,{cause:e})}return zn(t)}writeIndex(e){try{this.storage.setItem(In,JSON.stringify(e))}catch(e){throw new i(`Could not save bookmarks: ${c(e)}`,{cause:e})}}};function Rn(){try{return globalThis.localStorage??null}catch{return null}}function zn(e){if(!Gn(e))throw W(`Bookmark data must be an object.`);if(e.version!==1)throw W(`Bookmark data has an unsupported version and was not changed.`);let t=e.byCalculator;if(!Gn(t))throw W(`Bookmark data must contain a "byCalculator" object.`);let n={};for(let[e,r]of Object.entries(t)){if(!Array.isArray(r))throw W(`Bookmarks for "${e}" must be an array.`);n[e]=r.map((t,n)=>Bn(t,e,n))}return{version:1,byCalculator:n}}function Bn(e,t,n){let r=`Bookmark ${n+1} for "${t}"`;if(!Gn(e))throw W(`${r} must be an object.`);let i=e.id,a=e.name,o=e.savedAt;if(typeof i!=`string`||i===``)throw W(`${r} has no id.`);if(typeof a!=`string`)throw W(`${r} has no name.`);if(typeof o!=`string`||Number.isNaN(Date.parse(o)))throw W(`${r} has no valid saved date.`);let s=e.state;if(!Gn(s))throw W(`${r} has no state object.`);let c={};for(let[e,t]of Object.entries(s))c[e]=Vn(r,e,t);let l=e.units;if(!Gn(l))throw W(`${r} has no units object.`);let u={};for(let[e,t]of Object.entries(l)){if(typeof t!=`string`||!Ae(t))throw W(`${r} has an unknown unit for "${e}".`);u[e]=t}return{id:i,name:a,savedAt:o,state:c,units:u}}function Vn(e,t,n){if(n===null)return null;if(typeof n==`number`){if(!Number.isFinite(n))throw W(`${e} has a non-finite value for "${t}".`);return n}if(typeof n==`string`){if(n===``)throw W(`${e} has an empty value for "${t}".`);if(n.length>200)throw W(`${e} has an overlong value for "${t}".`);return n}throw W(`${e} has an invalid value for "${t}".`)}function Hn(e){return{...e,state:{...e.state},units:{...e.units}}}function Un(e){let t=e.trim();return(t===``?`Untitled`:t).slice(0,80)}function Wn(){if(globalThis.crypto!==void 0&&typeof globalThis.crypto.randomUUID==`function`)return globalThis.crypto.randomUUID();let e=Math.random().toString(36).slice(2,10);return`bookmark-${Date.now().toString(36)}-${e}`}function W(e){return new i(e)}function Gn(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}var Kn=12,qn=0xe8d4a51000,Jn=1e-6,Yn=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;function G(e){if(!Number.isFinite(e))throw RangeError(`Cannot format non-finite value ${e}.`);if(e===0)return`0`;let t=Math.abs(e);if(t>=qn||t<Jn)return Xn(e.toExponential(11));let n=Number(e.toPrecision(Kn));return String(Object.is(n,-0)?0:n)}function K(e){let t=e.trim();if(t===``)return null;let n=t.replace(/,/g,``);if(n===``||!Yn.test(n))throw new s(`"${t}" is not a number.`);let r=Number(n);if(!Number.isFinite(r))throw new s(`"${t}" is out of range.`);return r}function Xn(e){let[t,n]=e.split(`e`);if(t===void 0||n===void 0)return e;let r=t.replace(/(\.\d*?)0+$/,`$1`).replace(/\.$/,``),i=Number(n);return`${r}e${i>=0?`+`:``}${i}`}var Zn=Symbol(`calcurio.missing`);function Qn(e){return Object.freeze({[Zn]:!0,needs:Object.freeze([...e])})}function q(e){if(typeof e!=`object`||!e)return!1;let t=e;return t[Zn]===!0&&Array.isArray(t.needs)}var $n=1e-9,er=1e-9;function J(e,t,n=$n,r=er){if(typeof e!=`number`||typeof t!=`number`)return e===t;if(e===t)return!0;if(!Number.isFinite(e)||!Number.isFinite(t))return!1;let i=Math.abs(e-t);return i<=r||i<=n*Math.max(Math.abs(e),Math.abs(t))}function tr(e){let t=je(e.unit,e.unitOptions),n=e.defaultDisplayUnit;return n!==void 0&&!t.includes(n)&&t.splice(1,0,n),t}function nr(e){return e.defaultDisplayUnit??e.unit}var rr=class t{definition;tables;variablesByName=new Map;choicesByVariable=new Map;displayUnits=new Map;listeners=new Set;derivedNames=[];derivedNameSet=new Set;missingNeeds=new Map;tableSelects=new Map;tableFields=new Map;tableFieldsBySelect=new Map;equivalentGroups=[];configValues;variableList=[];values={};pinnedNames=new Set;forceNames=new Set;order=[];lastTouchedName=null;converged=!0;errorMessages=[];issues=[];runController=null;displayItems=[];constructor(e,t,n){Pe(e),this.definition=e,this.tables=t,this.configValues=sr(e,n),this.variableList=ur(e,this.configValues),this.bindVariables(),this.recompute()}get config(){return{...this.configValues}}get configFields(){return this.definition.config??[]}setConfig(e){let t=sr(this.definition,{...this.configValues,...e});dr(t,this.configValues)||(this.cancelComputeState(),this.clearDisplay(),this.configValues=t,this.variableList=ur(this.definition,t),this.bindVariables(),this.forceNames.clear(),this.recompute())}refreshTables(){this.bindTables(this.tables),this.recompute()}bindVariables(){let e=new Map(this.displayUnits);this.variablesByName.clear(),this.choicesByVariable.clear(),this.displayUnits.clear(),this.tableSelects.clear(),this.tableFields.clear(),this.tableFieldsBySelect.clear();let t={};for(let n of this.variableList)this.variablesByName.set(n.name,n),t[n.name]=Object.hasOwn(this.values,n.name)?this.values[n.name]??null:this.initialValue(n),m(n)&&(this.choicesByVariable.set(n.name,tr(n)),this.displayUnits.set(n.name,e.get(n.name)??nr(n)));this.values=t;for(let e of[...this.pinnedNames])this.variablesByName.has(e)||this.pinnedNames.delete(e);for(let e of[...this.missingNeeds.keys()])this.variablesByName.has(e)||this.missingNeeds.delete(e);this.bindTables(this.tables),this.applyTableDefaults(),this.equivalentGroups=or(this.variableList),this.derivedNames=this.variableList.filter(e=>this.isDerived(e)).map(e=>e.name),this.derivedNameSet=new Set(this.derivedNames),this.order=[...this.derivedNames]}get state(){return{...this.values}}get errors(){return[...this.errorMessages]}get isConverged(){return this.converged}get validationIssues(){return[...this.issues]}get hasComputeState(){return this.definition.computeState!==void 0}get isRunning(){return this.runController!==null}get outputDisplay(){return[...this.displayItems]}canRunComputeState(){return!this.hasComputeState||this.isRunning?!1:this.variableList.every(e=>this.isComputable(e.name)?!0:this.values[e.name]!==null)}get computeOrder(){return[...this.order]}get variables(){return this.variableList}variable(e){return this.requireVariable(e)}isTableSelect(e){return u(this.requireVariable(e))}tableFor(e){return this.tableSelects.get(e)?.table??null}tableChoices(e){let t=this.requireTableSelect(e),n=[];for(let e of t.table.rows){let r=O(t.table,e);r!==null&&A(e,t.variable.filter)&&n.push({key:r,label:gt(t.table,e)})}return n}selectedKey(e){this.requireTableSelect(e);let t=this.values[e];return typeof t==`string`?t:null}canFindClosestRow(e){let t=this.tableSelects.get(e);return t===void 0||this.selectedKey(e)!==null||!this.isEditable(e)?!1:this.hasMatchableField(t)}findClosestRow(e){let t=this.requireTableSelect(e);if(!this.isEditable(e))throw Error(`${t.variable.label} is read-only.`);let n=this.closestRowKey(t);return n===null?null:(this.setSelection(e,n),n)}isComputable(e){return this.derivedNameSet.has(e)}isWired(e){return this.requireVariable(e).takeFrom!==void 0}sourceLabel(e){let t=this.requireVariable(e).takeFrom;return t===void 0?null:this.variablesByName.get(t)?.label??t}graphTargets(e){return this.requireVariable(e),this.variableList.filter(t=>t.name!==e&&m(t)&&this.isComputable(t.name)).map(e=>e.name)}isEditable(e){let t=this.requireVariable(e);return t.takeFrom===void 0&&t.editable!==!1}isPinned(e){return this.requireVariable(e),this.pinnedNames.has(e)}isMissing(e){return this.requireVariable(e),this.missingNeeds.has(e)}missingNeedsFor(e){return this.requireVariable(e),[...this.missingNeeds.get(e)??[]]}missingLabel(e){if(u(this.requireVariable(e)))return this.values[e]===null?`Select a row`:``;let t=this.missingNeedsFor(e);return t.length===0?``:`Needs ${ar(t.map(e=>this.variablesByName.get(e)?.label??e))}`}displayUnitFor(e){let t=this.requireVariable(e);return m(t)?this.displayUnits.get(e)??t.unit:null}unitChoices(e){return m(this.requireVariable(e))?[...this.choicesByVariable.get(e)??[]]:[]}formattedValue(e){let t=this.requireVariable(e);if(u(t)){let t=this.requireTableSelect(e),n=this.selectedKey(e);if(n===null)return``;let r=k(t.table,n);return r===void 0?``:gt(t.table,r)}let n=this.values[e];if(p(t))return typeof n==`string`?n:``;if(typeof n!=`number`)return``;let r=t.unit;return G(y(n,r,this.displayUnitFor(e)??r))}issuesFor(e){return this.requireVariable(e),this.issues.filter(t=>t.variable===e)}setDisplayText(e,t){let n=this.requireVariable(e);if(u(n))return{ok:!1,message:`${n.label} is chosen from the table list.`};if(!this.isEditable(e))return{ok:!1,message:`${n.label} is read-only.`};if(p(n))return this.setValue(e,t),{ok:!0};let r;try{r=K(t)}catch(e){return{ok:!1,message:c(e)}}let i=this.displayUnitFor(e)??n.unit,a=r===null?null:y(r,i,n.unit);return this.prepareTableFieldEdit(e,a),this.prepareEquivalentEdit(e,a),this.setValue(e,a),{ok:!0}}setSelection(e,t){let n=this.requireTableSelect(e);if(!this.isEditable(e))throw Error(`${n.variable.label} is read-only.`);let r=t===``?null:t,i=r===null?void 0:k(n.table,r);if(r!==null&&i===void 0)throw RangeError(`Row "${r}" is not in table "${n.table.id}".`);if(i!==void 0&&!A(i,n.variable.filter))throw RangeError(`Row "${r}" is hidden because "${n.variable.filter}" is not set.`);for(let t of this.tableFieldsBySelect.get(e)??[])this.pinnedNames.delete(t.variable.name);this.setValue(e,r)}setDisplayUnit(e,t){let n=this.requireVariable(e);if(!m(n))throw RangeError(`${n.label} does not have a display unit.`);if(!(this.choicesByVariable.get(e)??[]).includes(t))throw RangeError(`Unit "${t}" is not available for ${n.label}.`);if(b(t)!==b(n.unit))throw RangeError(`Unit "${t}" is not compatible with ${n.label}.`);this.displayUnits.set(e,t),this.emit()}calculate(e){let t=this.requireVariable(e);if(!this.isComputable(e))throw Error(`${t.label} is not computable.`);this.order=[e,...this.order.filter(t=>t!==e)],this.lastTouchedName=e;let n=new Set;for(let[t,r]of Object.entries(this.values))t!==e&&r!==null&&n.add(t);this.pinnedNames=n,this.forceNames.add(e);try{this.recompute()}finally{this.forceNames.delete(e)}}async computeState(){let e=this.definition.computeState;if(e===void 0)throw Error(`${this.definition.title} has no computeState.`);if(this.runController!==null)throw Error(`A calculation is already running.`);let t=new AbortController;this.runController=t,this.clearDisplay(),this.errorMessages=[],this.emit();let n=Object.freeze({...this.values}),r={signal:t.signal,display:(e,n)=>{this.addDisplayItem(t,e,n)}};try{let i=await e(n,r);t.signal.aborted||this.applyComputedState(i)}catch(e){t.signal.aborted||this.addError(`${this.definition.title} failed: ${c(e)}`)}finally{this.runController===t&&(this.runController=null),this.emit()}}cancelComputeState(){this.runController?.abort()}recompute(){this.errorMessages=[],this.missingNeeds.clear(),this.applyTableLookups(),this.applyEquivalents();let e=!1;for(let t=0;t<5;t+=1){let t=!1;for(let e of this.order)!this.pinnedNames.has(e)&&this.isRecalcVariable(e)&&this.shouldAutoUpdate(e)&&(this.computeVariable(e)&&(t=!0),this.applyWires()&&(t=!0),this.forceNames.delete(e));if(this.applyWires()&&(t=!0),!t){e=!0;break}}this.converged=e,e||this.addError(`Calculation did not settle after 5 rounds. Choose one value to calculate and try again.`),this.runValidators(),this.reportConflictingValues(),this.emit()}reset(){this.cancelComputeState(),this.clearDisplay();for(let e of this.variableList)this.values[e.name]=this.initialValue(e),m(e)&&this.displayUnits.set(e.name,nr(e));this.pinnedNames=new Set,this.forceNames.clear(),this.applyTableDefaults(),this.order=[...this.derivedNames],this.lastTouchedName=null,this.recompute()}loadState(e,t,n){let i=n?.includeDerived!==!1;this.assertValidState(e,i),this.cancelComputeState(),this.clearDisplay();let a=new Map;for(let e of this.variableList)m(e)&&a.set(e.name,nr(e));if(t!==void 0)for(let[e,n]of Object.entries(t)){let t=this.variablesByName.get(e);if(t===void 0)throw new r(`Saved state has unknown variable "${e}".`);if(!m(t))throw new r(`Saved unit for "${e}" is not valid for this variable.`);if(b(n)!==b(t.unit))throw new r(`Saved unit "${n}" does not match ${t.label}.`);a.set(e,n)}let o={};for(let e of this.variableList)o[e.name]=this.initialValue(e);for(let[t,n]of Object.entries(e))(i||this.isEditable(t))&&(o[t]=n);this.values=o,this.displayUnits.clear();for(let[e,t]of a)this.displayUnits.set(e,t);this.pinnedNames=new Set(Object.entries(this.values).filter(([e,t])=>t!==null&&(i||this.isEditable(e))).map(([e])=>e)),this.forceNames.clear(),this.order=[...this.derivedNames],this.lastTouchedName=null,this.recompute()}snapshot(){let e={};for(let t of this.variableList)this.isEditable(t.name)&&(e[t.name]=this.values[t.name]??null);return{state:e,units:Object.fromEntries(this.displayUnits)}}beginSample(e,n){this.requireVariable(e);let r=this.requireVariable(n);if(e===n)throw RangeError(`A plot needs two different variables.`);if(!this.isComputable(n))throw RangeError(`${r.label} is not computable.`);let i=new t(this.definition,this.tables);i.values={...this.values},i.pinnedNames=new Set(this.pinnedNames),i.pinnedNames.add(e),i.pinnedNames.delete(n),i.order=[...this.order],i.missingNeeds.clear(),i.errorMessages=[],i.issues=[],i.converged=!0;let a=!1;return{axis:e,target:n,sample(t){if(a)throw Error(`This plot session has already stopped.`);if(!Number.isFinite(t))return null;i.values[e]=t,i.pinnedNames.add(e),i.missingNeeds.delete(e),i.recompute();let r=i.values[n];return typeof r==`number`?r:null},stop(){a=!0}}}subscribe(e){return this.listeners.add(e),()=>{this.listeners.delete(e)}}bindTables(t){for(let n of this.variableList){if(!u(n))continue;let r=this.resolveTable(n,t);if(n.filter!==void 0&&ht(r,n.filter)===void 0)throw new e(`${n.label} filters on unknown column "${n.filter}" in table "${r.id}".`);this.tableSelects.set(n.name,{variable:n,table:r})}for(let t of this.variableList){if(!m(t)||!d(t))continue;let n=t.tableSelect,r=t.tableField;if(n===void 0||r===void 0)throw new e(`${t.label} must name both a table select and a column.`);let i=this.tableSelects.get(n);if(i===void 0)throw new e(`${t.label} references unknown table select "${n}".`);let a=ht(i.table,r);if(a===void 0)throw new e(`${t.label} references unknown column "${r}" in table "${i.table.id}".`);if(D(a)){let o=a.unit===void 0?null:S(a.unit);if(o===null)throw new e(`${t.label} references lookup column "${r}" without a composite unit such as "kg/m3@°C".`);if(b(o.unit)!==b(t.unit))throw new e(`${t.label} uses "${t.unit}" but column "${r}" uses "${o.unit}".`);let s=this.lookupAxes(t,r,o.axes,a),c={variable:t,table:i.table,column:a,columnUnit:o.unit,selectName:n,lookup:{axes:s}};this.tableFields.set(t.name,c);let l=this.tableFieldsBySelect.get(n)??[];l.push(c),this.tableFieldsBySelect.set(n,l);continue}if(t.tableAxis!==void 0)throw new e(`${t.label} declares tableAxis but column "${r}" is not a lookup column.`);if(S(a.unit)!==null)throw new e(`${t.label} references column "${r}" with a composite unit but its kind is not "lookup".`);if(!T(a)||a.unit===void 0)throw new e(`${t.label} must reference a numeric column; "${r}" is text.`);if(!Ae(a.unit))throw new e(`${t.label} references column "${r}" with an unknown unit.`);if(b(a.unit)!==b(t.unit))throw new e(`${t.label} uses "${t.unit}" but column "${r}" uses "${a.unit}".`);let o={variable:t,table:i.table,column:a,columnUnit:a.unit,selectName:n};this.tableFields.set(t.name,o);let s=this.tableFieldsBySelect.get(n)??[];s.push(o),this.tableFieldsBySelect.set(n,s)}}applyTableDefaults(){for(let e of this.variableList){if(!u(e))continue;let t=e.default;if(t===void 0||(this.tableFieldsBySelect.get(e.name)??[]).length>0)continue;let n=this.tableSelects.get(e.name);if(n===void 0)continue;let r=k(n.table,t);r!==void 0&&A(r,e.filter)&&(this.values[e.name]=t,this.pinnedNames.add(e.name))}}resolveTable(t,n){if(n===void 0)throw new e(`${t.label} references table "${t.table}", but no table registry was supplied to the runtime.`);let r=n.getTable(t.table);if(r===void 0)throw new e(`${t.label} references unknown table "${t.table}".`);return r}isDerived(e){return e.takeFrom!==void 0||u(e)||e.computable!==void 0?!0:m(e)&&d(e)}initialValue(e){return e.takeFrom!==void 0||u(e)||e.computable!==void 0||m(e)&&d(e)?null:e.default??null}computeVariable(e){let t=this.requireVariable(e);if(u(t))return this.computeTableSelect(t);if(p(t))return this.computeText(e,t);let n=this.tableFields.get(e);return n===void 0?this.computeNumber(e,t):this.computeTableField(e,n)}isTableDerived(e){return u(this.requireVariable(e))||this.tableFields.has(e)}shouldAutoUpdate(e){return this.requireVariable(e).autoUpdate!==!1||this.forceNames.has(e)}isRecalcVariable(e){let t=this.requireVariable(e);return t.takeFrom!==void 0||u(t)?!1:this.tableFields.get(e)===void 0&&t.computable!==void 0}lookupAxes(t,n,r,i){let a=i.standards??{},o=r.map(e=>{let t=a[e];return{variable:null,unit:e,standard:typeof t==`number`?t:null}}),s=new Set;for(let r of f(t)){let i=this.variablesByName.get(r);if(i===void 0||!m(i))throw new e(`${t.label} names unknown numeric tableAxis "${r}".`);let a=b(i.unit),c=o.findIndex((e,t)=>!s.has(t)&&b(e.unit)===a);if(c===-1)throw new e(`${t.label} axis "${r}" uses "${i.unit}" but column "${n}" has no matching axis.`);s.add(c),o[c]={...o[c],variable:r}}for(let r of o)if(r.variable===null&&r.standard===null)throw new e(`${t.label} does not supply axis "${r.unit}" of column "${n}" and the column declares no standard for it.`);return o}lookupQuery(e,t){let n=[],r=[];for(let i of e.lookup?.axes??[]){r.push(i.standard);let e=i.variable,a=e===null?void 0:this.values[e],o=e===null?void 0:this.variablesByName.get(e);!t&&typeof a==`number`&&Number.isFinite(a)&&o!==void 0&&m(o)?n.push(y(a,o.unit,i.unit)):n.push(null)}return{coords:n,standards:r}}applyTableLookups(){for(let e=0;e<5;e+=1){let e=!1;for(let t of this.order)!this.pinnedNames.has(t)&&this.isTableDerived(t)&&this.shouldAutoUpdate(t)&&this.computeVariable(t)&&(e=!0);if(!e)break}}applyEquivalents(){for(let e of this.equivalentGroups){let t,n=0;for(let r of e){let e=this.values[r],i=this.variablesByName.get(r);typeof e==`number`&&Number.isFinite(e)&&i!==void 0&&m(i)&&(n+=1,t=i)}if(n!==1||t===void 0)continue;let r=this.values[t.name];if(typeof r==`number`&&Number.isFinite(r))for(let[e,n]of Object.entries(t.equivalent??{})){if(e===t.name||this.pinnedNames.has(e))continue;let i=this.variablesByName.get(e);if(i===void 0||!this.shouldAutoUpdate(e))continue;let a;try{a=n(r)}catch(e){this.addError(`${t.label} could not convert to ${i.label}: ${c(e)}`);continue}if(!Number.isFinite(a))continue;let o=this.values[e]??null;typeof o==`number`&&J(o,a)||(this.values[e]=a,this.missingNeeds.delete(e))}}}applyWires(){let e=!1;for(let t of this.variableList){let n=t.takeFrom;if(n===void 0)continue;let r=this.variablesByName.get(n);if(r===void 0||!this.shouldAutoUpdate(t.name))continue;let i=fr(r,this.values[n]??null,t);J(this.values[t.name]??null,i)||(this.values[t.name]=i,this.missingNeeds.delete(t.name),e=!0)}return e}computeNumber(e,t){let n=t.computable;if(n===void 0)return!1;let r;try{r=n(Object.freeze({...this.values}))}catch(e){return this.addError(`${t.label} failed: ${c(e)}`),!1}if(_(r))return!1;let i;if(q(r))this.missingNeeds.set(e,[...r.needs]),i=null;else if(typeof r!=`number`||!Number.isFinite(r))return this.addError(`${t.label} produced a non-finite value.`),!1;else i=r;return!J(this.values[e]??null,i)&&(this.values[e]=i,t.input!==!1)}computeText(e,t){let n=t.computable;if(n===void 0)return!1;let r;try{r=n(Object.freeze({...this.values}))}catch(e){return this.addError(`${t.label} failed: ${c(e)}`),!1}if(_(r))return!1;let i;if(q(r))this.missingNeeds.set(e,[...r.needs]),i=null;else if(typeof r!=`string`)return this.addError(`${t.label} produced a non-text value.`),!1;else i=r;return(this.values[e]??null)!==i&&(this.values[e]=i,t.input!==!1)}computeTableSelect(e){let t=this.tableSelects.get(e.name);if(t===void 0)return!1;let n=this.deriveSelectionKey(t);return(this.values[e.name]??null)!==n&&(this.values[e.name]=n,this.missingNeeds.delete(e.name),e.input!==!1)}computeTableField(e,t){let n=this.deriveTableFieldValue(t);return n===null||J(this.values[e]??null,n)?!1:(this.values[e]=n,this.missingNeeds.delete(e),t.variable.input!==!1)}hasMatchableField(e){for(let t of this.tableFieldsBySelect.get(e.variable.name)??[]){let e=this.values[t.variable.name];if(typeof e==`number`&&Number.isFinite(e))return!0}return!1}closestRowKey(e){let t=(this.tableFieldsBySelect.get(e.variable.name)??[]).map(e=>({field:e,value:this.values[e.variable.name]})).filter(e=>typeof e.value==`number`&&Number.isFinite(e.value));if(t.length===0)return null;let n=null,r=1/0;for(let i of e.table.rows){if(!A(i,e.variable.filter))continue;let a=0,o=!0;for(let{field:e,value:n}of t){let t=this.rowFieldValue(e,i);if(t===null){o=!1;break}let r=t-n;a+=r*r}if(!o)continue;let s=O(e.table,i);s!==null&&a<r&&(r=a,n=s)}return n}rowFieldValue(e,t){if(e.lookup!==void 0){let n=w(t[e.column.key]);if(n===null)return null;let{coords:r,standards:i}=this.lookupQuery(e,e.lookup.axes.length>=2),a=it(n,r,i);return a===null?null:y(a,e.columnUnit,e.variable.unit)}let n=_t(t[e.column.key]);return n===null?null:y(n,e.columnUnit,e.variable.unit)}deriveSelectionKey(e){let t=(this.tableFieldsBySelect.get(e.variable.name)??[]).filter(e=>e.lookup===void 0||e.lookup.axes.every(e=>e.variable===null)).map(e=>({field:e,value:this.values[e.variable.name]})).filter(e=>typeof e.value==`number`&&Number.isFinite(e.value));if(t.length===0)return null;let n=e.table.rows.filter(n=>A(n,e.variable.filter)?t.every(({field:e,value:t})=>{let r=this.rowFieldValue(e,n);return r!==null&&J(r,t)}):!1);if(n.length!==1)return null;let[r]=n;return r===void 0?null:O(e.table,r)}deriveTableFieldValue(e){let t=this.tableSelects.get(e.selectName);if(t===void 0)return null;let n=this.selectedKey(e.selectName);if(n===null)return null;let r=k(t.table,n);if(r===void 0)return this.addError(`Row "${n}" is missing from table "${t.table.id}".`),null;if(e.lookup!==void 0){let t=w(r[e.column.key]);if(t===null)return this.addError(`${e.column.label} is empty or malformed for row "${n}".`),null;let{coords:i,standards:a}=this.lookupQuery(e,!1),o=it(t,i,a);return o===null?(this.addError(`${e.column.label} cannot be interpolated for row "${n}".`),null):y(o,e.columnUnit,e.variable.unit)}let i=_t(r[e.column.key]);return i===null?(this.addError(`${e.column.label} is empty for row "${n}".`),null):y(i,e.columnUnit,e.variable.unit)}setValue(e,t){this.values[e]=t,this.pinnedNames.add(e),this.missingNeeds.delete(e),this.lastTouchedName=e,t!==null&&this.resolvePinnedDeadlock(),this.recompute()}prepareTableFieldEdit(e,t){let n=this.tableFields.get(e);if(n!==void 0&&(this.pinnedNames.delete(n.selectName),t!==null))for(let t of this.tableFieldsBySelect.get(n.selectName)??[])t.variable.name!==e&&(this.values[t.variable.name]=null,this.pinnedNames.delete(t.variable.name),this.missingNeeds.delete(t.variable.name))}prepareEquivalentEdit(e,t){if(t===null)return;let n=this.variablesByName.get(e);if(n===void 0||!m(n)||n.equivalent===void 0)return;let r=this.equivalentGroups.find(t=>t.includes(e));if(r!==void 0)for(let t of r)t!==e&&(this.values[t]=null,this.pinnedNames.delete(t),this.missingNeeds.delete(t))}resolvePinnedDeadlock(){if(this.hasComputeState||!this.derivedNames.every(e=>this.pinnedNames.has(e)))return;let e=this.order.filter(e=>e!==this.lastTouchedName);if(e.length===0)return;let t=e.find(e=>this.canCompute(e))??e[0];t!==void 0&&this.pinnedNames.delete(t)}canCompute(e){let t=this.requireVariable(e);if(t.takeFrom!==void 0)return!1;if(u(t)){let t=this.tableSelects.get(e);return t!==void 0&&this.deriveSelectionKey(t)!==null}if(p(t)){let e=t.computable;if(e===void 0)return!1;try{let t=e(Object.freeze({...this.values}));return!_(t)&&!q(t)&&typeof t==`string`}catch{return!1}}let n=this.tableFields.get(e);if(n!==void 0)return this.deriveTableFieldValue(n)!==null;let r=t.computable;if(r===void 0)return!1;try{let e=r(Object.freeze({...this.values}));return _(e)||q(e)?!1:typeof e==`number`&&Number.isFinite(e)}catch{return!1}}reportConflictingValues(){let e=[];for(let t of this.derivedNames){if(!this.pinnedNames.has(t))continue;let n=this.requireVariable(t),r=this.values[t]??null;r!==null&&this.valueDisagrees(t,n,r)&&e.push(n.label)}if(e.length===0)return;let t=ar(e),n=e.length===1?`does not match the other values.`:`cannot all hold at once.`;this.addError(`${t} ${n} Press Calculate on the value you trust to solve for the rest.`)}valueDisagrees(e,t,n){if(t.takeFrom!==void 0)return!1;if(u(t)){let t=this.tableSelects.get(e);if(t===void 0)return!1;let r=this.deriveSelectionKey(t);return r!==null&&r!==n}if(p(t)){let r=t.computable;if(r===void 0)return!1;let i;try{i=r(Object.freeze({...this.values,[e]:null}))}catch{return!1}return _(i)||q(i)||typeof i!=`string`?!1:n!==i}let r=this.tableFields.get(e);if(r!==void 0){let e=this.deriveTableFieldValue(r);return e===null?!1:typeof n!=`number`||!J(n,e)}let i=t.computable;if(i===void 0)return!1;let a;try{a=i(Object.freeze({...this.values,[e]:null}))}catch{return!1}return _(a)||q(a)||typeof a!=`number`||!Number.isFinite(a)?!1:typeof n!=`number`||!J(n,a)}runValidators(){let e=[];for(let t of this.variableList){let n=t.validate;if(n===void 0)continue;let r;try{r=n(Object.freeze({...this.values}))}catch(n){e.push({variable:t.name,label:t.label,message:`Validation failed: ${c(n)}`});continue}for(let n of ir(r)){let r=n.trim();r!==``&&e.push({variable:t.name,label:t.label,message:r})}}this.issues=e}assertValidState(e,t){if(typeof e!=`object`||!e||Array.isArray(e))throw new r(`Saved state must be an object.`);for(let t of Object.keys(e))if(!this.variablesByName.has(t))throw new r(`Saved state has unknown variable "${t}".`);for(let n of this.variableList){if(!Object.hasOwn(e,n.name)){if(t||this.isEditable(n.name))throw new r(`Saved state is missing variable "${n.name}".`);continue}if(!t&&!this.isEditable(n.name))continue;let i=e[n.name]??null;if(i!==null){if(u(n)){let e=this.tableSelects.get(n.name);if(typeof i!=`string`||e===void 0)throw new r(`Saved value for "${n.name}" is not a valid table row.`);let t=k(e.table,i);if(t===void 0)throw new r(`Saved value for "${n.name}" is not a valid table row.`);if(!A(t,n.filter))throw new r(`Saved value for "${n.name}" is a row hidden by the filter.`)}else if(p(n)){if(typeof i!=`string`)throw new r(`Saved value for "${n.name}" must be text.`)}else if(typeof i!=`number`||!Number.isFinite(i))throw new r(`Saved value for "${n.name}" must be a finite number.`)}}}addError(e){this.errorMessages.includes(e)||this.errorMessages.push(e)}clearDisplay(){let e=this.displayItems;this.displayItems=[];for(let t of e)t.dispose?.()}addDisplayItem(e,t,n){e.signal.aborted||this.runController!==e?n?.():(this.displayItems.push(n===void 0?{content:t}:{content:t,dispose:n}),this.emit())}applyComputedState(e){if(typeof e!=`object`||!e||Array.isArray(e))this.addError(`Calculation returned an invalid state.`);else{for(let[t,n]of Object.entries(e)){if(!this.variablesByName.has(t))continue;let e=n;(e===null||typeof e==`number`||typeof e==`string`)&&(this.values[t]=n)}this.recompute()}}requireVariable(e){let t=this.variablesByName.get(e);if(t===void 0)throw RangeError(`Unknown variable "${e}".`);return t}requireTableSelect(e){let t=this.tableSelects.get(e);if(t===void 0)throw RangeError(`Variable "${e}" is not a table select.`);return t}emit(){for(let e of this.listeners)e()}};function ir(e){return typeof e==`string`?[e]:Array.isArray(e)?e.map(e=>String(e)):[]}function ar(e){return e.length<=1?e.join(``):e.length===2?`${e[0]} and ${e[1]}`:`${e.slice(0,-1).join(`, `)}, and ${e[e.length-1]}`}function or(e){let t=new Map,n=(e,n)=>{let r=t.get(e)??new Set;r.add(n),t.set(e,r)};for(let t of e)if(m(t))for(let e of Object.keys(t.equivalent??{}))n(t.name,e);let r=[],i=new Set;for(let e of t.keys()){if(i.has(e))continue;let n=[],a=[e];for(i.add(e);a.length>0;){let e=a.pop();if(e!==void 0){n.push(e);for(let n of t.get(e)??[])i.has(n)||(i.add(n),a.push(n))}}r.push(n)}return r}function sr(e,t){let n={};for(let r of e.config??[])n[r.name]=cr(r,t?.[r.name]);return n}function cr(e,t){switch(e.kind){case`number`:{let n=typeof e.default==`number`?e.default:0;return lr(typeof t!=`number`||!Number.isFinite(t)?n:t,e)}case`boolean`:return typeof t==`boolean`?t:e.default===!0;case`select`:{let n=e.options??[];if(typeof t==`string`&&n.includes(t))return t;let r=String(e.default??``);return n.includes(r)?r:n[0]??``}case`string`:return typeof t==`string`?t:String(e.default??``)}}function lr(e,t){let n=e;return t.min!==void 0&&n<t.min&&(n=t.min),t.max!==void 0&&n>t.max&&(n=t.max),n}function ur(t,n){let r=t.buildVariables;if(r===void 0)return t.variables;let i;try{i=r(n)}catch(n){throw new e(`${t.title} could not build its variables: ${c(n)}`)}return Fe(i),i}function dr(e,t){let n=new Set([...Object.keys(e),...Object.keys(t)]);for(let r of n)if(e[r]!==t[r])return!1;return!0}function fr(e,t,n){return typeof t==`number`&&m(e)&&m(n)?y(t,e.unit,n.unit):t}var pr=`calcurio.tableRows.v1`,mr=class{storage;constructor(e){this.storage=e}list(e){return(this.readIndex().byTable[e]??[]).map(Ar)}has(e,t){return(this.readIndex().byTable[e.id]??[]).some(n=>n[e.keyColumn]===t)}save(e,t){Sr(e,t,`Custom row`);let n=xr(e,t),r=this.readIndex(),i=r.byTable[e.id]??[],a=i.findIndex(t=>t[e.keyColumn]===n);if(a===-1&&i.length>=500)throw new o(`"${e.title}" already has 500 custom rows. Delete one before adding another.`);let s=[...i],c=Ar(t);return a===-1?s.push(c):s[a]=c,this.writeIndex({version:1,byTable:{...r.byTable,[e.id]:s}}),Ar(t)}delete(e,t){let n=this.readIndex(),r=n.byTable[e.id]??[],i=r.filter(n=>n[e.keyColumn]!==t);if(i.length===r.length)throw new o(`That custom row no longer exists.`);this.writeIndex({version:1,byTable:{...n.byTable,[e.id]:i}})}readIndex(){let e;try{e=this.storage.getItem(pr)}catch(e){throw new o(`Could not read table rows: ${c(e)}`,{cause:e})}if(e===null||e===``)return{version:1,byTable:{}};let t;try{t=JSON.parse(e)}catch(e){throw new o(`Table row data is not valid JSON and was not changed.`,{cause:e})}return vr(t)}writeIndex(e){try{this.storage.setItem(pr,JSON.stringify(e))}catch(e){throw new o(`Could not save table rows: ${c(e)}`,{cause:e})}}};function hr(e,t){if(t.length===0)return e;let n=new Set;for(let t of e.rows){let r=t[e.keyColumn];typeof r==`string`&&n.add(r)}let r=new Map,i=[];for(let a of t){let t=a[e.keyColumn];typeof t==`string`&&t.trim()!==``&&(n.has(t)?r.set(t,a):i.push(a))}if(r.size===0&&i.length===0)return e;let a=e.rows.map(t=>{let n=t[e.keyColumn];return(typeof n==`string`?r.get(n):void 0)??t});return a.push(...i),{...e,rows:a}}function gr(e,t){let n=[`| ${e.columns.map(e=>Cr(e)).join(` | `)} |`,`| ${e.columns.map(()=>`---`).join(` | `)} |`];for(let r of t){let t=e.columns.map(e=>wr(e,r[e.key]));n.push(`| ${t.join(` | `)} |`)}return`${n.join(`
`)}\n`}function _r(e,t){let n=t.split(/\r?\n/).map(e=>e.trim()).filter(e=>e!==``);if(n.length<2)throw Y(`A markdown table needs a header row and a "---" separator row.`);let r=Or(n[0]),i=r.map(t=>Er(e,t)),a=r.filter((e,t)=>i[t]===void 0);if(a.length>0)throw Y(`Unknown column(s): ${a.join(`, `)}.`);let o=i;if(!Dr(n[1]))throw Y(`The second line must be a markdown separator such as "---".`);let s=[],l=[],u=new Set;for(let t=2;t<n.length;t+=1){let r=Or(n[t]),i={};for(let t of e.columns)i[t.key]=null;let a=`Row ${t-1}`;for(let e=0;e<o.length;e+=1){let t=o[e];try{i[t.key]=Tr(t,r[e]??``)}catch(e){l.push(`${a}: ${c(e)}`)}}l.push(...pt(e,i,a,u)),s.push(i)}if(l.length>0)throw Y(`The markdown table is invalid:\n- ${l.join(`
- `)}`);return s}function vr(e){if(!jr(e))throw X(`Table row data must be an object.`);if(e.version!==1)throw X(`Table row data has an unsupported version and was not changed.`);let t=e.byTable;if(!jr(t))throw X(`Table row data must contain a "byTable" object.`);let n={};for(let[e,r]of Object.entries(t)){if(!Array.isArray(r))throw X(`Rows for "${e}" must be an array.`);n[e]=r.map((t,n)=>yr(t,e,n))}return{version:1,byTable:n}}function yr(e,t,n){let r=`Row ${n+1} for table "${t}"`;if(!jr(e))throw X(`${r} must be an object.`);let i={};for(let[t,n]of Object.entries(e))i[t]=br(n,`${r} column "${t}"`);return i}function br(e,t){if(e===null)return null;if(typeof e==`number`){if(!Number.isFinite(e))throw X(`${t} must be a finite number.`);return e}if(typeof e==`boolean`)return e;if(typeof e==`string`){if(e.length>500)throw X(`${t} is too long.`);return e}throw X(`${t} must be text, a number, true/false, or null.`)}function xr(e,t){let n=t[e.keyColumn];if(typeof n!=`string`||n.trim()===``)throw Y(`A custom row needs a non-empty "${e.keyColumn}" value.`);return n}function Sr(e,t,n){let r=pt(e,t,n);if(r.length>0)throw Y(r.join(`
`))}function Cr(e){let t=kr(e.label);return e.unit===void 0?t:`${t} (${kr(String(e.unit))})`}function wr(e,t){return t==null?``:E(e)&&typeof t==`boolean`?t?`yes`:`no`:(T(e)||D(e))&&typeof t==`number`?G(t):kr(String(t))}function Tr(e,t){let n=t.trim();if(E(e)){if(n===``)return null;let e=n.toLowerCase();if([`yes`,`true`,`1`,`y`].includes(e))return!0;if([`no`,`false`,`0`,`n`].includes(e))return!1;throw Y(`"${n}" is not a yes/no value.`)}if(n===``)return null;if(T(e))try{return K(n)}catch(e){throw Y(c(e))}if(D(e)){let e=w(n);if(e===null)throw Y(`"${n}" is not a lookup value.`);return e.points.length===0&&e.fallback!==null?e.fallback:n}return n}function Er(e,t){let n=t.trim();for(let t of e.columns)if(t.key===n||t.label===n||t.unit!==void 0&&`${t.label} (${String(t.unit)})`===n)return t}function Dr(e){let t=Or(e);return t.length>0&&t.every(e=>/^:?-{1,}:?$/.test(e.trim()))}function Or(e){let t=e.trim();t.startsWith(`|`)&&(t=t.slice(1)),t.endsWith(`|`)&&(t=t.slice(0,-1));let n=[],r=``;for(let e=0;e<t.length;e+=1){let i=t[e];if(i===`\\`&&e+1<t.length){let n=t[e+1];r+=n===`|`||n===`\\`?n:`\\${n}`,e+=1}else i===`|`?(n.push(r),r=``):r+=i}return n.push(r),n.map(e=>e.trim())}function kr(e){return e.replace(/\\/g,`\\\\`).replace(/\|/g,`\\|`).replace(/\r?\n/g,` `)}function Ar(e){return{...e}}function Y(e){return new o(e)}function X(e){return new o(e)}function jr(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}var{I:Mr}=En,Nr=e=>e.strings===void 0,Pr={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},Fr=e=>(...t)=>({_$litDirective$:e,values:t}),Ir=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,n){this._$Ct=e,this._$AM=t,this._$Ci=n}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}},Z=(e,t)=>{let n=e._$AN;if(n===void 0)return!1;for(let e of n)e._$AO?.(t,!1),Z(e,t);return!0},Lr=e=>{let t,n;do{if((t=e._$AM)===void 0)break;n=t._$AN,n.delete(e),e=t}while(n?.size===0)},Rr=e=>{for(let t;t=e._$AM;e=t){let n=t._$AN;if(n===void 0)t._$AN=n=new Set;else if(n.has(e))break;n.add(e),Vr(t)}};function zr(e){this._$AN===void 0?this._$AM=e:(Lr(this),this._$AM=e,Rr(this))}function Br(e,t=!1,n=0){let r=this._$AH,i=this._$AN;if(i!==void 0&&i.size!==0){if(t){if(Array.isArray(r))for(let e=n;e<r.length;e++)Z(r[e],!1),Lr(r[e]);else r!=null&&(Z(r,!1),Lr(r))}else Z(this,e)}}var Vr=e=>{e.type==Pr.CHILD&&(e._$AP??=Br,e._$AQ??=zr)},Hr=class extends Ir{constructor(){super(...arguments),this._$AN=void 0}_$AT(e,t,n){super._$AT(e,t,n),Rr(this),this.isConnected=e._$AU}_$AO(e,t=!0){e!==this.isConnected&&(this.isConnected=e,e?this.reconnected?.():this.disconnected?.()),t&&(Z(this,e),Lr(this))}setValue(e){if(Nr(this._$Ct))this._$Ct._$AI(e,this);else{let t=[...this._$Ct._$AH];t[this._$Ci]=e,this._$Ct._$AI(t,this,0)}}disconnected(){}reconnected(){}},Ur=new WeakMap,Q=Fr(class extends Hr{render(e){return B}update(e,[t]){let n=t!==this.G;return n&&this.rt(void 0),(n||this.lt!==this.ct)&&(this.G=t,this.ht=e.options?.host,this.rt(this.ct=e.element)),B}rt(e){if(this.G!==void 0){if(this.isConnected||(e=void 0),typeof this.G==`function`){let t=this.ht??globalThis,n=Ur.get(t);n===void 0&&(n=new WeakMap,Ur.set(t,n)),n.get(this.G)!==void 0&&this.G.call(this.ht,void 0),n.set(this.G,e),e!==void 0&&this.G.call(this.ht,e)}else this.G.value=e}}get lt(){return typeof this.G==`function`?Ur.get(this.ht??globalThis)?.get(this.G):this.G?.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}}),Wr=class extends Ir{constructor(e){if(super(e),this.it=B,e.type!==Pr.CHILD)throw Error(this.constructor.directiveName+`() can only be used in child bindings`)}render(e){if(e===B||e==null)return this._t=void 0,this.it=e;if(e===z)return e;if(typeof e!=`string`)throw Error(this.constructor.directiveName+`() called with a non-string value`);if(e===this.it)return this._t;this.it=e;let t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}};Wr.directiveName=`unsafeHTML`,Wr.resultType=1;var Gr=Fr(Wr);function Kr(e,t,n){let r=`config-${e.name}`;switch(e.kind){case`boolean`:return R`
        <input
          type="checkbox"
          data-testid=${r}
          ?checked=${t===!0}
          @change=${e=>{let t=e.target;t instanceof HTMLInputElement&&n(t.checked)}}
        />
      `;case`select`:return R`
        <select
          class="form-control"
          data-testid=${r}
          @change=${e=>{let t=e.target;t instanceof HTMLSelectElement&&n(t.value.trim())}}
        >
          ${(e.options??[]).map(e=>R`
              <option value=${e} ?selected=${e===t}>
                ${e}
              </option>
            `)}
        </select>
      `;case`string`:return R`
        <input
          class="form-control"
          type="text"
          data-testid=${r}
          .value=${String(t??``)}
          @change=${e=>{let t=e.target;t instanceof HTMLInputElement&&n(t.value.trim())}}
        />
      `;case`number`:return R`
        <input
          class="form-control"
          type="number"
          data-testid=${r}
          .value=${String(t??``)}
          min=${e.min===void 0?B:String(e.min)}
          max=${e.max===void 0?B:String(e.max)}
          step="any"
          @change=${e=>{let t=e.target;if(!(t instanceof HTMLInputElement))return;let r=Number(t.value);Number.isFinite(r)&&n(r)}}
        />
      `}}var qr=0,Jr=class extends U{static properties={runtime:{attribute:!1},globalId:{attribute:!0},bookmarks:{attribute:!1}};filter=``;name=``;status=``;error=``;pendingDeleteId=null;cached=[];titleId=`calc-bookmarks-title-${qr++}`;createRenderRoot(){return this}open(){this.filter=``,this.status=``,this.error=``,this.pendingDeleteId=null,this.name=Yr(),this.refresh(),this.updateComplete.then(()=>{this.showDialog()})}close(){let e=this.dialogElement;e!==null&&(e.open&&typeof e.close==`function`?e.close():e.removeAttribute(`open`))}render(){let e=this.runtime;if(e===void 0)return B;let t=this.bookmarks??null,n=this.visibleBookmarks();return R`
      <dialog
        class="calc-dialog"
        aria-labelledby=${this.titleId}
        @close=${this.handleClose}
      >
        <div class="calc-dialog-body">
          <header class="tool-bar calc-dialog-header">
            <h2 id=${this.titleId}>Bookmarks</h2>
            <span class="spacer"></span>
            <button class="button" type="button" @click=${this.close}>
              Close
            </button>
          </header>

          ${t===null?R`
                  <p class="alert warning">
                    Bookmarks are not available in this browser.
                  </p>
                `:R`
                  <div class="calc-bookmark-save">
                    <label
                      class="calc-field-label"
                      for=${`${this.titleId}-name`}
                    >
                      Save current state
                    </label>
                    <div class="calc-field-input">
                      <input
                        id=${`${this.titleId}-name`}
                        class="form-control calc-bookmark-name"
                        type="text"
                        autocomplete="off"
                        maxlength=${80}
                        .value=${this.name}
                        @input=${this.handleNameInput}
                      />
                      <button
                        class="button"
                        type="button"
                        data-testid="save-bookmark"
                        ?disabled=${!this.canSave(e)}
                        @click=${this.handleSave}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                `}

          <label class="calc-bookmark-filter">
            <span class="calc-field-label">Filter</span>
            <input
              class="form-control"
              type="search"
              autocomplete="off"
              placeholder="Filter by name"
              .value=${this.filter}
              @input=${this.handleFilterInput}
            />
          </label>

          ${this.status===``?B:R`<p class="help calc-status" role="status">
                  ${this.status}
                </p>`}
          ${this.error===``?B:R`<p class="alert danger" role="alert">${this.error}</p>`}

          <ul class="calc-bookmark-list">
            ${n.map(e=>this.renderBookmark(e))}
          </ul>
          ${n.length===0?R`<p class="help">
                  ${this.cached.length===0?`No saved states yet.`:`No bookmarks match this filter.`}
                </p>`:B}
        </div>
      </dialog>
    `}renderBookmark(e){let t=this.pendingDeleteId===e.id;return R`
      <li class="calc-bookmark" data-testid=${`bookmark-${e.id}`}>
        <div class="calc-bookmark-text">
          <strong>${e.name}</strong>
          <span class="help">${Xr(e.savedAt)}</span>
        </div>
        <button
          class="button"
          type="button"
          data-testid=${`load-bookmark-${e.id}`}
          @click=${()=>this.handleLoad(e)}
        >
          Load
        </button>
        <button
          class="button danger"
          type="button"
          data-testid=${`delete-bookmark-${e.id}`}
          @click=${()=>this.handleDelete(e)}
        >
          ${t?`Confirm delete`:`Delete`}
        </button>
      </li>
    `}get dialogElement(){return this.querySelector(`dialog.calc-dialog`)}showDialog(){let e=this.dialogElement;e===null||e.open||(typeof e.showModal==`function`?e.showModal():e.setAttribute(`open`,``))}canSave(e){return Object.values(e.state).some(e=>e!==null)}refresh(){let e=this.bookmarks??null,t=this.globalId??``;if(e===null)this.cached=[],this.requestUpdate();else{try{this.cached=e.list(t)}catch(e){this.cached=[],this.error=c(e)}this.requestUpdate()}}visibleBookmarks(){let e=this.filter.trim().toLowerCase();return e===``?this.cached:this.cached.filter(t=>t.name.toLowerCase().includes(e))}handleNameInput=e=>{let t=e.target;t instanceof HTMLInputElement&&(this.name=t.value)};handleFilterInput=e=>{let t=e.target;t instanceof HTMLInputElement&&(this.filter=t.value,this.requestUpdate())};handleSave=()=>{let e=this.bookmarks??null,t=this.runtime;if(e!==null&&t!==void 0)try{let n=e.save(this.globalId??``,this.name,t.snapshot());this.status=`Saved "${n.name}".`,this.error=``,this.name=Yr(),this.refresh()}catch(e){this.error=c(e),this.requestUpdate()}};handleLoad=e=>{let t=this.runtime;if(t!==void 0){try{t.loadState(e.state,e.units,{includeDerived:!1})}catch(e){this.error=c(e),this.requestUpdate();return}this.dispatchEvent(new CustomEvent(`bookmark-loaded`,{detail:e.name,bubbles:!0,composed:!0})),this.close()}};handleDelete=e=>{if(this.pendingDeleteId!==e.id){this.pendingDeleteId=e.id,this.status=`Press "Confirm delete" to remove this bookmark.`,this.requestUpdate();return}let t=this.bookmarks??null;if(t!==null)try{t.delete(this.globalId??``,e.id),this.pendingDeleteId=null,this.status=`Deleted "${e.name}".`,this.error=``,this.refresh()}catch(e){this.error=c(e),this.requestUpdate()}};handleClose=()=>{this.pendingDeleteId=null,this.status=``,this.requestUpdate()}};function Yr(){return`Calculation ${Xr(new Date().toISOString())}`}function Xr(e){let t=new Date(e);return Number.isNaN(t.getTime())?e:new Intl.DateTimeFormat(void 0,{dateStyle:`medium`,timeStyle:`short`}).format(t)}customElements.define(`calc-bookmarks-dialog`,Jr);var Zr=1e5;function Qr(e){if(e===null||!Number.isFinite(e))return{min:0,max:1};let t=Math.abs(e)===0?1:Math.abs(e);return{min:e-t,max:e+t}}function $r(e,t,n){if(!Number.isFinite(e)||!Number.isFinite(t))throw RangeError(`Axis limits must be finite numbers.`);if(!Number.isInteger(n)||n<1)throw RangeError(`Steps must be a positive whole number.`);if(n>1e5)throw RangeError(`Steps must not exceed ${Zr}.`);if(t<e)throw RangeError(`The maximum must not be less than the minimum.`);if(t===e)return[e];let r=Array(n+1),i=t-e;for(let t=0;t<=n;t+=1)r[t]=e+i*t/n;return r[0]=e,r[n]=t,r}var ei=class{sampler;axisValues;budgetMs;now;index=0;stopped=!1;constructor(e){if(e.axisValues.length===0)throw RangeError(`A sweep needs at least one axis value.`);let t=e.budgetMs??16.666666666666668;if(!Number.isFinite(t)||t<=0)throw RangeError(`The drawing budget must be a positive number.`);this.sampler=e.sampler,this.axisValues=e.axisValues,this.budgetMs=t,this.now=e.now??(()=>performance.now())}get total(){return this.axisValues.length}get progress(){return this.index}nextBatch(){let e=[];if(this.stopped||this.index>=this.axisValues.length)return{points:e,done:!0};let t=this.now()+this.budgetMs;for(;this.index<this.axisValues.length;){let n=this.axisValues[this.index];if(n===void 0)break;let r=this.sampler.sample(n);if(r!==null&&e.push({x:n,y:r}),this.index+=1,this.now()>=t)break}let n=this.index>=this.axisValues.length;return n&&this.sampler.stop(),{points:e,done:n}}stop(){this.stopped=!0,this.sampler.stop()}};function ti(e){let{runtime:t,axisName:n,targetName:r,axisUnit:i}=e;if(!t.graphTargets(n).includes(r))return{ok:!1,message:`Choose a variable to plot on the Y axis.`};let a,o,s;try{a=K(e.minText),o=K(e.maxText),s=K(e.stepsText)}catch(e){return{ok:!1,message:e instanceof Error?e.message:String(e)}}if(a===null||o===null)return{ok:!1,message:`Enter a minimum and a maximum.`};if(s===null)return{ok:!1,message:`Enter a number of steps.`};if(o<=a)return{ok:!1,message:`The maximum must be greater than the minimum.`};let c=$(t,n),l=$(t,r),u;try{u=$r(y(a,i,c),y(o,i,c),s)}catch(e){return{ok:!1,message:e instanceof Error?e.message:String(e)}}return{ok:!0,plan:{axisName:n,targetName:r,axisUnit:i,axisBaseUnit:c,targetBaseUnit:l,axisValues:u}}}function ni(e){return e===null?``:G(e)}function $(e,t){let n=e.variable(t);if(!(`unit`in n))throw RangeError(`${n.label} has no unit.`);return n.unit}var ri=0,ii=`#2563eb`,ai=`rgba(128, 128, 128, 0.25)`,oi=class extends U{static properties={runtime:{attribute:!1}};axisName=``;targetName=``;axisUnit=null;minText=``;maxText=``;stepsText=`100`;running=!1;error=``;status=``;points=[];sweep=null;rafId=null;chart=null;titleId=`calc-graph-title-${ri++}`;createRenderRoot(){return this}disconnectedCallback(){this.stopRun(``),this.destroyChart(),super.disconnectedCallback()}open(e){let t=this.runtime;t!==void 0&&(this.stopRun(``),this.axisName=e,this.axisUnit=t.displayUnitFor(e)??$(t,e),this.targetName=t.graphTargets(e)[0]??``,this.stepsText=`100`,this.applyDefaultRange(),this.points.length=0,this.error=``,this.status=``,this.chart?.update(`none`),this.requestUpdate(),this.updateComplete.then(()=>{this.showDialog()}))}close(){this.stopRun(``);let e=this.dialogElement;e!==null&&(e.open&&typeof e.close==`function`?e.close():e.removeAttribute(`open`))}render(){let e=this.runtime;if(e===void 0||this.axisName===``)return B;let t=e.variable(this.axisName).label,n=e.graphTargets(this.axisName);return R`
      <dialog
        class="calc-dialog calc-graph-dialog"
        aria-labelledby=${this.titleId}
        @close=${this.handleClose}
      >
        <div class="calc-dialog-body">
          <header class="tool-bar calc-dialog-header">
            <h2 id=${this.titleId}>Plot ${t}</h2>
            <span class="spacer"></span>
            <button class="button" type="button" @click=${this.close}>
              Close
            </button>
          </header>

          ${n.length===0?R`
                  <p class="alert warning">
                    This calculator has no other computable value to plot.
                  </p>
                `:this.renderControls(e,n)}
          ${this.error===``?B:R`<p class="alert danger" role="alert">${this.error}</p>`}
          ${this.statusText===``?B:R`<p class="help calc-status" role="status">
                  ${this.statusText}
                </p>`}

          <div class="calc-graph-canvas">
            <canvas data-testid="graph-canvas"></canvas>
          </div>
        </div>
      </dialog>
    `}renderControls(e,t){let n=this.axisUnit??$(e,this.axisName),r=e.unitChoices(this.axisName);return R`
      <div class="calc-graph-settings">
        <label class="calc-field">
          <span class="calc-field-label">Y axis</span>
          <select
            class="form-control"
            data-testid="graph-target"
            ?disabled=${this.running}
            @change=${this.handleTargetChange}
          >
            ${t.map(t=>{let n=e.variable(t).label,r=$(e,t);return R`
                <option value=${t} ?selected=${t===this.targetName}>
                  ${n} (${r})
                </option>
              `})}
          </select>
        </label>

        <label class="calc-field">
          <span class="calc-field-label">X unit</span>
          <select
            class="form-control"
            data-testid="graph-unit"
            ?disabled=${this.running}
            @change=${this.handleUnitChange}
          >
            ${r.map(e=>R`
                <option value=${e} ?selected=${e===n}>
                  ${e}
                </option>
              `)}
          </select>
        </label>

        <label class="calc-field">
          <span class="calc-field-label">Minimum (${n})</span>
          <input
            class="form-control"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            data-testid="graph-min"
            ?disabled=${this.running}
            .value=${this.minText}
            @input=${this.handleMinInput}
          />
        </label>

        <label class="calc-field">
          <span class="calc-field-label">Maximum (${n})</span>
          <input
            class="form-control"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            data-testid="graph-max"
            ?disabled=${this.running}
            .value=${this.maxText}
            @input=${this.handleMaxInput}
          />
        </label>

        <label class="calc-field">
          <span class="calc-field-label">Steps</span>
          <input
            class="form-control"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            data-testid="graph-steps"
            ?disabled=${this.running}
            .value=${this.stepsText}
            @input=${this.handleStepsInput}
          />
        </label>
      </div>

      <div class="calc-graph-actions">
        <button
          class="button"
          type="button"
          data-testid="graph-run"
          ?disabled=${this.running}
          @click=${this.handleRun}
        >
          Plot
        </button>
        <button
          class="button danger"
          type="button"
          data-testid="graph-stop"
          ?disabled=${!this.running}
          @click=${this.handleStop}
        >
          Stop
        </button>
      </div>
    `}get statusText(){return this.running&&this.sweep!==null?`Plotting ${this.sweep.progress} of ${this.sweep.total} points…`:this.status===``?this.points.length>0?`Plotted ${this.points.length} points.`:``:this.status}get dialogElement(){return this.querySelector(`dialog.calc-graph-dialog`)}showDialog(){let e=this.dialogElement;e===null||e.open||(typeof e.showModal==`function`?e.showModal():e.setAttribute(`open`,``))}applyDefaultRange(){let e=this.runtime,t=this.axisUnit;if(e===void 0||t===null){this.minText=``,this.maxText=``;return}let n=e.state[this.axisName],r=typeof n==`number`?n:null,i=$(e,this.axisName),a=Qr(r===null?null:y(r,i,t));this.minText=ni(a.min),this.maxText=ni(a.max)}handleTargetChange=e=>{let t=e.target;t instanceof HTMLSelectElement&&(this.targetName=t.value)};handleUnitChange=e=>{let t=e.target;if(!(t instanceof HTMLSelectElement))return;let n=this.runtime;if(n===void 0||this.axisUnit===null)return;let r=n.unitChoices(this.axisName).find(e=>e===t.value);r!==void 0&&(this.rebaseLimits(this.axisUnit,r),this.axisUnit=r,this.requestUpdate())};rebaseLimits(e,t){let n=this.runtime;if(n===void 0)return;let r=$(n,this.axisName);this.minText=li(this.minText,e,t,r),this.maxText=li(this.maxText,e,t,r)}handleMinInput=e=>{e.target instanceof HTMLInputElement&&(this.minText=e.target.value)};handleMaxInput=e=>{e.target instanceof HTMLInputElement&&(this.maxText=e.target.value)};handleStepsInput=e=>{e.target instanceof HTMLInputElement&&(this.stepsText=e.target.value)};handleRun=()=>{this.runPlot()};handleStop=()=>{this.stopRun(`Plot stopped.`)};handleClose=()=>{this.stopRun(``),this.destroyChart(),this.status=``,this.requestUpdate()};async runPlot(){let e=this.runtime,t=this.axisUnit;if(e===void 0||t===null||this.running)return;let n=ti({runtime:e,axisName:this.axisName,targetName:this.targetName,axisUnit:t,minText:this.minText,maxText:this.maxText,stepsText:this.stepsText});n.ok?await this.prepareChart(n.plan)&&this.beginSweep(e,n.plan):(this.error=n.message,this.status=``,this.requestUpdate())}async prepareChart(e){let t=this.querySelector(`canvas[data-testid="graph-canvas"]`);if(t===null||!si(t))return this.error=`Plotting is not available in this browser.`,this.requestUpdate(),!1;this.destroyChart(),this.points.length=0,this.error=``;let n=this.runtime;if(n===void 0)return!1;let r=this.chartConfig(n,e);try{let e=(await j(()=>import(`./auto-QFQF1GRr.js`),[],import.meta.url)).default;this.chart=new e(t,r)}catch(e){return this.error=`Could not start the plot: ${c(e)}`,this.requestUpdate(),!1}return!0}chartConfig(e,t){let n=getComputedStyle(this),r=n.color||`currentColor`,i=n.getPropertyValue(`--accent-color`).trim()||ii,a=e.variable(t.axisName).label,o=e.variable(t.targetName).label;return{type:`line`,data:{datasets:[{data:this.points,borderColor:i,backgroundColor:i,borderWidth:2,pointRadius:0,pointHitRadius:8,tension:0,fill:!1,spanGaps:!0}]},options:{animation:!1,responsive:!0,maintainAspectRatio:!1,parsing:!1,color:r,interaction:{mode:`nearest`,intersect:!1},scales:{x:{type:`linear`,title:{display:!0,text:`${a} (${t.axisUnit})`},grid:{color:ai},ticks:{callback:e=>ci(e,t.axisBaseUnit,t.axisUnit)}},y:{type:`linear`,title:{display:!0,text:`${o} (${t.targetBaseUnit})`},grid:{color:ai},ticks:{callback:e=>ci(e,t.targetBaseUnit,t.targetBaseUnit)}}},plugins:{legend:{display:!1}}}}}beginSweep(e,t){this.points.length=0,this.chart?.update(`none`);let n;try{n=new ei({sampler:e.beginSample(t.axisName,t.targetName),axisValues:t.axisValues})}catch(e){this.error=c(e),this.requestUpdate();return}this.sweep=n,this.running=!0,this.status=``,this.error=``,this.requestUpdate(),this.rafId=requestAnimationFrame(this.tick)}tick=()=>{let e=this.sweep;if(e===null)return;let t;try{let n=e.nextBatch();for(let e of n.points)this.points.push(e);t=n.done}catch(e){this.stopRun(``),this.error=c(e),this.requestUpdate();return}this.chart?.update(`none`),t?(this.sweep=null,this.running=!1,this.rafId=null,this.status=`Plotted ${this.points.length} of ${e.total} points.`,this.requestUpdate()):(this.requestUpdate(),this.rafId=requestAnimationFrame(this.tick))};stopRun(e){this.sweep?.stop(),this.sweep=null,this.cancelAnimation(),this.running&&(this.running=!1,this.status=e,this.requestUpdate())}cancelAnimation(){this.rafId!==null&&(cancelAnimationFrame(this.rafId),this.rafId=null)}destroyChart(){this.chart?.destroy(),this.chart=null}};function si(e){try{return e.getContext(`2d`)!==null}catch{return!1}}function ci(e,t,n){let r=typeof e==`number`?e:Number(e);return Number.isFinite(r)?G(y(r,t,n)):String(e)}function li(e,t,n,r){let i=e.trim();if(i===``)return e;let a=Number(i.replace(/,/g,``));return Number.isFinite(a)?G(y(y(a,t,r),r,n)):e}customElements.define(`calc-graph-dialog`,oi);var ui=100,di=0,fi=class extends U{static properties={model:{attribute:!1}};onCommit=()=>({ok:!0});onUnitChange=()=>{};onSelectionChange=()=>({ok:!0});onFindClosest=()=>{};onCalculate=()=>{};onPlot=()=>{};localError=``;timer=null;inputId=`calc-value-${di++}`;createRenderRoot(){return this}disconnectedCallback(){this.cancelTimer(),super.disconnectedCallback()}updated(){let e=this.model;if(e===void 0)return;if(e.kind===`tableSelect`){let t=this.querySelect();t!==null&&t.value!==e.value&&(t.value=e.value);return}let t=this.inputElement;t!==null&&document.activeElement!==t&&t.value!==e.value&&(t.value=e.value)}render(){let e=this.model;if(e===void 0)return B;let t=[...e.issues,...this.localError===``?[]:[this.localError]];return R`
      <div
        class="calc-field ${e.highlight===!0?`highlight`:``}"
        data-variable=${e.name}
      >
        <div class="calc-field-header">
          <label class="calc-field-label" for=${this.inputId}>
            ${e.label}
          </label>
          ${this.renderPinnedBadge(e)}
        </div>
        ${e.kind===`tableSelect`?this.renderSelect(e):e.kind===`text`?this.renderTextInput(e):this.renderNumberInput(e)}
        ${e.description===``?B:R`<p class="help calc-field-help">${e.description}</p>`}
        ${t.length===0?B:R`
                <ul class="calc-errors" role="alert">
                  ${t.map(e=>R`<li>${e}</li>`)}
                </ul>
              `}
      </div>
    `}renderPinnedBadge(e){return e.pinned?R`
      <span class="calc-badge" title="Held fixed by the user">input</span>
    `:B}renderNumberInput(e){return R`
      <div class="calc-field-input">
        <input
          id=${this.inputId}
          class="form-control calc-value-input"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          spellcheck="false"
          data-testid=${`value-${e.name}`}
          ?readonly=${!e.editable}
          placeholder=${e.placeholder}
          @input=${this.handleInput}
          @change=${this.handleChange}
          @keydown=${this.handleKeydown}
        />
        <select
          class="form-control calc-unit-select"
          aria-label=${`Unit for ${e.label}`}
          data-testid=${`unit-${e.name}`}
          @change=${this.handleUnitChange}
        >
          ${e.unitChoices.map(t=>R`
              <option value=${t} ?selected=${t===e.unit}>
                ${t}
              </option>
            `)}
        </select>
        ${this.renderCalculateButton(e)} ${this.renderPlotButton(e)}
      </div>
    `}renderTextInput(e){return R`
      <div class="calc-field-input">
        <input
          id=${this.inputId}
          class="form-control calc-value-input"
          type="text"
          autocomplete="off"
          spellcheck="false"
          data-testid=${`value-${e.name}`}
          ?readonly=${!e.editable}
          placeholder=${e.placeholder}
          @input=${this.handleInput}
          @change=${this.handleChange}
          @keydown=${this.handleKeydown}
        />
        ${this.renderCalculateButton(e)}
      </div>
    `}renderSelect(e){return R`
      <div class="calc-field-input">
        <select
          id=${this.inputId}
          class="form-control calc-table-select"
          data-testid=${`value-${e.name}`}
          ?disabled=${!e.editable}
          @change=${this.handleSelectionChange}
        >
          <option value="" ?selected=${e.value===``}>
            — choose a row —
          </option>
          ${e.choices.map(t=>R`
              <option
                value=${t.key}
                ?selected=${t.key===e.value}
              >
                ${t.label}
              </option>
            `)}
        </select>
        ${this.renderCalculateButton(e)}
        ${this.renderFindClosestButton(e)}
      </div>
    `}renderFindClosestButton(e){return e.findClosest===!0?R`
      <button
        class="button calc-find-closest"
        type="button"
        title="Select the row closest to the values already entered"
        data-testid=${`find-closest-${e.name}`}
        @click=${this.handleFindClosest}
      >
        Find closest
      </button>
    `:B}renderCalculateButton(e){return e.computable?R`
      <button
        class="button calc-calculate"
        type="button"
        title=${`Solve for ${e.label}`}
        data-testid=${`calculate-${e.name}`}
        @click=${this.handleCalculate}
      >
        Calculate
      </button>
    `:B}renderPlotButton(e){return e.plottable?R`
      <button
        class="button calc-plot"
        type="button"
        title=${`Plot ${e.label} on the X axis`}
        data-testid=${`plot-${e.name}`}
        @click=${this.handlePlot}
      >
        Plot
      </button>
    `:B}get inputElement(){return this.querySelector(`input.calc-value-input`)}querySelect(){return this.querySelector(`select.calc-table-select`)}handleInput=()=>{this.localError=``,this.cancelTimer(),this.timer=setTimeout(()=>{this.timer=null,this.commitNow()},ui)};handleChange=()=>{this.cancelTimer(),this.commitNow()};handleKeydown=e=>{e.key===`Enter`&&(e.preventDefault(),this.cancelTimer(),this.commitNow())};handleUnitChange=e=>{let t=e.target;if(!(t instanceof HTMLSelectElement))return;let n=this.model;if(n===void 0||n.kind!==`number`)return;let r=n.unitChoices.find(e=>e===t.value);r!==void 0&&this.onUnitChange(r)};handleSelectionChange=e=>{let t=e.target;if(!(t instanceof HTMLSelectElement))return;this.localError=``;let n=this.onSelectionChange(t.value);n.ok||(this.localError=n.message??`That row cannot be selected.`),this.requestUpdate()};handleFindClosest=()=>{this.localError=``,this.onFindClosest()};handleCalculate=()=>{this.cancelTimer();let e=this.model;e!==void 0&&(e.kind===`tableSelect`||!e.editable||this.commitNow())&&this.onCalculate()};handlePlot=()=>{this.cancelTimer(),this.commitNow()&&this.onPlot()};commitNow(){let e=this.inputElement;if(e===null)return!1;let t=this.onCommit(e.value);return t.ok?(this.localError!==``&&(this.localError=``,this.requestUpdate()),!0):(this.localError=t.message??`Invalid value.`,this.requestUpdate(),!1)}cancelTimer(){this.timer!==null&&(clearTimeout(this.timer),this.timer=null)}};customElements.define(`calc-variable-field`,fi);var pi=4e3,mi=class extends U{static properties={runtime:{attribute:!1},globalId:{attribute:!0},bookmarks:{attribute:!1}};unsubscribe=null;status=``;resetArmed=!1;resetTimer=null;dialog=null;graphDialog=null;outputContainer=null;stringNodes=new Map;createRenderRoot(){return this}connectedCallback(){super.connectedCallback(),this.attachRuntime()}disconnectedCallback(){this.detachRuntime(),this.clearResetTimer(),super.disconnectedCallback()}willUpdate(e){e.has(`runtime`)&&(this.detachRuntime(),this.stringNodes.clear(),this.isConnected&&this.attachRuntime())}updated(){this.syncOutput()}render(){let e=this.runtime;if(e===void 0)return B;let t=e.definition;return R`
      <div class="calc-calculator">
        <h2 class="calc-calculator-title">${t.title}</h2>
        ${t.description===void 0?B:R`<p class="help">${t.description}</p>`}
        ${t.headerHtml===void 0?B:R`<div class="calc-header-html">
                ${Gr(t.headerHtml)}
              </div>`}
        ${this.renderConfig(e)} ${this.renderErrors(e)}
        <div class="calc-fields">
          ${e.variables.filter(e=>e.hidden!==!0).map(t=>this.renderField(e,t))}
        </div>
        <div class="calc-actions">
          <button
            class="button"
            type="button"
            data-testid="reset"
            @click=${this.handleReset}
          >
            ${this.resetArmed?`Confirm reset`:`Reset`}
          </button>
          <button
            class="button"
            type="button"
            data-testid="open-bookmarks"
            ?disabled=${this.bookmarks===null||this.bookmarks===void 0}
            @click=${this.openBookmarks}
          >
            Bookmarks
          </button>
          ${e.hasComputeState?this.renderRunActions(e):B}
        </div>
        ${e.hasComputeState?R`<div class="calc-output" ${Q(this.captureOutput)}></div>`:B}
        ${this.status===``?B:R`<p class="help calc-status" role="status">${this.status}</p>`}
      </div>
      <calc-bookmarks-dialog
        ${Q(this.captureDialog)}
        .runtime=${e}
        .globalId=${this.globalId??``}
        .bookmarks=${this.bookmarks??null}
        @bookmark-loaded=${this.handleBookmarkLoaded}
      ></calc-bookmarks-dialog>
      <calc-graph-dialog
        ${Q(this.captureGraphDialog)}
        .runtime=${e}
      ></calc-graph-dialog>
    `}renderConfig(e){let t=e.configFields;return t.length===0?B:R`
      <div class="calc-config">
        <h3 class="calc-section-title">Settings</h3>
        <div class="calc-config-fields">
          ${t.map(t=>this.renderConfigField(e,t))}
        </div>
      </div>
    `}renderConfigField(e,t){let n=e.config[t.name];return R`
      <label class="calc-config-field">
        <span class="calc-config-label">${t.label}</span>
        ${Kr(t,n,n=>e.setConfig({[t.name]:n}))}
      </label>
      ${t.description===void 0?B:R`<p class="help calc-config-help">${t.description}</p>`}
    `}renderField(e,t){let n=t.name,r=e.hasComputeState,i=r&&e.isComputable(n)&&!u(t),a=e.sourceLabel(n),o={name:n,label:t.label,description:t.description??``,editable:e.isEditable(n)&&!i,computable:e.isComputable(n)&&!r&&!e.isWired(n)&&!(`tableSelect`in t&&t?.tableSelect),pinned:e.isPinned(n),issues:e.issuesFor(n).map(e=>e.message),highlight:a!==null};return u(t)?R`
        <calc-variable-field
          .model=${{...o,kind:`tableSelect`,value:e.selectedKey(n)??``,choices:e.tableChoices(n),findClosest:e.canFindClosestRow(n),computable:!1}}
          .onSelectionChange=${t=>this.selectRow(e,n,t)}
          .onFindClosest=${()=>this.findClosestRow(e,n)}
          .onCalculate=${()=>e.calculate(n)}
        ></calc-variable-field>
      `:p(t)?R`
        <calc-variable-field
          .model=${{...o,kind:`text`,value:e.formattedValue(n),placeholder:e.missingLabel(n)}}
          .onCommit=${t=>e.setDisplayText(n,t)}
          .onCalculate=${()=>e.calculate(n)}
        ></calc-variable-field>
      `:R`
      <calc-variable-field
        .model=${{...o,kind:`number`,value:e.formattedValue(n),placeholder:e.missingLabel(n),unit:e.displayUnitFor(n)??t.unit,unitChoices:e.unitChoices(n),plottable:!r&&e.isEditable(n)&&e.graphTargets(n).length>0}}
        .onCommit=${t=>e.setDisplayText(n,t)}
        .onUnitChange=${t=>e.setDisplayUnit(n,t)}
        .onCalculate=${()=>e.calculate(n)}
        .onPlot=${()=>this.openGraph(n)}
      ></calc-variable-field>
    `}selectRow(e,t,n){try{return e.setSelection(t,n),{ok:!0}}catch(e){return{ok:!1,message:c(e)}}}findClosestRow(e,t){try{e.findClosestRow(t)}catch(e){this.status=`Could not find a row: ${c(e)}`,this.requestUpdate()}}renderErrors(e){return e.errors.length===0?B:R`
      <div class="alert danger calc-errors" role="alert">
        <ul>
          ${e.errors.map(e=>R`<li>${e}</li>`)}
        </ul>
      </div>
    `}renderRunActions(e){let t=e.isRunning;return R`
      <button
        class="button"
        type="button"
        data-testid="run"
        ?disabled=${t||!e.canRunComputeState()}
        @click=${this.handleRun}
      >
        Run simulation
      </button>
      <button
        class="button danger"
        type="button"
        data-testid="cancel"
        ?disabled=${!t}
        @click=${this.handleCancel}
      >
        Cancel
      </button>
    `}syncOutput(){let e=this.outputContainer;if(e===null)return;let t=this.runtime,n=t===void 0?[]:t.outputDisplay;n.length===0&&this.stringNodes.clear();let r=[];for(let e=0;e<n.length;e+=1){let t=n[e];t!==void 0&&r.push(this.nodeFor(t,e))}hi(e,r)||e.replaceChildren(...r)}nodeFor(e,t){if(typeof e.content!=`string`)return e.content;let n=this.stringNodes.get(t);return n===void 0&&(n=document.createElement(`p`),n.className=`calc-output-text`,this.stringNodes.set(t,n)),n.textContent!==e.content&&(n.textContent=e.content),n}captureOutput=e=>{this.outputContainer=e instanceof HTMLElement?e:null};handleRun=()=>{let e=this.runtime;e===void 0||e.isRunning||(this.status=``,e.computeState().catch(e=>{this.status=`Could not run: ${c(e)}`,this.requestUpdate()}))};handleCancel=()=>{this.runtime?.cancelComputeState()};captureDialog=e=>{this.dialog=e instanceof Jr?e:null};captureGraphDialog=e=>{this.graphDialog=e instanceof oi?e:null};openGraph=e=>{this.graphDialog?.open(e)};handleBookmarkLoaded=e=>{let t=e.detail;this.status=`Loaded "${t}".`,this.clearResetTimer(),this.resetArmed=!1,this.requestUpdate()};handleReset=()=>{let e=this.runtime;e!==void 0&&(this.resetArmed?(e.reset(),this.resetArmed=!1,this.clearResetTimer(),this.status=`Calculator reset.`,this.requestUpdate()):(this.resetArmed=!0,this.status=`Press Reset again to clear every value.`,this.clearResetTimer(),this.resetTimer=setTimeout(()=>{this.resetArmed=!1,this.resetTimer=null,this.requestUpdate()},pi),this.requestUpdate()))};openBookmarks=()=>{this.dialog?.open()};attachRuntime(){let e=this.runtime;e!==void 0&&this.unsubscribe===null&&(this.unsubscribe=e.subscribe(()=>{this.requestUpdate()}))}detachRuntime(){this.unsubscribe?.(),this.unsubscribe=null}clearResetTimer(){this.resetTimer!==null&&(clearTimeout(this.resetTimer),this.resetTimer=null)}};function hi(e,t){if(e.childNodes.length!==t.length)return!1;for(let n=0;n<t.length;n+=1)if(e.childNodes[n]!==t[n])return!1;return!0}customElements.define(`calc-calculator`,mi);var gi=0,_i=class extends U{column=null;rowText=``;cell=null;valueUnit=null;axisUnits=[];standards=[];axisTexts=[];error=``;titleId=`calc-lookup-title-${gi++}`;createRenderRoot(){return this}open(e,t,n){this.column=e,this.rowText=n,this.error=``,this.cell=null,this.axisUnits=[],this.standards=[],this.axisTexts=[];let r=e.unit===void 0?null:S(String(e.unit));if(r===null)this.error=`${e.label} has no axis unit to interpolate against.`;else{this.valueUnit=r.unit,this.axisUnits=r.axes;let n=e.standards??{};this.standards=r.axes.map(e=>{let t=n[e];return typeof t==`number`?t:null});let i=w(t);i===null?this.error=`${e.label} is malformed and cannot be interpolated.`:(this.cell=i,this.axisTexts=r.axes.map((e,t)=>{let n=i.points[0]?.coords[t]??this.standards[t]??null;return n===null?``:G(n)}))}this.requestUpdate(),this.updateComplete.then(()=>{this.showDialog()})}close(){let e=this.dialogElement;e!==null&&(e.open&&typeof e.close==`function`?e.close():e.removeAttribute(`open`))}render(){let e=this.column;return e==null?B:R`
      <dialog
        class="calc-dialog calc-lookup-dialog"
        aria-labelledby=${this.titleId}
        @close=${this.handleClose}
      >
        <div class="calc-dialog-body">
          <header class="tool-bar calc-dialog-header">
            <h2 id=${this.titleId}>Look up ${e.label}</h2>
            <span class="spacer"></span>
            <button class="button" type="button" @click=${this.close}>
              Close
            </button>
          </header>

          ${this.rowText===``?B:R`<p class="help">Row ${this.rowText}</p>`}
          ${this.error===``?B:R`<p class="alert danger" role="alert">${this.error}</p>`}
          ${this.error===``?this.renderBody():B}
        </div>
      </dialog>
    `}renderBody(){let e=this.cell;return e===null?B:e.points.length===0?R`
        <p class="help">
          This cell holds a single value at the column's standard point.
        </p>
        ${this.renderResult()}
      `:R`
      ${this.axisUnits.map((e,t)=>R`
          <label class="calc-field">
            <span class="calc-field-label">Axis (${e})</span>
            <input
              class="form-control"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              data-testid=${this.axisUnits.length===1?`lookup-axis`:`lookup-axis-${t}`}
              .value=${this.axisTexts[t]??``}
              @input=${e=>this.handleAxisInput(t,e)}
            />
          </label>
        `)}
      ${this.renderResult()}
      <table class="calc-table-grid calc-lookup-points">
        <thead>
          <tr>
            ${this.axisUnits.map(e=>R`<th scope="col">Axis (${e})</th>`)}
            <th scope="col">
              Value${this.valueUnit===null?``:` (${this.valueUnit})`}
            </th>
          </tr>
        </thead>
        <tbody>
          ${e.points.map(e=>R`
              <tr>
                ${this.axisUnits.map((t,n)=>R`
                    <td>${this.pointCoordText(e,n)}</td>
                  `)}
                <td>${G(e.y)}</td>
              </tr>
            `)}
        </tbody>
      </table>
    `}pointCoordText(e,t){let n=e.coords[t]??this.standards[t]??null;return n===null?`—`:G(n)}renderResult(){let e=this.column,t=this.cell;if(e===null||t===null)return R``;let n=this.valueUnit===null?``:` ${this.valueUnit}`;if(t.points.length===0)return t.fallback===null?R`
          <p class="alert warning">This cell has no value to look up.</p>
        `:R`
        <p class="calc-lookup-result" data-testid="lookup-result" role="status">
          ${e.label}:
          <strong>${G(t.fallback)}${n}</strong>
        </p>
      `;let r=[];for(let e of this.axisTexts)try{r.push(K(e))}catch(e){return R`
          <p class="alert danger" role="alert">${c(e)}</p>
        `}let i=it(t,r,this.standards);return i===null?R`
        <p class="alert warning">That value cannot be interpolated.</p>
      `:R`
      <p class="calc-lookup-result" data-testid="lookup-result" role="status">
        ${e.label}: <strong>${G(i)}${n}</strong>
      </p>
    `}get dialogElement(){return this.querySelector(`dialog.calc-lookup-dialog`)}showDialog(){let e=this.dialogElement;e===null||e.open||(typeof e.showModal==`function`?e.showModal():e.setAttribute(`open`,``))}handleAxisInput=(e,t)=>{if(t.target instanceof HTMLInputElement){let n=[...this.axisTexts];n[e]=t.target.value,this.axisTexts=n,this.requestUpdate()}};handleClose=()=>{this.requestUpdate()}};customElements.define(`calc-lookup-dialog`,_i);var vi=0,yi=class extends U{static properties={table:{attribute:!1}};onSubmit=()=>({ok:!0});mode=`add`;cells={};keyLocked=!1;error=``;titleId=`calc-row-title-${vi++}`;createRenderRoot(){return this}open(e,t){this.mode=e,this.error=``,this.cells={},this.keyLocked=e!==`add`;let n=this.table;if(n!==void 0)for(let e of n.columns)this.cells[e.key]=t===void 0?``:bi(e,t[e.key]);this.requestUpdate(),this.updateComplete.then(()=>{this.showDialog()})}close(){let e=this.dialogElement;e!==null&&(e.open&&typeof e.close==`function`?e.close():e.removeAttribute(`open`))}render(){let e=this.table;return e===void 0?B:R`
      <dialog
        class="calc-dialog calc-row-dialog"
        aria-labelledby=${this.titleId}
        @close=${this.handleClose}
      >
        <div class="calc-dialog-body">
          <header class="tool-bar calc-dialog-header">
            <h2 id=${this.titleId}>${this.heading(e)}</h2>
            <span class="spacer"></span>
            <button class="button" type="button" @click=${this.close}>
              Close
            </button>
          </header>

          ${this.mode===`override`?R`
                  <p class="help">
                    Saving replaces this built-in row in every calculator.
                  </p>
                `:B}
          ${this.error===``?B:R`<p class="alert danger" role="alert">${this.error}</p>`}

          <div class="calc-row-fields">
            ${e.columns.map(t=>this.renderField(e,t))}
          </div>

          <div class="calc-row-actions">
            <button
              class="button"
              type="button"
              data-testid="row-save"
              @click=${this.handleSave}
            >
              Save row
            </button>
          </div>
        </div>
      </dialog>
    `}heading(e){return this.mode===`add`?`Add a row to ${e.title}`:this.mode===`override`?`Override a row in ${e.title}`:`Edit a row in ${e.title}`}renderField(e,t){let n=this.cells[t.key]??``,r=t.unit===void 0?``:` (${t.unit})`,i=t.key===e.keyColumn,a=`row-${t.key}`;return R`
      <label class="calc-field">
        <span class="calc-field-label">${t.label}${r}</span>
        ${E(t)?R`
                <select
                  class="form-control"
                  data-testid=${a}
                  ?disabled=${i&&this.keyLocked}
                  @change=${e=>this.handleInput(t,e)}
                >
                  <option value="" ?selected=${n===``}>— none —</option>
                  <option value="yes" ?selected=${n===`yes`}>yes</option>
                  <option value="no" ?selected=${n===`no`}>no</option>
                </select>
              `:R`
                <input
                  class="form-control"
                  type="text"
                  autocomplete="off"
                  spellcheck="false"
                  data-testid=${a}
                  ?readonly=${i&&this.keyLocked}
                  .value=${n}
                  @input=${e=>this.handleInput(t,e)}
                />
              `}
      </label>
    `}get dialogElement(){return this.querySelector(`dialog.calc-row-dialog`)}showDialog(){let e=this.dialogElement;e===null||e.open||(typeof e.showModal==`function`?e.showModal():e.setAttribute(`open`,``))}handleInput=(e,t)=>{let n=t.target;(n instanceof HTMLInputElement||n instanceof HTMLSelectElement)&&(this.cells={...this.cells,[e.key]:n.value},this.error=``,this.requestUpdate())};handleSave=()=>{let e=this.table;if(e===void 0)return;let t={};for(let n of e.columns)try{t[n.key]=xi(n,this.cells[n.key]??``)}catch(e){this.error=c(e),this.requestUpdate();return}let n=pt(e,t,`Custom row`);if(n.length>0){this.error=n.join(`
`),this.requestUpdate();return}let r=this.onSubmit(t);r.ok?this.close():(this.error=r.message??`That row could not be saved.`,this.requestUpdate())};handleClose=()=>{this.error=``,this.requestUpdate()}};function bi(e,t){return t==null?``:E(e)&&typeof t==`boolean`?t?`yes`:`no`:(T(e)||D(e))&&typeof t==`number`?G(t):String(t)}function xi(e,t){let n=t.trim();if(E(e)){if(n===``)return null;if(n===`yes`)return!0;if(n===`no`)return!1;throw Error(`"${n}" is not a yes/no value.`)}if(n===``)return null;if(T(e))return K(n);if(D(e)){let e=w(n);if(e===null)throw Error(`"${n}" is not a lookup value.`);return e.points.length===0&&e.fallback!==null?e.fallback:n}return n}customElements.define(`calc-table-row-dialog`,yi);var Si=0,Ci=class extends U{static properties={table:{attribute:!1}};onImport=()=>({ok:!0});mode=`export`;text=``;status=``;error=``;titleId=`calc-rows-title-${Si++}`;createRenderRoot(){return this}open(e,t=``){this.mode=e,this.text=t,this.status=``,this.error=``,this.requestUpdate(),this.updateComplete.then(()=>{this.showDialog()})}close(){let e=this.dialogElement;e!==null&&(e.open&&typeof e.close==`function`?e.close():e.removeAttribute(`open`))}render(){let e=this.table;if(e===void 0)return B;let t=this.mode===`export`;return R`
      <dialog
        class="calc-dialog calc-rows-dialog"
        aria-labelledby=${this.titleId}
        @close=${this.handleClose}
      >
        <div class="calc-dialog-body">
          <header class="tool-bar calc-dialog-header">
            <h2 id=${this.titleId}>
              ${t?`Export`:`Import`} custom rows
            </h2>
            <span class="spacer"></span>
            <button class="button" type="button" @click=${this.close}>
              Close
            </button>
          </header>

          <p class="help">
            ${t?`Every custom row for "${e.title}" as a markdown table.`:`Paste a markdown table with the same columns to add or replace custom rows.`}
          </p>

          <textarea
            class="form-control calc-rows-markdown"
            data-testid="rows-markdown"
            rows="12"
            spellcheck="false"
            ?readonly=${t}
            .value=${this.text}
            @input=${this.handleInput}
          ></textarea>

          ${this.error===``?B:R`<p class="alert danger" role="alert">${this.error}</p>`}
          ${this.status===``?B:R`<p class="help calc-status" role="status">
                  ${this.status}
                </p>`}

          <div class="calc-actions">
            ${t?this.renderExportActions(e):this.renderImportActions()}
          </div>
        </div>
      </dialog>
    `}renderExportActions(e){return R`
      <button
        class="button"
        type="button"
        data-testid="copy-markdown"
        @click=${this.handleCopy}
      >
        Copy
      </button>
      <button
        class="button"
        type="button"
        data-testid="download-markdown"
        @click=${()=>this.handleDownload(e)}
      >
        Download file
      </button>
    `}renderImportActions(){return R`
      <button
        class="button"
        type="button"
        data-testid="import-markdown"
        @click=${this.handleImport}
      >
        Import
      </button>
    `}get dialogElement(){return this.querySelector(`dialog.calc-rows-dialog`)}showDialog(){let e=this.dialogElement;e===null||e.open||(typeof e.showModal==`function`?e.showModal():e.setAttribute(`open`,``))}handleInput=e=>{e.target instanceof HTMLTextAreaElement&&(this.text=e.target.value,this.error=``)};handleImport=()=>{let e=this.onImport(this.text);e.ok?(this.error=``,this.status=e.message??`Imported.`,this.requestUpdate()):(this.error=e.message??`That markdown could not be imported.`,this.status=``,this.requestUpdate())};handleCopy=async()=>{let e=navigator.clipboard;if(e!==void 0&&typeof e.writeText==`function`)try{await e.writeText(this.text),this.status=`Copied to the clipboard.`,this.requestUpdate();return}catch{}this.textArea?.select(),this.status=`Press Ctrl+C (or ⌘C) to copy the selected text.`,this.requestUpdate()};handleDownload=e=>{let t=new Blob([this.text],{type:`text/markdown`}),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=`${wi(e.id)}.md`,r.style.display=`none`,document.body.append(r),r.click(),r.remove(),URL.revokeObjectURL(n),this.status=`Downloaded ${wi(e.id)}.md.`,this.requestUpdate()};handleClose=()=>{this.status=``,this.error=``,this.requestUpdate()};get textArea(){return this.querySelector(`textarea`)}};function wi(e){let t=e.replace(/[^a-z0-9-]+/gi,`-`).replace(/^-+|-+$/g,``);return(t===``?`table`:t).slice(0,64)}customElements.define(`calc-table-rows-dialog`,Ci);var Ti=4e3,Ei=class extends U{static properties={table:{attribute:!1},store:{attribute:!1}};onChanged=()=>{};custom=[];loadError=``;pendingDeleteKey=null;deleteTimer=null;lookupDialog=null;rowDialog=null;rowsDialog=null;createRenderRoot(){return this}disconnectedCallback(){this.clearDeleteTimer(),super.disconnectedCallback()}willUpdate(e){(e.has(`table`)||e.has(`store`))&&this.refreshCustom()}render(){let e=this.table;if(e===void 0)return B;let t=hr(e,this.custom),n=new Set;for(let t of this.custom){let r=t[e.keyColumn];typeof r==`string`&&n.add(r)}return R`
      <div class="calc-table">
        <h2 class="calc-calculator-title">${e.title}</h2>
        ${e.description===void 0?B:R`<p class="help">${e.description}</p>`}
        ${this.loadError===``?B:R`<p class="alert danger" role="alert">${this.loadError}</p>`}
        ${this.hasStore?this.renderToolbar():B}
        <div class="calc-table-scroll">
          <table class="calc-table-grid">
            <thead>
              <tr>
                ${e.columns.map(e=>R`
                    <th scope="col">${e.label}${Di(e)}</th>
                  `)}
                ${this.hasStore?R`<th scope="col">Custom</th>`:B}
              </tr>
            </thead>
            <tbody>
              ${t.rows.map(t=>this.renderRow(e,t,n))}
            </tbody>
          </table>
        </div>
        <p class="help">
          ${t.rows.length}
          rows${this.custom.length===0?``:`, ${this.custom.length} custom`}
        </p>
        ${this.renderDialogs(e)}
      </div>
    `}renderToolbar(){return R`
      <div class="calc-actions calc-table-toolbar">
        <button
          class="button"
          type="button"
          data-testid="add-row"
          @click=${()=>this.openRowDialog(`add`)}
        >
          Add row
        </button>
        <button
          class="button"
          type="button"
          data-testid="export-rows"
          @click=${this.openExport}
        >
          Export markdown
        </button>
        <button
          class="button"
          type="button"
          data-testid="import-rows"
          @click=${this.openImport}
        >
          Import markdown
        </button>
      </div>
    `}renderRow(e,t,n){let r=t[e.keyColumn],i=typeof r==`string`&&n.has(r);return R`
      <tr class=${i?`calc-table-custom-row`:``}>
        ${e.columns.map(n=>this.renderCell(e,n,t))}
        ${this.hasStore?R`<td class="calc-table-actions">
                ${this.renderRowActions(e,t,i)}
              </td>`:B}
      </tr>
    `}renderCell(e,t,n){let r=n[t.key];return D(t)&&ki(r)?R`
        <td>
          <span class="truncate max-w-8rem">${Oi(t,r)}</span>
          <button
            class="button calc-table-lookup-button"
            type="button"
            title=${`Look up ${t.label}`}
            data-testid=${`lookup-${t.key}-${n[e.keyColumn]}`}
            @click=${()=>this.openLookup(t,Ai(r),gt(e,n))}
          >
            Look up
          </button>
        </td>
      `:R`<td>${Oi(t,r)}</td>`}renderRowActions(e,t,n){let r=t[e.keyColumn];if(typeof r!=`string`||r===``)return B;if(!n)return R`
        <button
          class="button calc-table-action"
          type="button"
          data-testid=${`override-${r}`}
          @click=${()=>this.openRowDialog(`override`,t)}
        >
          Override
        </button>
      `;let i=this.pendingDeleteKey===r;return R`
      <button
        class="button calc-table-action"
        type="button"
        data-testid=${`edit-${r}`}
        @click=${()=>this.openRowDialog(`edit`,t)}
      >
        Edit
      </button>
      <button
        class="button danger calc-table-action"
        type="button"
        data-testid=${`delete-${r}`}
        @click=${()=>this.handleDelete(r)}
      >
        ${i?`Confirm delete`:`Delete`}
      </button>
    `}renderDialogs(e){return R`
      <calc-lookup-dialog ${Q(this.captureLookupDialog)}></calc-lookup-dialog>
      <calc-table-row-dialog
        ${Q(this.captureRowDialog)}
        .table=${e}
        .onSubmit=${this.handleRowSubmit}
      ></calc-table-row-dialog>
      <calc-table-rows-dialog
        ${Q(this.captureRowsDialog)}
        .table=${e}
        .onImport=${this.handleImport}
      ></calc-table-rows-dialog>
    `}get hasStore(){return this.store!==null&&this.store!==void 0}refreshCustom(){let e=this.table,t=this.store;if(e===void 0||t==null)this.custom=[],this.loadError=``;else try{this.custom=t.list(e.id),this.loadError=``}catch(e){this.custom=[],this.loadError=c(e)}}afterChange(){this.refreshCustom(),this.requestUpdate(),this.onChanged()}openRowDialog(e,t){this.rowDialog?.open(e,t)}openLookup(e,t,n){this.lookupDialog?.open(e,t,n)}openExport(){let e=this.table;e!==void 0&&this.rowsDialog?.open(`export`,gr(e,this.custom))}openImport(){this.rowsDialog?.open(`import`,``)}handleDelete(e){let t=this.table,n=this.store;if(t!==void 0&&n!=null){if(this.pendingDeleteKey!==e)this.pendingDeleteKey=e,this.clearDeleteTimer(),this.deleteTimer=setTimeout(()=>{this.pendingDeleteKey=null,this.deleteTimer=null,this.requestUpdate()},Ti),this.requestUpdate();else{this.clearDeleteTimer(),this.pendingDeleteKey=null;try{n.delete(t,e)}catch(e){this.loadError=c(e),this.requestUpdate();return}this.afterChange()}}}handleRowSubmit=e=>{let t=this.table,n=this.store;if(t===void 0||n==null)return{ok:!1,message:`Custom rows are not available here.`};try{n.save(t,e)}catch(e){return{ok:!1,message:c(e)}}return this.afterChange(),{ok:!0}};handleImport=e=>{let t=this.table,n=this.store;if(t===void 0||n==null)return{ok:!1,message:`Custom rows are not available here.`};let r;try{r=_r(t,e)}catch(e){return{ok:!1,message:c(e)}}if(r.length===0)return{ok:!1,message:`That markdown has no rows to import.`};let i=0;for(let e of r){try{n.save(t,e)}catch(e){return this.afterChange(),{ok:!1,message:`Imported ${i} of ${r.length} rows, then failed: `+c(e)}}i+=1}return this.afterChange(),{ok:!0,message:`Imported ${i} row${i===1?``:`s`}.`}};clearDeleteTimer(){this.deleteTimer!==null&&(clearTimeout(this.deleteTimer),this.deleteTimer=null)}captureLookupDialog=e=>{this.lookupDialog=e instanceof _i?e:null};captureRowDialog=e=>{this.rowDialog=e instanceof yi?e:null};captureRowsDialog=e=>{this.rowsDialog=e instanceof Ci?e:null}};function Di(e){return e.unit===void 0?B:R`<span class="calc-table-unit"> (${e.unit})</span>`}function Oi(e,t){return t==null?`—`:E(e)&&typeof t==`boolean`?t?`yes`:`no`:(T(e)||D(e))&&typeof t==`number`?G(t):String(t)}function ki(e){return typeof e==`number`?Number.isFinite(e):typeof e==`string`&&e.trim()!==``}function Ai(e){return typeof e==`number`?String(e):typeof e==`string`?e:``}customElements.define(`calc-table-view`,Ei);var ji=class extends U{static properties={app:{attribute:!1}};view={kind:`categories`};loadingCategoryId=null;loadError=``;bookmarkStore=null;tableRowStore=null;bookmarksInitialized=!1;runtimes=new Map;createRenderRoot(){return this}connectedCallback(){if(super.connectedCallback(),!this.bookmarksInitialized){this.bookmarksInitialized=!0;let e=Rn();this.bookmarkStore=e===null?null:new Ln(e),this.tableRowStore=e===null?null:new mr(e)}}render(){let e=this.app;return e===void 0?B:R`
      <section class="window calc-widget">
        <header class="tool-bar calc-header">
          ${this.renderBackButton()} ${this.renderHeading(e)}
          <span class="spacer"></span>
          <span class="calc-brand">Calcurio</span>
        </header>
        <div class="calc-body">${this.renderBody(e)}</div>
      </section>
    `}renderHeading(e){return this.view.kind===`categories`?`Calculators`:e.categories[this.view.categoryId]?.title??`Calculators`}renderBackButton(){if(this.view.kind===`categories`)return B;let e=this.view.kind===`category`?`All categories`:`Back`,t=this.view.kind===`category`?{kind:`categories`}:{kind:`category`,categoryId:this.view.categoryId};return R`
      <button
        class="button"
        type="button"
        data-testid="back"
        @click=${()=>this.showView(t)}
      >
        ← ${e}
      </button>
    `}renderBody(e){switch(this.view.kind){case`categories`:return this.renderCategories(e);case`category`:return this.renderCategory(e,this.view.categoryId);case`calculator`:return this.renderCalculator(e,this.view.categoryId,this.view.calculatorId);case`table`:return this.renderTable(e,this.view.categoryId,this.view.tableId)}}renderCategories(e){return R`
      <p class="help">Choose a category to browse its calculators.</p>
      <div class="calc-tiles">${e.categoryIds.map(t=>{let n=e.manifest[t];return n===void 0?B:R`
        <button
          class="card calc-tile"
          type="button"
          data-testid="category-${t}"
          @click=${()=>this.openCategory(t)}
        >
          <strong>${n.title}</strong>
          <span class="help">${n.description}</span>
        </button>
      `})}</div>
    `}renderCategory(e,t){let n=e.categories[t];if(n===void 0)return R`
        <p class="alert danger">That category is not available.</p>
      `;if(this.loadingCategoryId===t)return R`
        <p class="help" data-testid="category-loading">Loading…</p>
      `;if(!n.isLoaded)return R`
        <div class="alert danger" role="alert">
          <p>${this.loadError||`This category has not loaded yet.`}</p>
          <button
            class="button"
            type="button"
            @click=${()=>void this.loadCategory(t)}
          >
            Retry
          </button>
        </div>
      `;let r=e.manifest[t]?.hub;return r===void 0?n.calculators.length===0&&n.tables.length===0?R` <p class="help">Nothing in this category yet.</p> `:R`
      <p class="help">${n.description}</p>
      ${this.renderCalculatorTiles(n)} ${this.renderTableTiles(n)}
    `:R`<p class="help">${n.description}</p>
        ${this.renderHub(e,n,r)}`}renderHub(e,t,n){let r=Nn(n);return Fn`
      <${r}
        .app=${e}
        .handle=${t}
        .openCalculator=${e=>this.openCalculator(t.id,e)}
        .onChanged=${()=>this.requestUpdate()}
      ></${r}>
    `}renderCalculatorTiles(e){return e.calculators.length===0?B:R`
      <div class="calc-tiles">
        ${e.calculators.map(t=>{let n=t.definition.description??``;return R`
            <button
              class="card calc-tile"
              type="button"
              data-testid="calculator-${t.definition.id}"
              @click=${()=>this.openCalculator(e.id,t.definition.id)}
            >
              <strong>${t.definition.title}</strong>
              ${n===``?B:R`<span class="help">${n}</span>`}
            </button>
          `})}
      </div>
    `}renderTableTiles(e){return e.tables.length===0?B:R`
      <h3 class="calc-section-title">Reference tables</h3>
      <div class="calc-tiles">
        ${e.tables.map(t=>R`
            <button
              class="card calc-tile"
              type="button"
              data-testid="table-${t.id}"
              @click=${()=>this.openTable(e.id,t.id)}
            >
              <strong>${t.title}</strong>
              ${t.description===void 0?B:R`<span class="help">${t.description}</span>`}
            </button>
          `)}
      </div>
    `}renderCalculator(e,t,n){let r=e.categories[t],i=r?.get(n);if(r===void 0||i===void 0)return R`
        <p class="alert danger">That calculator is not available.</p>
      `;let a;try{a=this.runtimeFor(r,i)}catch(e){return R`
        <p class="alert danger calc-errors" role="alert">
          ${i.definition.title} could not be loaded:
          ${c(e)}
        </p>
      `}return R`
      <calc-calculator
        .runtime=${a}
        .globalId=${i.globalId}
        .bookmarks=${this.bookmarkStore}
      ></calc-calculator>
    `}renderTable(e,t,n){let r=e.categories[t]?.getTable(n);return r===void 0?R` <p class="alert danger">That table is not available.</p> `:R`
      <calc-table-view
        .table=${r}
        .store=${this.tableRowStore}
        .onChanged=${this.handleTableRowsChanged}
      ></calc-table-view>
    `}handleTableRowsChanged=()=>{for(let e of this.runtimes.values())try{e.runtime.refreshTables()}catch{}this.requestUpdate()};resolverFor(e){let t=this.tableRowStore;return t===null?e:{getTable:n=>{let r=e.getTable(n);if(r!==void 0)try{return hr(r,t.list(n))}catch{return r}}}}runtimeFor(e,t){let n=this.runtimes.get(t.globalId);if(n!==void 0&&n.definition===t.definition)return n.runtime;let r=new rr(t.definition,this.resolverFor(e));return this.runtimes.set(t.globalId,{definition:t.definition,runtime:r}),r}openCategory(e){this.view={kind:`category`,categoryId:e},this.loadError=``,this.requestUpdate(),this.loadCategory(e)}openCalculator(e,t){this.view={kind:`calculator`,categoryId:e,calculatorId:t},this.requestUpdate()}openTable(e,t){this.view={kind:`table`,categoryId:e,tableId:t},this.requestUpdate()}showView(e){this.view=e,this.loadError=``,this.requestUpdate()}async loadCategory(e){let t=this.app?.categories[e];if(!(t===void 0||t.isLoaded)&&this.loadingCategoryId!==e){this.loadingCategoryId=e,this.loadError=``,this.requestUpdate();try{await t.load()}catch(e){this.loadError=`Could not load ${t.title}: ${c(e)}`}finally{this.loadingCategoryId===e&&(this.loadingCategoryId=null),this.requestUpdate()}}}};customElements.define(`calc-app`,ji);function Mi(){`serviceWorker`in navigator&&window.addEventListener(`load`,()=>{let e=new URL(`sw.js`,document.baseURI).href;navigator.serviceWorker.register(e).catch(e=>{console.warn(`Calcurio service worker failed to register.`,e)})})}var Ni=document.querySelector(`calc-app`);if(!(Ni instanceof ji))throw Error(`The page must contain a <calc-app> element.`);Ni.app=kt,Mi();export{c as A,g as C,p as D,u as E,n as O,ke as S,d as T,C as _,U as a,b,j as c,_t as d,O as f,w as g,rt as h,Rn as i,a as k,vt as l,yt as m,q as n,B as o,gt as p,Qn as r,R as s,Kr as t,k as u,y as v,m as w,x,Ae as y};
//# sourceMappingURL=index-C_tsbMhl.js.map