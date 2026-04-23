<template>
  <teleport to="body">
  <div class="anim-root">

    <!-- ══ 开场介绍 ══ -->
    <transition name="curtain">
      <div v-if="phase==='intro'" class="intro-stage">
        <canvas class="bg-cv" ref="introCanvas"></canvas>
        <div class="intro-grid"></div>
        <transition name="slide-up" appear>
          <div class="intro-title-wrap" v-if="introStep>=0">
            <div class="intro-en">Privacy-Preserving Decentralized Signature-Based Access Control</div>
            <div class="intro-abbr">
              <span v-for="(c,i) in 'PPDSBAC'" :key="i" class="abbr-char"
                    :style="{animationDelay:(i*90)+'ms'}">{{c}}</span>
            </div>
            <div class="intro-cn">隐私保护去中心化签名访问控制</div>
          </div>
        </transition>

        <div class="intro-features">
          <transition v-for="(f,i) in introFeats" :key="i" name="feat-in">
            <div v-if="introStep>=i+1" class="intro-feat" :style="{borderColor:f.color}">
              <img :src="f.icon" class="feat-img" :alt="f.name"
                   @error="e=>e.target.style.opacity='.3'"/>
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

    <!-- ══ 主演示 ══ -->
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
        <div class="step-track-line">
          <div class="step-track-fill" :style="{width:pct+'%'}"></div>
        </div>
        <div v-for="(sc,i) in scenes" :key="i" class="step-pill"
             :class="{done:sceneIdx>i, active:sceneIdx===i}" @click="jumpTo(i)">
          <div class="pill-dot"></div>
          <span class="pill-label">{{sc.shortLabel}}</span>
        </div>
      </div>

      <div class="stage-wrap" ref="stageWrap">
        <canvas class="bg-cv" ref="bgCanvas"></canvas>
        <div class="stage-grid"></div>

        <!-- 实体节点 -->
        <div v-for="e in entities" :key="e.id" class="ent-node"
             :class="{active:aEnts.has(e.id), receiving:rEnts.has(e.id)}"
             :style="{left:e.x+'%', top:e.y+'%', '--ec':e.color}">
          <div class="ent-ring r1"></div>
          <div class="ent-ring r2"></div>
          <!-- 图片容器 -->
          <div class="ent-img-wrap">
            <img :src="e.icon" class="ent-img" :alt="e.name"
                 @error="e=>e.target.src='/icons/placeholder.png'"/>
            <!-- 活跃时底部光晕 -->
            <div class="ent-glow-bar"></div>
          </div>
          <div class="ent-label">{{e.name}}</div>
          <div class="ent-sub">{{e.sub}}</div>
          <transition name="badge-pop">
            <div v-if="eStatus[e.id]" class="ent-badge">{{eStatus[e.id]}}</div>
          </transition>
        </div>

        <!-- SVG 连线层 -->
        <svg class="link-svg" :viewBox="`0 0 ${SW} ${SH}`" preserveAspectRatio="none">
          <defs>
            <marker id="m-blue"   markerWidth="12" markerHeight="9" refX="10" refY="4.5" orient="auto"><path d="M1,1L1,8L12,4.5z" fill="#4fc3f7"/></marker>
            <marker id="m-green"  markerWidth="12" markerHeight="9" refX="10" refY="4.5" orient="auto"><path d="M1,1L1,8L12,4.5z" fill="#69f0ae"/></marker>
            <marker id="m-purple" markerWidth="12" markerHeight="9" refX="10" refY="4.5" orient="auto"><path d="M1,1L1,8L12,4.5z" fill="#ce93d8"/></marker>
            <marker id="m-amber"  markerWidth="12" markerHeight="9" refX="10" refY="4.5" orient="auto"><path d="M1,1L1,8L12,4.5z" fill="#ffd740"/></marker>
            <marker id="m-red"    markerWidth="12" markerHeight="9" refX="10" refY="4.5" orient="auto"><path d="M1,1L1,8L12,4.5z" fill="#ff6b6b"/></marker>
            <filter id="lg">
              <feGaussianBlur stdDeviation="3" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <line v-for="bl in bgLines" :key="bl.id"
                :x1="bl.x1" :y1="bl.y1" :x2="bl.x2" :y2="bl.y2"
                stroke="rgba(79,195,247,0.1)" stroke-width="1.5" stroke-dasharray="10 8"/>
          <path v-for="al in aLines" :key="al.id" :d="al.d" fill="none"
                :stroke="al.color" stroke-width="3" filter="url(#lg)"
                :stroke-dasharray="al.len" :stroke-dashoffset="al.off"
                :style="{transition:`stroke-dashoffset ${al.dur}s linear`}"
                :marker-end="`url(#m-${al.ck})`"/>
        </svg>

        <!-- 飞行消息包 -->
        <div class="pkt-layer">
          <div v-for="p in pkts" :key="p.id" class="data-pkt"
               :class="{arrive:p.arrive}"
               :style="{left:p.x+'px', top:p.y+'px', '--pc':p.color,
                        transition:`left ${p.dur}ms cubic-bezier(.25,.08,.18,1),
                                    top  ${p.dur}ms cubic-bezier(.25,.08,.18,1)`}">
            <div class="pkt-body">
              <div class="pkt-icon-wrap">
                <img :src="p.icon" class="pkt-img" :alt="p.label"
                     @error="e=>e.target.style.opacity='0'"/>
              </div>
              <span class="pkt-name">{{p.label}}</span>
            </div>
            <div class="pkt-glow"></div>
          </div>
        </div>

        <!-- 局部聚焦框 -->
        <transition name="focus-fade">
          <div v-if="fbox" class="focus-box"
               :style="{left:fbox.lx+'px',top:fbox.ty+'px',
                        width:fbox.w+'px',height:fbox.h+'px','--fc':fbox.color}">
            <div class="focus-label">{{fbox.label}}</div>
          </div>
        </transition>

        <!-- 字幕 -->
        <div class="sub-wrap">
          <transition name="sub-fade" mode="out-in">
            <div class="sub-box" :key="subKey">
              <div class="sub-step">{{sceneObj?.stepTag}}</div>
              <div class="sub-text">{{typed}}</div>
              <transition name="adv-fade">
                <div v-if="showAdv && sceneObj?.adv" class="sub-adv">
                  <span>{{sceneObj.adv.icon}}</span>
                  <span>{{sceneObj.adv.text}}</span>
                </div>
              </transition>
            </div>
          </transition>
        </div>
      </div><!-- /stage-wrap -->
    </div><!-- /main-stage -->

  </div>
  </teleport>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// ══════════════════════════════════════════════════════════════
