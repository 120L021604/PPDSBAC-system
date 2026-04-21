<template>
  <teleport to="body">
  <div class="anim-root">
    <!-- ══ 开场介绍幕 ══ -->
    <transition name="curtain">
      <div v-if="phase==='intro'" class="intro-stage">
        <canvas class="bg-cv" ref="introCanvas"></canvas>
        <div class="intro-grid"></div>
        <transition name="slide-up" appear>
          <div class="intro-title-wrap" v-if="introStep>=0">
            <div class="intro-en">Privacy-Preserving Decentralized Signature-Based Access Control</div>
            <div class="intro-abbr">
              <span v-for="(c,i) in 'PPDSBAC'" :key="i" class="abbr-char" :style="{animationDelay:(i*90)+'ms'}">{{c}}</span>
            </div>
            <div class="intro-cn">隐私保护去中心化签名访问控制</div>
          </div>
        </transition>
        <div class="intro-features">
          <transition v-for="(f,i) in introFeats" :key="i" name="feat-in">
            <div v-if="introStep>=i+1" class="intro-feat" :style="{borderColor:f.color}">
              <div class="feat-ico-big">{{f.icon}}</div>
              <div class="feat-name" :style="{color:f.color}">{{f.name}}</div>
              <div class="feat-desc">{{f.desc}}</div>
            </div>
          </transition>
        </div>
        <div class="intro-footer">
          <div class="intro-skip" @click="startMain">进入演示 ▶</div>
          <div class="intro-countdown">{{introCountdown}}s 后自动开始</div>
        </div>
      </div>
    </transition>

    <!-- ══ 主演示幕 ══ -->
    <div v-show="phase==='main'" class="main-stage">
      <div class="top-bar">
        <div class="top-left">
          <span class="top-abbr">PPDSBAC</span>
          <span class="top-sep">|</span>
          <span class="top-scene-name">{{sceneObj?.shortLabel??''}}</span>
        </div>
        <div class="top-controls">
          <button class="ctrl-btn" @click="togglePause">{{paused?'▶ 继续':'⏸ 暂停'}}</button>
          <button class="ctrl-btn" @click="goIntro">⟳ 重播</button>
          <button class="ctrl-btn close-btn" @click="$router.back()">← 返回</button>
        </div>
      </div>

      <div class="step-bar">
        <div class="step-track-line"><div class="step-track-fill" :style="{width:pct+'%'}"></div></div>
        <div v-for="(sc,i) in scenes" :key="i" class="step-pill"
             :class="{done:sceneIdx>i,active:sceneIdx===i}" @click="jumpTo(i)">
          <div class="pill-dot"></div>
          <span class="pill-label">{{sc.shortLabel}}</span>
        </div>
      </div>

      <div class="stage-wrap" ref="stageWrap">
        <canvas class="bg-cv" ref="bgCanvas"></canvas>
        <div class="stage-grid"></div>

        <div v-for="e in entities" :key="e.id" class="ent-node"
             :class="{active:aEnts.has(e.id),receiving:rEnts.has(e.id)}"
             :style="{left:e.x+'%',top:e.y+'%','--ec':e.color}">
          <div class="ent-ring r1"></div>
          <div class="ent-ring r2"></div>
          <div class="ent-circle"><span class="ent-ico">{{e.icon}}</span></div>
          <div class="ent-label">{{e.name}}</div>
          <div class="ent-sub">{{e.sub}}</div>
          <transition name="badge-pop">
            <div v-if="eStatus[e.id]" class="ent-badge">{{eStatus[e.id]}}</div>
          </transition>
        </div>

        <svg class="link-svg" :viewBox="`0 0 ${SW} ${SH}`" preserveAspectRatio="none">
          <defs>
            <marker id="m-blue"   markerWidth="10" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M1,1L1,7L10,4z" fill="#4fc3f7"/></marker>
            <marker id="m-green"  markerWidth="10" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M1,1L1,7L10,4z" fill="#69f0ae"/></marker>
            <marker id="m-purple" markerWidth="10" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M1,1L1,7L10,4z" fill="#ce93d8"/></marker>
            <marker id="m-amber"  markerWidth="10" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M1,1L1,7L10,4z" fill="#ffd740"/></marker>
            <marker id="m-red"    markerWidth="10" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M1,1L1,7L10,4z" fill="#ff6b6b"/></marker>
            <filter id="lg"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <line v-for="bl in bgLines" :key="bl.id" :x1="bl.x1" :y1="bl.y1" :x2="bl.x2" :y2="bl.y2"
                stroke="rgba(79,195,247,0.09)" stroke-width="1" stroke-dasharray="8 8"/>
          <path v-for="al in aLines" :key="al.id" :d="al.d" fill="none" :stroke="al.color"
                stroke-width="2.8" filter="url(#lg)"
                :stroke-dasharray="al.len" :stroke-dashoffset="al.off"
                :style="{transition:`stroke-dashoffset ${al.dur}s linear`}"
                :marker-end="`url(#m-${al.ck})`"/>
        </svg>

        <div class="pkt-layer">
          <div v-for="p in pkts" :key="p.id" class="data-pkt"
               :class="{arrive:p.arrive}"
               :style="{left:p.x+'px',top:p.y+'px','--pc':p.color,
                        transition:`left ${p.dur}ms cubic-bezier(.25,.1,.2,1),top ${p.dur}ms cubic-bezier(.25,.1,.2,1)`}">
            <div class="pkt-body">
              <span class="pkt-ico">{{p.icon}}</span>
              <span class="pkt-name">{{p.label}}</span>
            </div>
          </div>
        </div>

        <transition name="focus-fade">
          <div v-if="fbox" class="focus-box"
               :style="{left:fbox.lx+'px',top:fbox.ty+'px',width:fbox.w+'px',height:fbox.h+'px','--fc':fbox.color}">
            <div class="focus-label">{{fbox.label}}</div>
          </div>
        </transition>

        <div class="sub-wrap">
          <transition name="sub-fade" mode="out-in">
            <div class="sub-box" :key="subKey">
              <div class="sub-step">{{sceneObj?.stepTag}}</div>
              <div class="sub-text">{{typed}}</div>
              <transition name="adv-fade">
                <div v-if="showAdv && sceneObj?.adv" class="sub-adv">
                  <span>{{sceneObj.adv.icon}}</span><span>{{sceneObj.adv.text}}</span>
                </div>
              </transition>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
  </teleport>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

