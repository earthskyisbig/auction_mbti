// index.html의 선언적 스키마(FM_FIELDS / IP_AXES)에서 JSON Schema를 생성한다.
// 손으로 쓴 스키마가 코드와 어긋나는 것을 막기 위해 단일 출처에서 파생시킨다.
const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const code=html.match(/<script>([\s\S]*)<\/script>/)[1];
const el=()=>({style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},appendChild(){},
  querySelectorAll:()=>[],innerHTML:'',value:'',textContent:''});
const sb={document:{getElementById:el,querySelectorAll:()=>[],createElement:el,body:{appendChild(){},removeChild(){}},
    documentElement:{_a:{},setAttribute(k,v){this._a[k]=v},getAttribute(k){return this._a[k]||null}}},
  localStorage:{getItem:()=>null,setItem(){},removeItem(){}},location:{search:'',pathname:'/'},
  history:{replaceState(){}},navigator:{},window:{scrollTo(){},matchMedia:()=>({matches:false})},URLSearchParams,console,
  JSON,Math,Date,Object,Array,String,Number,parseInt,parseFloat,isNaN,setTimeout,
  encodeURIComponent,decodeURIComponent,escape,unescape,btoa:s=>s,atob:s=>s};
sb.globalThis=sb; vm.createContext(sb);
vm.runInContext(code+'\n;globalThis.__x={FM_FIELDS,IP_AXES,IP_AXIS_ORDER,fmDefaults,SCHEMA_VERSION};',sb);
const {FM_FIELDS,IP_AXES,IP_AXIS_ORDER,fmDefaults,SCHEMA_VERSION}=sb.__x;

const TYPE={text:'string',money:['integer','null'],int:['integer','null'],ratio:['number','null'],
  select:'string',multiselect:'array'};
const fm={$schema:'https://json-schema.org/draft/2020-12/schema',
  $id:'https://earthskyisbig.github.io/auction_mbti/schema/filter_mode.schema.json',
  title:'FilterMode / SearchPreset (Layer 2)',
  description:'매 검색마다 바뀌는 실제 검색 조건. 향후 auction_item 검색 API·자동검색 파이프라인의 입력 규격.',
  type:'object',
  properties:{
    id:{type:['string','null'],description:'PK'},
    user_id:{type:['string','null'],description:'인증 도입 전에는 null'},
    investor_profile_id:{type:['string','null'],description:'FK → investor_profile.id'},
    schema_version:{type:'integer',const:SCHEMA_VERSION},
    is_saved_preset:{type:'boolean',description:'false=임시 작업본, true=저장된 프리셋'},
    created_at:{type:['string','null'],format:'date-time'},
    updated_at:{type:['string','null'],format:'date-time'}
  },
  required:['schema_version'],
  'x-db-table':'filter_mode'};
const defaults=fmDefaults();
FM_FIELDS.forEach(f=>{
  if(f.key.indexOf('region_')===0) return;               // region_json 으로 합쳐 표현
  const key = f.key==='asset_types' ? 'asset_types_json' : f.key;
  const p={type:TYPE[f.type]||'string',title:f.label,
    'x-db-column':f.db,'x-site-filterable':!!f.site};
  if(f.hint) p.description=f.hint;
  if(f.type==='select') p.enum=f.options.map(o=>o.value);
  if(f.type==='multiselect') p.items={type:'string',enum:f.options.map(o=>o.value)};
  if(f.type==='ratio'){ p.minimum=0; p.maximum=1; p.description=(p.description||'')+' (0~1 비율로 저장, UI는 %)'; }
  if(f.type==='money'||f.type==='int') p.minimum=0;
  if(key in defaults) p.default=defaults[key];
  fm.properties[key]=p;
});
fm.properties.region_json={type:'object',title:'지역','x-db-column':'region_json','x-site-filterable':true,
  properties:{sido:{type:['string','null']},sigungu:{type:'array',items:{type:'string'}},
    scope:{type:'string',enum:['home','metro','nation']}},default:defaults.region_json};

const ip={$schema:'https://json-schema.org/draft/2020-12/schema',
  $id:'https://earthskyisbig.github.io/auction_mbti/schema/investor_profile.schema.json',
  title:'InvestorProfile (Layer 1)',
  description:'잘 바뀌지 않는 투자 체질. 검색값을 담지 않으며, 제외규칙·가중치·추천스타일만 산출한다.',
  type:'object','x-db-table':'investor_profile',
  properties:{
    id:{type:['string','null']},user_id:{type:['string','null']},
    schema_version:{type:'integer',const:SCHEMA_VERSION},
    mbti_code:{type:'string',pattern:'^IP-[SR][AE][CG][LT]$'},
    risk_preferences_json:{type:'object',description:'극별 규칙 합성 결과',
      properties:{exclusions:{type:'array',items:{type:'string'}},
        weights:{type:'object',additionalProperties:{type:'number'}},
        recommend:{type:'array',items:{type:'string'}},
        avoid:{type:'array',items:{type:'string'}},
        asset_bias:{type:'array',items:{type:'string'}}}},
    label:{type:'string'},description:{type:'string'},
    legacy_track:{type:'string',enum:['maemae','gyeongmae'],description:'하위호환: 기존 32유형 콘텐츠 렌더용'},
    legacy_code:{type:'string',description:'예: A-scnr / M-SHRG'},
    answers_json:{type:'object'},
    axis_coverage:{type:'object',description:'축별 측정 신뢰도',
      additionalProperties:{type:'string',enum:['measured','derived','unmeasured']}},
    borderline_axes:{type:'array',items:{type:'string'}},
    created_at:{type:['string','null'],format:'date-time'},
    updated_at:{type:['string','null'],format:'date-time'}
  },
  required:['schema_version','mbti_code'],
  'x-forbidden-keys':['budget_min','budget_max','min_price_min','min_price_max','region_json',
    'asset_types_json','fail_count_min','fail_count_max','area_min_m2','area_max_m2']};
IP_AXIS_ORDER.forEach(id=>{
  const ax=IP_AXES.find(a=>a.id===id);
  const col={RIGHTS:'rights_axis',EVICTION:'eviction_axis',PROFIT:'profit_axis',HORIZON:'horizon_axis'}[id];
  ip.properties[col]={type:'string',title:ax.label,enum:[ax.pole_a.code,ax.pole_b.code],
    'x-db-column':col,
    'x-poles':{[ax.pole_a.code]:ax.pole_a.label,[ax.pole_b.code]:ax.pole_b.label}};
});
const out=process.argv[3];
fs.writeFileSync(out+'/05_filter_mode.schema.json',JSON.stringify(fm,null,2)+'\n');
fs.writeFileSync(out+'/05_investor_profile.schema.json',JSON.stringify(ip,null,2)+'\n');
console.log('FilterMode 속성', Object.keys(fm.properties).length);
console.log('InvestorProfile 속성', Object.keys(ip.properties).length);