//  图标路径配置  ← 修改这里替换图片，或直接替换 public/icons/ 目录下的文件
// ══════════════════════════════════════════════════════════════
const ICONS = {
  // 实体图标（建议尺寸 200×240px，PNG透明背景）
  ra:        '/icons/ra.png',
  ta:        '/icons/ta.png',
  aa:        '/icons/aa.png',
  user:      '/icons/user.png',
  encryptor: '/icons/encryptor.png',
  db:        '/icons/db.png',

  // 消息包图标（建议尺寸 64×64px）
  pkt_zk:     '/icons/pkt_zk.png',
  pkt_cred:   '/icons/pkt_cred.png',
  pkt_id:     '/icons/pkt_id.png',
  pkt_ct:     '/icons/pkt_ct.png',
  pkt_req:    '/icons/pkt_req.png',
  pkt_key:    '/icons/pkt_key.png',
  pkt_akey:   '/icons/pkt_akey.png',
  pkt_data:   '/icons/pkt_data.png',
  pkt_pseudo: '/icons/pkt_pseudo.png',
  pkt_face:   '/icons/pkt_face.png',

  // 特性图标（建议尺寸 80×80px）
  feat_link:   '/icons/feat_link.png',
  feat_sign:   '/icons/feat_sign.png',
  feat_agg:    '/icons/feat_agg.png',
  feat_nosp:   '/icons/feat_nosp.png',
  feat_trace:  '/icons/feat_trace.png',
  feat_revoke: '/icons/feat_revoke.png',
}

// ── 开场特性 ───────────────────────────────────────────────────
const introFeats = [
  { icon:ICONS.feat_link,   color:'#4fc3f7', name:'不可链接访问',  desc:'伪名随机生成，请求间无法关联' },
  { icon:ICONS.feat_sign,   color:'#ce93d8', name:'不可伪造权限',  desc:'BLS多签名，无私钥无法伪造' },
  { icon:ICONS.feat_agg,    color:'#ffd740', name:'可聚合权限',    desc:'n个签名压缩为1个密钥' },
  { icon:ICONS.feat_nosp,   color:'#69f0ae', name:'非交互认证',    desc:'服务提供商可完全离线' },
  { icon:ICONS.feat_trace,  color:'#ff6b6b', name:'可追踪溯源',    desc:'追踪机构可还原真实身份' },
  { icon:ICONS.feat_revoke, color:'#ffab40', name:'直接撤销',      desc:'时间段绑定，自动过期失效' },
]

// ── 实体列表 ───────────────────────────────────────────────────
const entities = [
  { id:'encryptor', icon:ICONS.encryptor, name:'加密者',     sub:'Encryptor', x:7,  y:26, color:'#ffd740' },
  { id:'db',        icon:ICONS.db,        name:'数据库',     sub:'Database',  x:7,  y:70, color:'#90a4ae' },
  { id:'ra',        icon:ICONS.ra,        name:'注册机构',   sub:'RA',        x:30, y:13, color:'#4fc3f7' },
  { id:'user',      icon:ICONS.user,      name:'用 户',      sub:'User',      x:52, y:46, color:'#69f0ae' },
  { id:'aa1',       icon:ICONS.aa,        name:'授权机构 1', sub:'AA₁',       x:76, y:15, color:'#ce93d8' },
  { id:'aa2',       icon:ICONS.aa,        name:'授权机构 2', sub:'AA₂',       x:76, y:46, color:'#ce93d8' },
  { id:'aa3',       icon:ICONS.aa,        name:'授权机构 3', sub:'AA₃',       x:76, y:77, color:'#ce93d8' },
  { id:'ta',        icon:ICONS.ta,        name:'追踪机构',   sub:'TA',        x:93, y:32, color:'#ff6b6b' },
]

// ── 舞台尺寸 ───────────────────────────────────────────────────
const stageWrap   = ref(null)
const bgCanvas    = ref(null)
const introCanvas = ref(null)
const SW = ref(1400), SH = ref(680)

function ep(id) {
  const e = entities.find(x => x.id === id)
  if (!e) return { x: 0, y: 0 }
  return { x: e.x / 100 * SW.value, y: e.y / 100 * SH.value }
}

// ── 动态状态 ───────────────────────────────────────────────────
const phase        = ref('intro')
const paused       = ref(false)
const introStep    = ref(-1)
const introCountdown = ref(14)
let introCountInterval = null

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

let lid = 0, pid = 0, timers = []
function T(fn, ms) { const id = setTimeout(fn, ms); timers.push(id); return id }
function clearAll() { timers.forEach(clearTimeout); timers = [] }