// ── phase ─────────────────────────────────────────
const phase = ref('intro')
const paused = ref(false)
const introStep = ref(-1)
const introCountdown = ref(14)
let introCountInterval = null

const introFeats = [
  {icon:'🔗',color:'#4fc3f7',name:'不可链接访问',   desc:'伪名随机生成，请求间无法关联'},
  {icon:'✍️',color:'#ce93d8',name:'不可伪造权限',   desc:'BLS多签名，无私钥无法伪造'},
  {icon:'📦',color:'#ffd740',name:'可聚合权限',     desc:'n个签名压缩为1个密钥'},
  {icon:'⚡',color:'#69f0ae',name:'非交互认证',     desc:'服务提供商可完全离线'},
  {icon:'🔍',color:'#ff6b6b',name:'可追踪溯源',     desc:'追踪机构可还原真实身份'},
  {icon:'⏰',color:'#ffab40',name:'直接撤销',       desc:'时间段绑定，自动过期失效'},
]

// ── entities ──────────────────────────────────────
const entities = [
  {id:'encryptor',icon:'📡',name:'加密者',    sub:'Encryptor', x:7,  y:28, color:'#ffd740'},
  {id:'db',       icon:'🗄️',name:'数据库',    sub:'Database',  x:7,  y:70, color:'#78909c'},
  {id:'ra',       icon:'🏛️',name:'注册机构',  sub:'RA',        x:30, y:14, color:'#4fc3f7'},
  {id:'user',     icon:'👤',name:'用 户',     sub:'User',      x:52, y:46, color:'#69f0ae'},
  {id:'aa1',      icon:'🏢',name:'授权机构 1',sub:'AA₁',       x:76, y:16, color:'#ce93d8'},
  {id:'aa2',      icon:'🏢',name:'授权机构 2',sub:'AA₂',       x:76, y:46, color:'#ce93d8'},
  {id:'aa3',      icon:'🏢',name:'授权机构 3',sub:'AA₃',       x:76, y:76, color:'#ce93d8'},
  {id:'ta',       icon:'🔎',name:'追踪机构',  sub:'TA',        x:93, y:32, color:'#ff6b6b'},
]

const stageWrap = ref(null)
const bgCanvas  = ref(null)
const introCanvas = ref(null)
const SW = ref(1400), SH = ref(680)

function ep(id) {
  const e = entities.find(x=>x.id===id)
  if(!e) return {x:0,y:0}
  return {x:e.x/100*SW.value, y:e.y/100*SH.value}
}

// ── state ─────────────────────────────────────────
const aEnts   = ref(new Set())
const rEnts   = ref(new Set())
const eStatus = reactive({})
const bgLines = ref([])
const aLines  = ref([])
const pkts    = ref([])
const fbox    = ref(null)
const typed   = ref('')
const subKey  = ref(0)
const showAdv = ref(false)
const sceneIdx = ref(0)

let lid=0, pid=0
let timers=[]
function T(fn,ms){const id=setTimeout(fn,ms);timers.push(id);return id}
function clearAll(){timers.forEach(clearTimeout);timers=[]}