// ══ 场景剧本 ══════════════════════════════════════════════════
const scenes = [
  {
    shortLabel:'系统初始化', stepTag:'Step 1 · 全局初始化',
    caption:'系统生成双线性群公共参数，注册机构（RA）、追踪机构（TA）和各授权机构（AA）独立生成密钥对。授权机构之间无需任何交互，体现方案的去中心化特性。',
    adv:{ icon:'🌐', text:'去中心化：多 AA 独立运行，无单点信任' },
    duration: 9000,
    act() {
      act_activate(['ra','ta','aa1','aa2','aa3'])
      T(()=>act_pulse('ra'), 600)
      T(()=>act_line('ra','aa1','#4fc3f7','blue',1800), 900)
      T(()=>act_line('ra','aa2','#4fc3f7','blue',1800), 1300)
      T(()=>act_line('ra','aa3','#4fc3f7','blue',1800), 1700)
      T(()=>{act_status('aa1','✓ 密钥就绪');act_status('aa2','✓ 密钥就绪');act_status('aa3','✓ 密钥就绪')}, 4000)
      T(()=>{act_status('ra','✓ 就绪');act_status('ta','✓ 就绪')}, 4400)
      T(()=>act_focus(ep('aa1'),ep('aa3'),360,560,'各 AA 独立生成密钥对，互不知晓','#ce93d8'), 4800)
      T(()=>{fbox.value=null}, 7200)
      T(()=>{showAdv.value=true}, 7600)
    }
  },
  {
    shortLabel:'用户注册', stepTag:'Step 2 · 用户注册',
    caption:'用户生成密钥对，向注册机构提交零知识证明（ZK Proof），证明持有私钥而不泄露。RA 验证通过后颁发匿名凭证 σ，并将真实身份秘密发送给追踪机构。',
    adv:{ icon:'🎭', text:'匿名性：凭证不泄露身份，必要时可由 TA 追踪' },
    duration: 13000,
    act() {
      act_activate(['user','ra','ta'])
      T(()=>act_pulse('user'), 500)
      T(()=>act_pkt('user','ra', ICONS.pkt_zk,   '零知识证明 Π', '#69f0ae', 2200), 700)
      T(()=>{act_status('ra','验证中…');act_pulse('ra');act_receive('ra')}, 3300)
      T(()=>act_focus(ep('ra'),null,340,260,'RA 验证零知识证明','#4fc3f7'), 3700)
      T(()=>{fbox.value=null}, 5600)
      T(()=>act_pkt('ra','ta',   ICONS.pkt_id,   '(ID_U, PK_U)', '#4fc3f7', 2000), 5800)
      T(()=>act_pkt('ra','user', ICONS.pkt_cred, '匿名凭证 σ',   '#ffd740', 2200), 7200)
      T(()=>{act_status('user','持有凭证 σ');act_status('ra','✓ 已注册');act_pulse('user');act_receive('user')}, 9700)
      T(()=>act_focus(ep('user'),null,300,250,'用户持匿名凭证，身份对外不可知','#69f0ae'), 10100)
      T(()=>{fbox.value=null;showAdv.value=true}, 12200)
    }
  },
  {
    shortLabel:'服务加密', stepTag:'Step 3 · OSBE 服务加密',
    caption:'加密者将服务数据以关键词 W 和时间段 T 加密，生成密文四元组 CT=(C₁,C₂,C₃,C₄) 上传至数据库。密文与时间段绑定——过期权限将直接无法解密。',
    adv:{ icon:'⏰', text:'直接撤销：时间段绑定，过期自动失效' },
    duration: 10000,
    act() {
      act_activate(['encryptor','db'])
      T(()=>act_pulse('encryptor'), 500)
      T(()=>act_focus(ep('encryptor'),null,380,260,'构造密文 CT = (C₁, C₂, C₃, C₄)','#ffd740'), 700)
      T(()=>{fbox.value=null}, 3000)
      T(()=>act_pkt('encryptor','db', ICONS.pkt_ct, '密文 CT', '#ffd740', 2400), 3200)
      T(()=>{act_status('db','存储密文 CT');act_pulse('db');act_receive('db')}, 5900)
      T(()=>act_focus(ep('db'),null,320,260,'密文与关键词 W、时间段 T 绑定','#90a4ae'), 6300)
      T(()=>{fbox.value=null;showAdv.value=true}, 8800)
    }
  },
  {
    shortLabel:'生成伪名', stepTag:'Step 4 · 生成访问伪名',
    caption:'用户为本次访问随机生成新鲜伪名 PU=(g^r, Y_U·Y_TA^r)，r 每次随机选取。不同请求使用不同伪名，即使所有机构联合也无法关联两次请求来自同一用户。',
    adv:{ icon:'🔗', text:'不可链接：每次访问伪名不同，防止行为追踪' },
    duration: 9500,
    act() {
      act_activate(['user'])
      T(()=>act_pulse('user'), 500)
      T(()=>act_focus(ep('user'),null,360,260,'PU = (g^r,  Y_U · Y_TA^r)，r 随机新鲜','#69f0ae'), 700)
      T(()=>act_burst('user', Array(4).fill(ICONS.pkt_pseudo), '#69f0ae', '伪名 PU'), 1400)
      T(()=>{fbox.value=null}, 3800)
      T(()=>{act_status('user','新鲜伪名 PU')}, 4100)
      T(()=>act_focus(ep('user'),null,400,270,'每次伪名随机不同 → 请求间不可关联','#69f0ae'), 4600)
      T(()=>{fbox.value=null;showAdv.value=true}, 8000)
    }
  },
  {
    shortLabel:'请求访问权限', stepTag:'Step 5 · 向各 AA 请求权限',
    caption:'用户持匿名凭证向各授权机构（AA）提交访问请求，每个 AA 独立验证后，对用户伪名、关键词 W 和时间段 T 颁发访问权限（多签名）K_j，AA 之间互不通信。',
    adv:{ icon:'✍️', text:'不可伪造：K_j 是 AA 的签名，无私钥无法伪造' },
    duration: 16000,
    act() {
      act_activate(['user','aa1','aa2','aa3'])
      T(()=>act_pkt('user','aa1', ICONS.pkt_req, '请求 + 凭证 σ', '#69f0ae', 2200), 500)
      T(()=>act_pkt('user','aa2', ICONS.pkt_req, '请求 + 凭证 σ', '#69f0ae', 2200), 1100)
      T(()=>act_pkt('user','aa3', ICONS.pkt_req, '请求 + 凭证 σ', '#69f0ae', 2200), 1700)
      T(()=>{act_receive('aa1');act_receive('aa2');act_receive('aa3');act_status('aa1','验证中…');act_status('aa2','验证中…');act_status('aa3','验证中…')}, 4200)
      T(()=>act_focus(ep('aa1'),ep('aa3'),360,560,'AA 独立验证凭证合法性，签发 K_j','#ce93d8'), 4700)
      T(()=>{fbox.value=null}, 7200)
      T(()=>act_pkt('aa1','user', ICONS.pkt_key, '访问权限 K₁', '#ce93d8', 2200), 7400)
      T(()=>act_pkt('aa2','user', ICONS.pkt_key, '访问权限 K₂', '#ce93d8', 2200), 8100)
      T(()=>act_pkt('aa3','user', ICONS.pkt_key, '访问权限 K₃', '#ce93d8', 2200), 8800)
      T(()=>{act_status('aa1','✓ K₁ 已颁发');act_status('aa2','✓ K₂ 已颁发');act_status('aa3','✓ K₃ 已颁发')}, 11400)
      T(()=>{act_status('user','持有 K₁ K₂ K₃');act_pulse('user');act_receive('user')}, 11800)
      T(()=>act_focus(ep('user'),null,360,270,'用户收到三份多签名访问权限','#ce93d8'), 12300)
      T(()=>{fbox.value=null;showAdv.value=true}, 15000)
    }
  },
  {
    shortLabel:'权限聚合', stepTag:'Step 6 · 聚合为 AK_U',
    caption:'用户在本地将 K₁, K₂, K₃ 通过 BLS 乘法聚合为单一聚合密钥 AK_U，存储开销从 O(n) 降为 O(1)。聚合完全在本地执行，无需与任何机构交互。',
    adv:{ icon:'📦', text:'可聚合：n 个签名压缩为 1 个密钥，验证效率大幅提升' },
    duration: 10000,
    act() {
      act_activate(['user'])
      T(()=>act_pulse('user'), 400)
      T(()=>act_aggregate(), 700)
      T(()=>act_focus(ep('user'),null,400,270,'AK_U = K₁ · K₂ · K₃  （BLS 乘法聚合）','#ffd740'), 3800)
      T(()=>{act_status('user','AK_U 聚合密钥');act_receive('user')}, 4200)
      T(()=>{fbox.value=null;showAdv.value=true}, 7800)
    }
  },
  {
    shortLabel:'非交互解密', stepTag:'Step 7 · 非交互式解密',
    caption:'用户持聚合密钥 AK_U 直接向数据库请求解密。验证时间段 T_E ≅ T_U 匹配后即可获得明文服务 M。服务提供商完全不参与认证，全程可以离线。',
    adv:{ icon:'⚡', text:'非交互：SP 完全离线，用户自主完成认证与解密' },
    duration: 13000,
    act() {
      act_activate(['user','db'])
      T(()=>act_pkt('user','db', ICONS.pkt_akey, 'AK_U（解密请求）', '#69f0ae', 2400), 600)
      T(()=>{act_status('db','验证时间段…');act_pulse('db');act_receive('db')}, 3400)
      T(()=>act_focus(ep('db'),null,380,270,'验证：T_E = T_U ✓（时间段匹配）','#90a4ae'), 3900)
      T(()=>{fbox.value=null}, 6600)
      T(()=>act_pkt('db','user', ICONS.pkt_data, '服务明文 M', '#ffd740', 2400), 6900)
      T(()=>{act_status('user','🔓 解密成功');act_status('db','SP 全程离线 ✓');act_pulse('user');act_receive('user')}, 9600)
      T(()=>act_focus(ep('user'),null,380,270,'服务商无需在线——OSBE 非交互认证','#69f0ae'), 10000)
      T(()=>{fbox.value=null;showAdv.value=true}, 12000)
    }
  },
  {
    shortLabel:'溯源追踪', stepTag:'Step 8 · 溯源追踪（可选）',
    caption:'发现异常行为时，追踪机构使用私钥 SK_TA 对伪名解密：PK_U = PU₂ / PU₁^x_ta，精准还原用户真实公钥，实现匿名下的责任追溯——匿名不等于免责。',
    adv:{ icon:'🔍', text:'可追踪：匿名不等于免责，TA 可在必要时溯源' },
    duration: 12000,
    act() {
      act_activate(['ta','user','ra'])
      T(()=>act_pkt('user','ta', ICONS.pkt_pseudo, '伪名 PU',    '#69f0ae', 2400), 600)
      T(()=>{act_status('ta','解密伪名…');act_pulse('ta');act_receive('ta')}, 3400)
      T(()=>act_focus(ep('ta'),null,400,270,'PK_U = PU₂ · PU₁^(−x_ta)  还原真实身份','#ff6b6b'), 3900)
      T(()=>{fbox.value=null}, 6600)
      T(()=>act_pkt('ta','ra', ICONS.pkt_face, 'PK_U 已还原', '#ff6b6b', 2200), 6900)
      T(()=>{act_status('ta','✓ 身份已追踪');act_pulse('ta')}, 9400)
      T(()=>act_focus(ep('ta'),ep('ra'),440,310,'违规用户匿名访问后仍可被精准追溯','#ff6b6b'), 9800)
      T(()=>{fbox.value=null;showAdv.value=true}, 11400)
    }
  },
]