// ── scenes ────────────────────────────────────────
const scenes = [
  {
    shortLabel:'系统初始化', stepTag:'Step 1 · 全局初始化',
    caption:'系统生成双线性群公共参数，注册机构（RA）、追踪机构（TA）和各授权机构（AA）独立生成密钥对。授权机构之间无需任何交互，体现方案的去中心化特性。',
    adv:{icon:'🌐',text:'去中心化：多 AA 独立运行，无单点信任'},
    duration:8500,
    act(){
      act_activate(['ra','ta','aa1','aa2','aa3'])
      T(()=>act_pulse('ra'),500)
      T(()=>act_line('ra','aa1','#4fc3f7','blue',1600),800)
      T(()=>act_line('ra','aa2','#4fc3f7','blue',1600),1200)
      T(()=>act_line('ra','aa3','#4fc3f7','blue',1600),1600)
      T(()=>{act_status('aa1','✓ 密钥就绪');act_status('aa2','✓ 密钥就绪');act_status('aa3','✓ 密钥就绪')},3400)
      T(()=>{act_status('ra','✓ 就绪');act_status('ta','✓ 就绪')},3800)
      T(()=>act_focus(ep('aa1'),ep('aa3'),340,500,'各 AA 独立生成密钥对，互不知晓','#ce93d8'),4200)
      T(()=>{fbox.value=null},6500)
      T(()=>{showAdv.value=true},6800)
    }
  },
  {
    shortLabel:'用户注册', stepTag:'Step 2 · 用户注册',
    caption:'用户生成密钥对，向注册机构提交零知识证明（ZK Proof），证明持有私钥而不泄露私钥本身。RA 验证通过后颁发匿名凭证 σ，并将真实身份秘密发送给追踪机构。',
    adv:{icon:'🎭',text:'匿名性：凭证不泄露身份，必要时可由 TA 追踪'},
    duration:12000,
    act(){
      act_activate(['user','ra','ta'])
      T(()=>act_pulse('user'),500)
      T(()=>act_pkt('user','ra','🔏','零知识证明 Π','#69f0ae',2000),700)
      T(()=>{act_status('ra','验证中…');act_pulse('ra');act_receive('ra')},3000)
      T(()=>act_focus(ep('ra'),null,320,240,'RA 验证零知识证明','#4fc3f7'),3400)
      T(()=>{fbox.value=null},5200)
      T(()=>act_pkt('ra','ta','📬','(ID_U, PK_U)','#4fc3f7',1800),5400)
      T(()=>act_pkt('ra','user','🏅','匿名凭证 σ','#ffd740',2000),6600)
      T(()=>{act_status('user','持有凭证 σ');act_status('ra','✓ 已注册');act_pulse('user');act_receive('user')},8900)
      T(()=>act_focus(ep('user'),null,280,230,'用户持匿名凭证，身份对外不可知','#69f0ae'),9300)
      T(()=>{fbox.value=null;showAdv.value=true},11200)
    }
  },
  {
    shortLabel:'服务加密', stepTag:'Step 3 · OSBE 服务加密',
    caption:'加密者将服务数据以关键词 W 和时间段 T 加密，生成密文四元组 CT=(C₁,C₂,C₃,C₄) 上传至数据库。密文与时间段绑定——过期权限将直接无法解密，无需任何机构参与撤销。',
    adv:{icon:'⏰',text:'直接撤销：时间段绑定，过期自动失效'},
    duration:9000,
    act(){
      act_activate(['encryptor','db'])
      T(()=>act_pulse('encryptor'),500)
      T(()=>act_focus(ep('encryptor'),null,360,240,'加密者构造密文 CT = (C₁, C₂, C₃, C₄)','#ffd740'),700)
      T(()=>{fbox.value=null},2800)
      T(()=>act_pkt('encryptor','db','🔐','密文 CT','#ffd740',2200),3000)
      T(()=>{act_status('db','存储密文 CT');act_pulse('db');act_receive('db')},5500)
      T(()=>act_focus(ep('db'),null,300,240,'密文与关键词 W、时间段 T 绑定','#78909c'),5900)
      T(()=>{fbox.value=null;showAdv.value=true},8000)
    }
  },
  {
    shortLabel:'生成伪名', stepTag:'Step 4 · 生成访问伪名',
    caption:'用户为本次访问随机生成新鲜伪名 PU=(g^r, Y_U·Y_TA^r)，r 每次随机选取。不同请求使用不同伪名，即使所有机构联合也无法关联两次请求来自同一用户。',
    adv:{icon:'🔗',text:'不可链接：每次访问伪名不同，防止行为追踪'},
    duration:8500,
    act(){
      act_activate(['user'])
      T(()=>act_pulse('user'),500)
      T(()=>act_focus(ep('user'),null,340,250,'PU = (g^r,  Y_U · Y_TA^r)，r 随机新鲜','#69f0ae'),700)
      T(()=>act_burst('user',['🎭','🎭','🎭','🎭'],'#69f0ae'),1400)
      T(()=>{fbox.value=null},3600)
      T(()=>{act_status('user','新鲜伪名 PU')},3900)
      T(()=>act_focus(ep('user'),null,380,260,'每次伪名随机不同 → 请求间不可关联','#69f0ae'),4300)
      T(()=>{fbox.value=null;showAdv.value=true},7200)
    }
  },
  {
    shortLabel:'请求访问权限', stepTag:'Step 5 · 向各 AA 请求权限',
    caption:'用户持匿名凭证向各授权机构（AA）提交访问请求，每个 AA 独立验证后，对用户伪名、关键词 W 和时间段 T 颁发访问权限（多签名）K_j，AA 之间互不通信。',
    adv:{icon:'✍️',text:'不可伪造：K_j 是 AA 的签名，无私钥无法伪造'},
    duration:14000,
    act(){
      act_activate(['user','aa1','aa2','aa3'])
      T(()=>act_pkt('user','aa1','📩','请求 + 凭证 σ','#69f0ae',2000),500)
      T(()=>act_pkt('user','aa2','📩','请求 + 凭证 σ','#69f0ae',2000),1000)
      T(()=>act_pkt('user','aa3','📩','请求 + 凭证 σ','#69f0ae',2000),1500)
      T(()=>{act_receive('aa1');act_receive('aa2');act_receive('aa3');act_status('aa1','验证中…');act_status('aa2','验证中…');act_status('aa3','验证中…')},3800)
      T(()=>act_focus(ep('aa1'),ep('aa3'),340,520,'AA 独立验证凭证合法性，签发 K_j','#ce93d8'),4300)
      T(()=>{fbox.value=null},6500)
      T(()=>act_pkt('aa1','user','🔑','访问权限 K₁','#ce93d8',2000),6700)
      T(()=>act_pkt('aa2','user','🔑','访问权限 K₂','#ce93d8',2000),7300)
      T(()=>act_pkt('aa3','user','🔑','访问权限 K₃','#ce93d8',2000),7900)
      T(()=>{act_status('aa1','✓ K₁ 已颁发');act_status('aa2','✓ K₂ 已颁发');act_status('aa3','✓ K₃ 已颁发')},10200)
      T(()=>{act_status('user','持有 K₁ K₂ K₃');act_pulse('user');act_receive('user')},10500)
      T(()=>act_focus(ep('user'),null,340,260,'用户收到三份多签名访问权限','#ce93d8'),11000)
      T(()=>{fbox.value=null;showAdv.value=true},13200)
    }
  },
  {
    shortLabel:'权限聚合', stepTag:'Step 6 · 聚合为 AK_U',
    caption:'用户在本地将 K₁, K₂, K₃ 通过 BLS 乘法聚合为单一聚合密钥 AK_U，存储开销从 O(n) 降为 O(1)。聚合完全在本地执行，无需与任何机构交互。',
    adv:{icon:'📦',text:'可聚合：n 个签名压缩为 1 个密钥，验证效率大幅提升'},
    duration:9000,
    act(){
      act_activate(['user'])
      T(()=>act_pulse('user'),400)
      T(()=>act_aggregate(),700)
      T(()=>act_focus(ep('user'),null,380,260,'AK_U = K₁ · K₂ · K₃  （BLS 乘法聚合）','#ffd740'),3500)
      T(()=>{act_status('user','AK_U 聚合密钥');act_receive('user')},3800)
      T(()=>{fbox.value=null;showAdv.value=true},7000)
    }
  },
  {
    shortLabel:'非交互解密', stepTag:'Step 7 · 非交互式解密',
    caption:'用户持聚合密钥 AK_U 直接向数据库请求解密。验证时间段 T_E ≅ T_U 匹配后即可获得明文服务 M。服务提供商完全不参与认证，全程可以离线。',
    adv:{icon:'⚡',text:'非交互：SP 完全离线，用户自主完成认证与解密'},
    duration:11500,
    act(){
      act_activate(['user','db'])
      T(()=>act_pkt('user','db','🗝️','AK_U（解密请求）','#69f0ae',2200),600)
      T(()=>{act_status('db','验证时间段…');act_pulse('db');act_receive('db')},3200)
      T(()=>act_focus(ep('db'),null,360,260,'验证：T_E = T_U ✓（时间段匹配）','#78909c'),3700)
      T(()=>{fbox.value=null},6000)
      T(()=>act_pkt('db','user','📦','服务明文 M','#ffd740',2200),6300)
      T(()=>{act_status('user','🔓 解密成功');act_status('db','SP 全程离线 ✓');act_pulse('user');act_receive('user')},8800)
      T(()=>act_focus(ep('user'),null,360,260,'服务商无需在线——OSBE 非交互认证','#69f0ae'),9200)
      T(()=>{fbox.value=null;showAdv.value=true},10800)
    }
  },
  {
    shortLabel:'溯源追踪', stepTag:'Step 8 · 溯源追踪（可选）',
    caption:'发现异常行为时，追踪机构使用私钥 SK_TA 对伪名解密：PK_U = PU₂ / PU₁^x_ta，精准还原用户真实公钥，实现匿名下的责任追溯——匿名不等于免责。',
    adv:{icon:'🔍',text:'可追踪：匿名不等于免责，TA 可在必要时溯源'},
    duration:11000,
    act(){
      act_activate(['ta','user','ra'])
      T(()=>act_pkt('user','ta','🎭','伪名 PU','#69f0ae',2200),600)
      T(()=>{act_status('ta','解密伪名…');act_pulse('ta');act_receive('ta')},3200)
      T(()=>act_focus(ep('ta'),null,380,260,'PK_U = PU₂ · PU₁^(−x_ta)  还原真实身份','#ff6b6b'),3700)
      T(()=>{fbox.value=null},6200)
      T(()=>act_pkt('ta','ra','🔍','PK_U 已还原','#ff6b6b',2000),6400)
      T(()=>{act_status('ta','✓ 身份已追踪');act_pulse('ta')},8700)
      T(()=>act_focus(ep('ta'),ep('ra'),420,300,'违规用户匿名访问后仍可被精准追溯','#ff6b6b'),9000)
      T(()=>{fbox.value=null;showAdv.value=true},10400)
    }
  },
]