const sceneObj = computed(() => scenes[sceneIdx.value] ?? null)
const pct      = computed(() => scenes.length ? sceneIdx.value / (scenes.length - 1) * 100 : 0)

// ── 动作函数 ───────────────────────────────────────────────────
function act_activate(ids) { ids.forEach(id => aEnts.value.add(id)) }
function act_pulse(id)     { const s = new Set(aEnts.value); s.add(id); aEnts.value = s }
function act_status(id, t) { eStatus[id] = t }
function act_receive(id)   { rEnts.value.add(id); T(() => rEnts.value.delete(id), 1600) }

function act_line(from, to, color, ck, durMs) {
  const pf = ep(from), pt = ep(to)
  const dx = pt.x - pf.x, dy = pt.y - pf.y, len = Math.sqrt(dx*dx + dy*dy)
  const id = ++lid, dur = durMs / 1000
  aLines.value.push({ id, d:`M${pf.x},${pf.y} L${pt.x},${pt.y}`, color, ck, len, off:len, dur })
  nextTick(() => T(() => { const l = aLines.value.find(x => x.id===id); if(l) l.off=0 }, 30))
}

function act_pkt(from, to, icon, label, color, dur) {
  const pf = ep(from), pt = ep(to), id = ++pid
  pkts.value.push({ id, x:pf.x-76, y:pf.y-28, icon, label, color, dur, arrive:false })
  T(() => { const p = pkts.value.find(x => x.id===id); if(p){ p.x=pt.x-76; p.y=pt.y-28 } }, 70)
  T(() => {
    const p = pkts.value.find(x => x.id===id)
    if(p){ p.arrive=true; act_receive(to) }
    T(() => { pkts.value = pkts.value.filter(x => x.id!==id) }, 800)
  }, dur + 70)
}

function act_burst(entId, icons, color, baseLabel) {
  const pos = ep(entId)
  icons.forEach((icon, i) => {
    const angle = (i / icons.length) * Math.PI * 2 - Math.PI / 2
    const r = 140, id = ++pid
    pkts.value.push({ id, x:pos.x-76, y:pos.y-28, icon, label:`${baseLabel}${i+1}`, color, dur:900, arrive:false })
    T(() => { const p = pkts.value.find(x => x.id===id); if(p){ p.x=pos.x+Math.cos(angle)*r-76; p.y=pos.y+Math.sin(angle)*r-28 } }, 80+i*110)
    T(() => { const p = pkts.value.find(x => x.id===id); if(p) p.arrive=true; T(() => { pkts.value=pkts.value.filter(x=>x.id!==id) }, 700) }, 1400+i*110)
  })
}

function act_aggregate() {
  const pos = ep('user')
  const offs = [[-150,-100],[0,-145],[150,-100]]
  offs.forEach(([ox,oy], i) => {
    const id = ++pid
    pkts.value.push({ id, x:pos.x+ox-76, y:pos.y+oy-28, icon:ICONS.pkt_key, label:`K${i+1}`, color:'#ce93d8', dur:1400, arrive:false })
    T(() => { const p = pkts.value.find(x => x.id===id); if(p){ p.x=pos.x-76; p.y=pos.y-28 } }, 90+i*220)
    T(() => { const p = pkts.value.find(x => x.id===id); if(p) p.arrive=true; T(() => { pkts.value=pkts.value.filter(x=>x.id!==id) }, 700) }, 1800+i*220)
  })
  T(() => {
    const id2 = ++pid
    pkts.value.push({ id:id2, x:pos.x-76, y:pos.y-100, icon:ICONS.pkt_akey, label:'AK_U 聚合密钥', color:'#ffd740', dur:200, arrive:false })
    T(() => { pkts.value = pkts.value.filter(x => x.id!==id2) }, 2800)
  }, 2800)
}

function act_focus(pa, pb, w, h, label, color) {
  let lx, ty, fw=w, fh=h
  if(pb){ lx=Math.min(pa.x,pb.x)-28; ty=Math.min(pa.y,pb.y)-35; fw=Math.abs(pb.x-pa.x)+160; fh=Math.abs(pb.y-pa.y)+170 }
  else  { lx=pa.x-w/2; ty=pa.y-h/2 }
  fbox.value = { lx, ty, w:fw, h:fh, label, color }
}

// ── 打字机 ─────────────────────────────────────────────────────
let typeTimer = null
function typeText(txt) {
  clearTimeout(typeTimer); typed.value = ''; showAdv.value = false; let i = 0
  function tick(){ typed.value = txt.slice(0,i); i++; if(i<=txt.length) typeTimer = T(tick, 22) }
  tick()
}