const sceneObj = computed(()=>scenes[sceneIdx.value]??null)
const pct = computed(()=>scenes.length?sceneIdx.value/(scenes.length-1)*100:0)

// ── action helpers ────────────────────────────────
function act_activate(ids){ids.forEach(id=>aEnts.value.add(id))}
function act_pulse(id){const s=new Set(aEnts.value);s.add(id);aEnts.value=s}
function act_status(id,txt){eStatus[id]=txt}
function act_receive(id){rEnts.value.add(id);T(()=>rEnts.value.delete(id),1400)}

function act_line(from,to,color,ck,durMs){
  const pf=ep(from),pt=ep(to)
  const dx=pt.x-pf.x,dy=pt.y-pf.y,len=Math.sqrt(dx*dx+dy*dy)
  const id=++lid,dur=durMs/1000
  const d=`M${pf.x},${pf.y} L${pt.x},${pt.y}`
  aLines.value.push({id,d,color,ck,len,off:len,dur})
  nextTick(()=>T(()=>{const l=aLines.value.find(x=>x.id===id);if(l)l.off=0},30))
}

function act_pkt(from,to,icon,label,color,dur){
  const pf=ep(from),pt=ep(to),id=++pid
  pkts.value.push({id,x:pf.x-60,y:pf.y-24,icon,label,color,dur,arrive:false})
  T(()=>{const p=pkts.value.find(x=>x.id===id);if(p){p.x=pt.x-60;p.y=pt.y-24}},60)
  T(()=>{
    const p=pkts.value.find(x=>x.id===id)
    if(p){p.arrive=true;act_receive(to)}
    T(()=>{pkts.value=pkts.value.filter(x=>x.id!==id)},700)
  },dur+60)
}

function act_burst(entId,icons,color){
  const pos=ep(entId)
  icons.forEach((icon,i)=>{
    const angle=(i/icons.length)*Math.PI*2-Math.PI/2,r=130,id=++pid
    pkts.value.push({id,x:pos.x-60,y:pos.y-24,icon,label:`伪名 PU${i+1}`,color,dur:800,arrive:false})
    T(()=>{const p=pkts.value.find(x=>x.id===id);if(p){p.x=pos.x+Math.cos(angle)*r-60;p.y=pos.y+Math.sin(angle)*r-24}},70+i*100)
    T(()=>{const p=pkts.value.find(x=>x.id===id);if(p)p.arrive=true;T(()=>{pkts.value=pkts.value.filter(x=>x.id!==id)},600)},1200+i*100)
  })
}

function act_aggregate(){
  const pos=ep('user')
  const offs=[[-140,-90],[0,-130],[140,-90]]
  offs.forEach(([ox,oy],i)=>{
    const id=++pid
    pkts.value.push({id,x:pos.x+ox-60,y:pos.y+oy-24,icon:'🔑',label:`K${i+1}`,color:'#ce93d8',dur:1300,arrive:false})
    T(()=>{const p=pkts.value.find(x=>x.id===id);if(p){p.x=pos.x-60;p.y=pos.y-24}},80+i*200)
    T(()=>{const p=pkts.value.find(x=>x.id===id);if(p)p.arrive=true;T(()=>{pkts.value=pkts.value.filter(x=>x.id!==id)},600)},1600+i*200)
  })
  T(()=>{
    const id2=++pid
    pkts.value.push({id:id2,x:pos.x-60,y:pos.y-90,icon:'🗝️',label:'AK_U 聚合密钥',color:'#ffd740',dur:200,arrive:false})
    T(()=>{pkts.value=pkts.value.filter(x=>x.id!==id2)},2600)
  },2600)
}

function act_focus(pa,pb,w,h,label,color){
  let lx,ty,fw=w,fh=h
  if(pb){
    lx=Math.min(pa.x,pb.x)-24; ty=Math.min(pa.y,pb.y)-30
    fw=Math.abs(pb.x-pa.x)+140; fh=Math.abs(pb.y-pa.y)+150
  } else {
    lx=pa.x-w/2; ty=pa.y-h/2
  }
  fbox.value={lx,ty,w:fw,h:fh,label,color}
}

// ── type ──────────────────────────────────────────
let typeTimer=null
function typeText(txt){
  clearTimeout(typeTimer);typed.value='';showAdv.value=false
  let i=0
  function tick(){typed.value=txt.slice(0,i);i++;if(i<=txt.length)typeTimer=T(tick,24)}
  tick()
}