// ── 场景调度 ───────────────────────────────────────────────────
function runScene(idx) {
  if(idx >= scenes.length){ T(() => goIntro(), 2500); return }
  clearAll(); sceneIdx.value = idx
  aEnts.value = new Set(); rEnts.value = new Set()
  Object.keys(eStatus).forEach(k => delete eStatus[k])
  aLines.value = []; pkts.value = []; fbox.value = null; showAdv.value = false
  subKey.value++; typeText(scenes[idx].caption); scenes[idx].act()
  T(() => { if(!paused.value) runScene(idx+1) }, scenes[idx].duration)
}
function jumpTo(idx)    { clearAll(); paused.value=false; runScene(idx) }
function togglePause()  { if(paused.value){ paused.value=false; runScene(sceneIdx.value) } else{ paused.value=true; clearAll() } }

// ── 开场逻辑 ───────────────────────────────────────────────────
function startIntro() {
  phase.value='intro'; introStep.value=-1; introCountdown.value=14
  clearInterval(introCountInterval)
  T(() => { introStep.value=0 }, 600)
  introFeats.forEach((_,i) => T(() => { introStep.value=i+1 }, 900+i*650))
  let cnt = 14
  introCountInterval = setInterval(() => {
    cnt--; introCountdown.value = cnt
    if(cnt <= 0){ clearInterval(introCountInterval); startMain() }
  }, 1000)
}
function startMain() {
  clearInterval(introCountInterval); clearAll(); phase.value='main'
  nextTick(() => { resize(); T(() => runScene(0), 400) })
}
function goIntro() {
  clearAll(); clearInterval(introCountInterval); clearTimeout(typeTimer)
  phase.value='intro'; setTimeout(startIntro, 80)
}

// ── 粒子背景 ───────────────────────────────────────────────────
let paf = null
function initP(canvas) {
  if(!canvas) return; cancelAnimationFrame(paf)
  const ctx = canvas.getContext('2d')
  const W = canvas.width  = canvas.offsetWidth  || 1400
  const H = canvas.height = canvas.offsetHeight || 760
  const pts = Array.from({length:80}, () => ({
    x:Math.random()*W, y:Math.random()*H,
    vx:(Math.random()-.5)*.38, vy:(Math.random()-.5)*.38,
    r:Math.random()*1.8+.5, alpha:Math.random()*.28+.06
  }))
  function draw() {
    ctx.clearRect(0,0,W,H)
    pts.forEach(p => {
      p.x=(p.x+p.vx+W)%W; p.y=(p.y+p.vy+H)%H
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
      ctx.fillStyle=`rgba(100,200,255,${p.alpha})`; ctx.fill()
    })
    for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
      const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, d=Math.sqrt(dx*dx+dy*dy)
      if(d<95){ ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y); ctx.strokeStyle=`rgba(100,200,255,${(1-d/95)*.06})`; ctx.stroke() }
    }
    paf = requestAnimationFrame(draw)
  }
  draw()
}

function buildBgLines() {
  const pairs=[['user','ra'],['user','aa1'],['user','aa2'],['user','aa3'],['user','db'],['ra','ta'],['encryptor','db']]
  bgLines.value = pairs.map(([a,b],i) => { const pa=ep(a),pb=ep(b); return{id:i,x1:pa.x,y1:pa.y,x2:pb.x,y2:pb.y} })
}

function resize() {
  const el = stageWrap.value
  if(el){ SW.value=el.clientWidth||1400; SH.value=el.clientHeight||680 }
  buildBgLines()
  if(bgCanvas.value){ bgCanvas.value.width=SW.value; bgCanvas.value.height=SH.value; initP(bgCanvas.value) }
}

onMounted(() => {
  nextTick(() => {
    if(introCanvas.value) initP(introCanvas.value)
    startIntro()
    window.addEventListener('resize', resize)
  })
})
onUnmounted(() => {
  clearAll(); clearInterval(introCountInterval); clearTimeout(typeTimer)
  cancelAnimationFrame(paf); window.removeEventListener('resize', resize)
})
</script>

<style scoped>
.anim-root {
  position:fixed; inset:0; z-index:9999;
  background:#030d1a;
  font-family:'PingFang SC','Microsoft YaHei',sans-serif;
  overflow:hidden; color:#fff;
}
.bg-cv { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; opacity:.5; }

/* ══ 开场 ══ */
.intro-stage { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:42px; z-index:5; overflow:hidden; }
.intro-grid  { position:absolute; inset:0; background-image:linear-gradient(rgba(79,195,247,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(79,195,247,.04) 1px,transparent 1px); background-size:72px 72px; pointer-events:none; }

.intro-title-wrap { text-align:center; z-index:2; }
.intro-en   { font-size:19px; font-weight:300; color:rgba(79,195,247,.6); letter-spacing:2.5px; line-height:1.7; }
.intro-abbr { display:flex; justify-content:center; gap:9px; margin:22px 0 16px; }
.abbr-char  {
  display:inline-flex; align-items:center; justify-content:center;
  width:72px; height:72px;
  background:rgba(79,195,247,.08); border:2px solid rgba(79,195,247,.35); border-radius:14px;
  font-size:32px; font-weight:900; color:#4fc3f7; text-shadow:0 0 24px #4fc3f7;
  animation:charPop .55s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes charPop { from{transform:scale(0) rotateY(90deg);opacity:0} to{transform:scale(1) rotateY(0);opacity:1} }
.intro-cn { font-size:21px; font-weight:700; color:rgba(255,255,255,.8); letter-spacing:5px; margin-top:8px; }

.intro-features { display:flex; gap:18px; flex-wrap:wrap; justify-content:center; max-width:1100px; z-index:2; }
.intro-feat {
  width:164px; padding:20px 14px;
  background:rgba(2,11,24,.8); border:1.5px solid rgba(255,255,255,.1); border-radius:16px;
  text-align:center; animation:featSlide .55s cubic-bezier(.34,1.4,.64,1) both;
  backdrop-filter:blur(8px);
}
@keyframes featSlide { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }
/* 特性图片 */
.feat-img  { width:52px; height:52px; object-fit:contain; margin:0 auto 10px; display:block; }
.feat-name { font-size:13px; font-weight:700; margin-bottom:5px; }
.feat-desc { font-size:11px; color:rgba(255,255,255,.42); line-height:1.55; }

.intro-footer   { display:flex; align-items:center; gap:22px; z-index:2; }
.intro-skip     { padding:12px 28px; border-radius:9px; background:rgba(79,195,247,.12); border:1px solid rgba(79,195,247,.4); color:#4fc3f7; font-size:15px; font-weight:700; cursor:pointer; transition:all .2s; }
.intro-skip:hover { background:rgba(79,195,247,.25); }
.intro-countdown { font-size:13px; color:rgba(255,255,255,.3); }

.curtain-leave-active { transition:opacity .7s,transform .7s; } .curtain-leave-to { opacity:0; transform:scale(1.05); }
.slide-up-enter-active { transition:opacity .8s,transform .8s; } .slide-up-enter-from { opacity:0; transform:translateY(44px); }
.feat-in-enter-active { transition:all .5s; } .feat-in-enter-from { opacity:0; transform:translateY(22px) scale(.88); }

/* ══ 主演示 ══ */
.main-stage { position:absolute; inset:0; display:flex; flex-direction:column; }

.top-bar { display:flex; align-items:center; justify-content:space-between; padding:0 28px; height:56px; flex-shrink:0; background:rgba(3,13,26,.93); border-bottom:1px solid rgba(79,195,247,.13); z-index:10; }
.top-left { display:flex; align-items:center; gap:14px; }
.top-abbr { font-size:17px; font-weight:900; color:#4fc3f7; letter-spacing:3px; }
.top-sep  { color:rgba(255,255,255,.2); font-size:20px; }
.top-scene-name { font-size:14px; color:rgba(255,255,255,.5); }
.top-controls { display:flex; gap:8px; }
.ctrl-btn { padding:7px 18px; border-radius:7px; background:rgba(79,195,247,.07); border:1px solid rgba(79,195,247,.2); color:rgba(255,255,255,.7); font-size:13px; cursor:pointer; transition:all .2s; }
.ctrl-btn:hover { background:rgba(79,195,247,.18); color:#fff; }
.close-btn { border-color:rgba(255,107,107,.25); color:rgba(255,107,107,.7); }
.close-btn:hover { background:rgba(255,107,107,.14); color:#ff6b6b; }

/* 步骤条 */
.step-bar { position:relative; height:48px; flex-shrink:0; background:rgba(255,255,255,.02); border-bottom:1px solid rgba(255,255,255,.05); display:flex; align-items:center; padding:0 36px; overflow:hidden; }
.step-track-line { position:absolute; bottom:0; left:0; right:0; height:2.5px; background:rgba(255,255,255,.05); }
.step-track-fill { height:100%; background:linear-gradient(90deg,#4fc3f7,#69f0ae); transition:width .7s ease; box-shadow:0 0 8px #4fc3f7aa; }
.step-pill { display:flex; align-items:center; gap:7px; padding:5px 14px; border-radius:22px; cursor:pointer; transition:all .25s; flex-shrink:0; }
.step-pill:hover { background:rgba(79,195,247,.1); }
.pill-dot { width:9px; height:9px; border-radius:50%; background:rgba(255,255,255,.18); flex-shrink:0; transition:all .3s; }
.step-pill.done   .pill-dot { background:#4fc3f7; }
.step-pill.active .pill-dot { background:#69f0ae; box-shadow:0 0 8px #69f0ae; transform:scale(1.3); }
.pill-label { font-size:12px; color:rgba(255,255,255,.35); white-space:nowrap; }
.step-pill.done   .pill-label { color:rgba(79,195,247,.7); }
.step-pill.active .pill-label { color:#69f0ae; font-weight:700; font-size:13.5px; }

/* 舞台 */
.stage-wrap { flex:1; position:relative; overflow:hidden; }
.stage-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(79,195,247,.028) 1px,transparent 1px),linear-gradient(90deg,rgba(79,195,247,.028) 1px,transparent 1px); background-size:72px 72px; pointer-events:none; }
.link-svg   { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:2; }

/* ── 实体节点 ── */
.ent-node {
  position:absolute; transform:translate(-50%,-50%);
  display:flex; flex-direction:column; align-items:center;
  z-index:4; pointer-events:none; --ec:#4fc3f7;
}
/* 光圈 */
.ent-ring { position:absolute; border-radius:50%; border:2px solid var(--ec); opacity:0; pointer-events:none; }
.r1 { width:120px; height:120px; top:42%; left:50%; transform:translate(-50%,-50%); }
.r2 { width:158px; height:158px; top:42%; left:50%; transform:translate(-50%,-50%); }
.ent-node.active   .r1 { animation:rp 2.4s ease-out infinite; }
.ent-node.active   .r2 { animation:rp 2.4s ease-out infinite .5s; }
@keyframes rp { 0%{opacity:.6;transform:translate(-50%,-50%) scale(.75)} 100%{opacity:0;transform:translate(-50%,-50%) scale(1.6)} }
.ent-node.receiving .r1,
.ent-node.receiving .r2 { animation:rf 1s ease-out; }
@keyframes rf { 0%{opacity:.95;transform:translate(-50%,-50%) scale(.65)} 50%{opacity:.55;transform:translate(-50%,-50%) scale(1.85)} 100%{opacity:0;transform:translate(-50%,-50%) scale(2.2)} }

/* 图片容器 */
.ent-img-wrap {
  position:relative; width:110px; height:128px;
  transition:transform .4s, filter .4s;
  filter:drop-shadow(0 6px 16px rgba(0,0,0,.6));
}
.ent-img {
  width:110px; height:128px;
  object-fit:contain;
  display:block;
}
/* 底部光晕条（激活时出现） */
.ent-glow-bar {
  position:absolute; bottom:-6px; left:50%; transform:translateX(-50%);
  width:80px; height:12px;
  background:var(--ec); opacity:0;
  border-radius:50%; filter:blur(8px);
  transition:opacity .4s;
}
.ent-node.active .ent-img-wrap {
  transform:scale(1.1);
  filter:drop-shadow(0 0 20px var(--ec)) drop-shadow(0 6px 20px rgba(0,0,0,.7));
}
.ent-node.active .ent-glow-bar { opacity:.7; }

.ent-label { font-size:16px; font-weight:800; margin-top:10px; color:var(--ec); text-shadow:0 0 14px var(--ec); white-space:nowrap; }
.ent-sub   { font-size:12px; color:rgba(255,255,255,.3); margin-top:2px; }
.ent-badge { position:absolute; top:-20px; left:50%; transform:translateX(-50%); background:var(--ec); color:#030d1a; font-size:12px; font-weight:800; padding:4px 12px; border-radius:12px; white-space:nowrap; z-index:6; }
.badge-pop-enter-active { animation:bp .35s cubic-bezier(.34,1.56,.64,1); }
.badge-pop-leave-active { animation:bp .25s reverse; }
@keyframes bp { from{transform:translateX(-50%) scale(0);opacity:0} to{transform:translateX(-50%) scale(1);opacity:1} }

/* ── 飞行数据包 ── */
.pkt-layer { position:absolute; inset:0; pointer-events:none; z-index:8; }
.data-pkt  { position:absolute; pointer-events:none; }
.pkt-body  {
  display:flex; align-items:center; gap:10px;
  background:rgba(3,13,26,.94);
  border:2px solid var(--pc,#4fc3f7); border-radius:36px;
  padding:8px 20px 8px 10px;
  box-shadow:0 0 24px var(--pc,#4fc3f7)55;
  white-space:nowrap; position:relative;
}
/* 消息包图片 */
.pkt-icon-wrap { width:36px; height:36px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
.pkt-img       { width:36px; height:36px; object-fit:contain; }
.pkt-name      { font-size:15px; font-weight:800; color:var(--pc,#4fc3f7); }
.pkt-glow      { position:absolute; inset:-4px; border-radius:40px; background:var(--pc,#4fc3f7); opacity:0; filter:blur(14px); z-index:-1; transition:opacity .3s; }
.data-pkt.arrive .pkt-body { animation:pa .45s ease-out; box-shadow:0 0 44px var(--pc,#4fc3f7)bb; }
.data-pkt.arrive .pkt-glow { opacity:.28; animation:glowP .6s ease-out; }
@keyframes pa   { 0%{transform:scale(1.38)} 55%{transform:scale(.91)} 100%{transform:scale(1)} }
@keyframes glowP{ 0%{opacity:.6} 100%{opacity:0} }

/* ── 聚焦框 ── */
.focus-box { position:absolute; border:2.5px solid var(--fc,#4fc3f7); border-radius:20px; box-shadow:0 0 0 5px var(--fc,#4fc3f7)12, 0 0 60px var(--fc,#4fc3f7)28; pointer-events:none; z-index:3; }
.focus-label { position:absolute; top:-32px; left:50%; transform:translateX(-50%); background:var(--fc,#4fc3f7); color:#030d1a; font-size:13px; font-weight:800; padding:5px 18px; border-radius:12px; white-space:nowrap; }
.focus-fade-enter-active,
.focus-fade-leave-active { transition:opacity .5s, transform .5s; }
.focus-fade-enter-from,
.focus-fade-leave-to     { opacity:0; transform:scale(.92); }

/* ── 字幕 ── */
.sub-wrap { position:absolute; bottom:22px; left:50%; transform:translateX(-50%); width:min(980px,90vw); z-index:10; }
.sub-box  { background:rgba(3,13,26,.91); backdrop-filter:blur(20px); border:1px solid rgba(79,195,247,.2); border-radius:18px; padding:20px 32px; text-align:center; }
.sub-step { font-size:13px; font-weight:800; color:#4fc3f7; letter-spacing:2px; text-transform:uppercase; margin-bottom:9px; }
.sub-text { font-size:17px; color:rgba(255,255,255,.92); line-height:1.8; min-height:60px; }
.sub-adv  { display:inline-flex; align-items:center; gap:10px; margin-top:14px; background:rgba(105,240,174,.1); border:1px solid rgba(105,240,174,.3); border-radius:28px; padding:6px 22px; font-size:14px; font-weight:700; color:#69f0ae; }
.sub-fade-enter-active,
.sub-fade-leave-active { transition:opacity .4s, transform .4s; }
.sub-fade-enter-from   { opacity:0; transform:translateX(-50%) translateY(16px); }
.sub-fade-leave-to     { opacity:0; transform:translateX(-50%) translateY(-8px); }
.adv-fade-enter-active,
.adv-fade-leave-active { transition:opacity .5s; }
.adv-fade-enter-from,
.adv-fade-leave-to     { opacity:0; }
</style>