// ── scene runner ──────────────────────────────────
function runScene(idx){
  if(idx>=scenes.length){T(()=>goIntro(),2000);return}
  clearAll()
  sceneIdx.value=idx
  aEnts.value=new Set();rEnts.value=new Set()
  Object.keys(eStatus).forEach(k=>delete eStatus[k])
  aLines.value=[];pkts.value=[];fbox.value=null;showAdv.value=false
  subKey.value++
  typeText(scenes[idx].caption)
  scenes[idx].act()
  T(()=>{if(!paused.value)runScene(idx+1)},scenes[idx].duration)
}

function jumpTo(idx){clearAll();paused.value=false;runScene(idx)}
function togglePause(){
  if(paused.value){paused.value=false;runScene(sceneIdx.value)}
  else{paused.value=true;clearAll()}
}

// ── intro ─────────────────────────────────────────
function startIntro(){
  phase.value='intro';introStep.value=-1;introCountdown.value=14
  clearInterval(introCountInterval)
  T(()=>{introStep.value=0},600)
  introFeats.forEach((_,i)=>T(()=>{introStep.value=i+1},900+i*650))
  let cnt=14
  introCountInterval=setInterval(()=>{
    cnt--;introCountdown.value=cnt
    if(cnt<=0){clearInterval(introCountInterval);startMain()}
  },1000)
}

function startMain(){
  clearInterval(introCountInterval);clearAll()
  phase.value='main'
  nextTick(()=>{resize();T(()=>runScene(0),400)})
}

function goIntro(){
  clearAll();clearInterval(introCountInterval);clearTimeout(typeTimer)
  phase.value='intro'
  setTimeout(startIntro,80)
}

// ── particles ─────────────────────────────────────
let paf=null
function initP(canvas){
  if(!canvas)return
  const ctx=canvas.getContext('2d')
  const W=canvas.width=canvas.offsetWidth||1400
  const H=canvas.height=canvas.offsetHeight||760
  const pts=Array.from({length:75},()=>({
    x:Math.random()*W,y:Math.random()*H,
    vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4,
    r:Math.random()*1.8+.4,alpha:Math.random()*.3+.07
  }))
  function draw(){
    ctx.clearRect(0,0,W,H)
    pts.forEach(p=>{
      p.x=(p.x+p.vx+W)%W;p.y=(p.y+p.vy+H)%H
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
      ctx.fillStyle=`rgba(100,200,255,${p.alpha})`;ctx.fill()
    })
    for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){
      const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy)
      if(d<95){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(100,200,255,${(1-d/95)*.07})`;ctx.stroke()}
    }
    paf=requestAnimationFrame(draw)
  }
  draw()
}

function buildBgLines(){
  const pairs=[['user','ra'],['user','aa1'],['user','aa2'],['user','aa3'],['user','db'],['ra','ta'],['encryptor','db']]
  bgLines.value=pairs.map(([a,b],i)=>{const pa=ep(a),pb=ep(b);return{id:i,x1:pa.x,y1:pa.y,x2:pb.x,y2:pb.y}})
}

function resize(){
  const el=stageWrap.value;if(el){SW.value=el.clientWidth||1400;SH.value=el.clientHeight||680}
  buildBgLines()
  if(bgCanvas.value){bgCanvas.value.width=SW.value;bgCanvas.value.height=SH.value;initP(bgCanvas.value)}
}

onMounted(()=>{
  nextTick(()=>{
    if(introCanvas.value)initP(introCanvas.value)
    startIntro()
    window.addEventListener('resize',resize)
  })
})
onUnmounted(()=>{
  clearAll();clearInterval(introCountInterval);clearTimeout(typeTimer)
  cancelAnimationFrame(paf);window.removeEventListener('resize',resize)
})
</script>

<style scoped>
.anim-root{position:fixed;inset:0;z-index:9999;background:#030d1a;font-family:'PingFang SC','Microsoft YaHei','Noto Sans SC',sans-serif;overflow:hidden;color:#fff}

/* ── intro ── */
.intro-stage{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:44px;z-index:5;overflow:hidden}
.bg-cv{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.5}
.intro-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(79,195,247,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(79,195,247,.04) 1px,transparent 1px);background-size:70px 70px;pointer-events:none}
.intro-title-wrap{text-align:center;z-index:2}
.intro-en{font-size:20px;font-weight:300;color:rgba(79,195,247,.65);letter-spacing:2.5px;line-height:1.6}
.intro-abbr{display:flex;justify-content:center;gap:8px;margin:22px 0 16px}
.abbr-char{display:inline-flex;align-items:center;justify-content:center;width:70px;height:70px;background:rgba(79,195,247,.08);border:2px solid rgba(79,195,247,.35);border-radius:14px;font-size:32px;font-weight:900;color:#4fc3f7;text-shadow:0 0 24px #4fc3f7;animation:charPop .55s cubic-bezier(.34,1.56,.64,1) both}
@keyframes charPop{from{transform:scale(0) rotateY(90deg);opacity:0}to{transform:scale(1) rotateY(0deg);opacity:1}}
.intro-cn{font-size:22px;font-weight:700;color:rgba(255,255,255,.8);letter-spacing:5px;margin-top:8px}
.intro-features{display:flex;gap:20px;flex-wrap:wrap;justify-content:center;max-width:1100px;z-index:2}
.intro-feat{width:164px;padding:20px 14px;background:rgba(2,11,24,.75);border:1.5px solid rgba(255,255,255,.1);border-radius:16px;text-align:center;animation:featSlide .55s cubic-bezier(.34,1.4,.64,1) both;backdrop-filter:blur(8px)}
@keyframes featSlide{from{transform:translateY(32px);opacity:0}to{transform:translateY(0);opacity:1}}
.feat-ico-big{font-size:32px;margin-bottom:9px}
.feat-name{font-size:14px;font-weight:700;margin-bottom:6px}
.feat-desc{font-size:12px;color:rgba(255,255,255,.45);line-height:1.55}
.intro-footer{display:flex;align-items:center;gap:22px;z-index:2}
.intro-skip{display:flex;align-items:center;gap:8px;padding:12px 28px;border-radius:9px;background:rgba(79,195,247,.12);border:1px solid rgba(79,195,247,.4);color:#4fc3f7;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s}
.intro-skip:hover{background:rgba(79,195,247,.25)}
.intro-countdown{font-size:13px;color:rgba(255,255,255,.3)}
.curtain-leave-active{transition:opacity .7s,transform .7s}.curtain-leave-to{opacity:0;transform:scale(1.05)}
.slide-up-enter-active{transition:opacity .8s,transform .8s}.slide-up-enter-from{opacity:0;transform:translateY(44px)}
.feat-in-enter-active{transition:all .5s}.feat-in-enter-from{opacity:0;transform:translateY(22px) scale(.88)}

/* ── main ── */
.main-stage{position:absolute;inset:0;display:flex;flex-direction:column}
.top-bar{display:flex;align-items:center;justify-content:space-between;padding:0 28px;height:56px;flex-shrink:0;background:rgba(3,13,26,.92);border-bottom:1px solid rgba(79,195,247,.14);z-index:10}
.top-left{display:flex;align-items:center;gap:14px}
.top-abbr{font-size:17px;font-weight:900;color:#4fc3f7;letter-spacing:3px}
.top-sep{color:rgba(255,255,255,.2);font-size:20px}
.top-scene-name{font-size:14px;color:rgba(255,255,255,.5);letter-spacing:.5px}
.top-controls{display:flex;gap:8px}
.ctrl-btn{display:flex;align-items:center;gap:6px;padding:7px 18px;border-radius:7px;background:rgba(79,195,247,.07);border:1px solid rgba(79,195,247,.2);color:rgba(255,255,255,.7);font-size:13px;cursor:pointer;transition:all .2s}
.ctrl-btn:hover{background:rgba(79,195,247,.18);color:#fff}
.close-btn{border-color:rgba(255,107,107,.25);color:rgba(255,107,107,.7)}.close-btn:hover{background:rgba(255,107,107,.14);color:#ff6b6b}

/* step bar */
.step-bar{position:relative;height:48px;flex-shrink:0;background:rgba(255,255,255,.02);border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;padding:0 36px;gap:0;overflow:hidden}
.step-track-line{position:absolute;bottom:0;left:0;right:0;height:2.5px;background:rgba(255,255,255,.05)}
.step-track-fill{height:100%;background:linear-gradient(90deg,#4fc3f7,#69f0ae);transition:width .7s ease;box-shadow:0 0 8px #4fc3f7aa}
.step-pill{display:flex;align-items:center;gap:7px;padding:5px 14px;border-radius:22px;cursor:pointer;transition:all .25s;flex-shrink:0}
.step-pill:hover{background:rgba(79,195,247,.1)}
.pill-dot{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.18);flex-shrink:0;transition:all .3s}
.step-pill.done .pill-dot{background:#4fc3f7}
.step-pill.active .pill-dot{background:#69f0ae;box-shadow:0 0 8px #69f0ae;transform:scale(1.3)}
.pill-label{font-size:12px;color:rgba(255,255,255,.35);white-space:nowrap}
.step-pill.done .pill-label{color:rgba(79,195,247,.7)}
.step-pill.active .pill-label{color:#69f0ae;font-weight:700;font-size:13.5px}

/* stage */
.stage-wrap{flex:1;position:relative;overflow:hidden}
.stage-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(79,195,247,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(79,195,247,.03) 1px,transparent 1px);background-size:70px 70px;pointer-events:none}
.link-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2}

/* entity */
.ent-node{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;z-index:4;pointer-events:none;--ec:#4fc3f7}
.ent-ring{position:absolute;border-radius:50%;border:2px solid var(--ec);opacity:0;pointer-events:none}
.r1{width:90px;height:90px;top:50%;left:50%;transform:translate(-50%,-56%)}
.r2{width:124px;height:124px;top:50%;left:50%;transform:translate(-50%,-56%)}
.ent-node.active .r1{animation:rp 2.2s ease-out infinite}
.ent-node.active .r2{animation:rp 2.2s ease-out infinite .45s}
@keyframes rp{0%{opacity:.55;transform:translate(-50%,-56%) scale(.82)}100%{opacity:0;transform:translate(-50%,-56%) scale(1.5)}}
.ent-node.receiving .r1,.ent-node.receiving .r2{animation:rf .9s ease-out}
@keyframes rf{0%{opacity:.9;transform:translate(-50%,-56%) scale(.75)}50%{opacity:.6;transform:translate(-50%,-56%) scale(1.7)}100%{opacity:0;transform:translate(-50%,-56%) scale(2.1)}}
.ent-circle{width:88px;height:88px;border-radius:24px;background:rgba(3,13,26,.88);border:2px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;position:relative;z-index:2;transition:all .4s;box-shadow:0 4px 28px rgba(0,0,0,.5)}
.ent-ico{font-size:40px;line-height:1}
.ent-node.active .ent-circle{border-color:var(--ec);box-shadow:0 0 28px var(--ec)66,0 4px 28px rgba(0,0,0,.5);background:rgba(3,13,26,.97);transform:scale(1.12)}
.ent-label{font-size:16px;font-weight:800;margin-top:11px;color:var(--ec);text-shadow:0 0 14px var(--ec);white-space:nowrap}
.ent-sub{font-size:12px;color:rgba(255,255,255,.3);margin-top:2px}
.ent-badge{position:absolute;top:-20px;left:50%;transform:translateX(-50%);background:var(--ec);color:#030d1a;font-size:12px;font-weight:800;padding:4px 12px;border-radius:12px;white-space:nowrap;z-index:6}
.badge-pop-enter-active{animation:bp .35s cubic-bezier(.34,1.56,.64,1)}.badge-pop-leave-active{animation:bp .25s reverse}
@keyframes bp{from{transform:translateX(-50%) scale(0);opacity:0}to{transform:translateX(-50%) scale(1);opacity:1}}

/* pkt */
.pkt-layer{position:absolute;inset:0;pointer-events:none;z-index:8}
.data-pkt{position:absolute;display:flex;flex-direction:column;align-items:center;pointer-events:none}
.pkt-body{display:flex;align-items:center;gap:8px;background:rgba(3,13,26,.93);border:2px solid var(--pc,#4fc3f7);border-radius:32px;padding:9px 20px 9px 12px;box-shadow:0 0 20px var(--pc,#4fc3f7)55;white-space:nowrap}
.pkt-ico{font-size:24px}
.pkt-name{font-size:15px;font-weight:800;color:var(--pc,#4fc3f7)}
.data-pkt.arrive .pkt-body{animation:pa .45s ease-out;box-shadow:0 0 36px var(--pc,#4fc3f7)99}
@keyframes pa{0%{transform:scale(1.35)}60%{transform:scale(.9)}100%{transform:scale(1)}}

/* focus */
.focus-box{position:absolute;border:2px solid var(--fc,#4fc3f7);border-radius:18px;box-shadow:0 0 0 5px var(--fc,#4fc3f7)14,0 0 50px var(--fc,#4fc3f7)28;pointer-events:none;z-index:3}
.focus-label{position:absolute;top:-30px;left:50%;transform:translateX(-50%);background:var(--fc,#4fc3f7);color:#030d1a;font-size:13px;font-weight:800;padding:4px 16px;border-radius:10px;white-space:nowrap}
.focus-fade-enter-active,.focus-fade-leave-active{transition:opacity .4s,transform .4s}
.focus-fade-enter-from,.focus-fade-leave-to{opacity:0;transform:scale(.93)}

/* subtitle */
.sub-wrap{position:absolute;bottom:22px;left:50%;transform:translateX(-50%);width:min(960px,90vw);z-index:10}
.sub-box{background:rgba(3,13,26,.9);backdrop-filter:blur(18px);border:1px solid rgba(79,195,247,.22);border-radius:18px;padding:20px 30px;text-align:center}
.sub-step{font-size:13px;font-weight:800;color:#4fc3f7;letter-spacing:2px;text-transform:uppercase;margin-bottom:9px}
.sub-text{font-size:17px;color:rgba(255,255,255,.92);line-height:1.8;min-height:60px}
.sub-adv{display:inline-flex;align-items:center;gap:9px;margin-top:14px;background:rgba(105,240,174,.1);border:1px solid rgba(105,240,174,.3);border-radius:28px;padding:6px 20px;font-size:14px;font-weight:700;color:#69f0ae}
.sub-fade-enter-active,.sub-fade-leave-active{transition:opacity .4s,transform .4s}
.sub-fade-enter-from{opacity:0;transform:translateX(-50%) translateY(16px)}
.sub-fade-leave-to{opacity:0;transform:translateX(-50%) translateY(-8px)}
.adv-fade-enter-active,.adv-fade-leave-active{transition:opacity .5s}
.adv-fade-enter-from,.adv-fade-leave-to{opacity:0}
</style>
