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
            <div class="intro-cn">基于签名的隐私保护无中心访问控制系统</div>
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
        <!-- 背景光斑（科技感氛围） -->
        <div class="bg-orbs">
          <div class="orb orb1"></div>
          <div class="orb orb2"></div>
          <div class="orb orb3"></div>
          <div class="orb orb4"></div>
          <div class="orb orb5"></div>
          <div class="orb orb6"></div>
        </div>

        <!-- 实体节点 -->
        <div v-for="e in entities" :key="e.id" class="ent-node"
             :class="{active:aEnts.has(e.id), receiving:rEnts.has(e.id)}"
             :style="{left:e.x+'%', top:e.y+'%', '--ec':e.color}">
          <div class="ent-ring r1"></div>
          <div class="ent-ring r2"></div>
          <!-- 图片容器 -->
          <div class="ent-img-wrap" :class="{'is-person': e.isPerson, 'is-db': e.isDb}">
            <img :src="e.icon" class="ent-img" :alt="e.name"
                 @error="e=>e.target.src='/icons/placeholder.png'"/>
            <!-- 白色背景图片的四边渐变遮罩（仅人物类图标）-->
            <div v-if="e.isPerson" class="ent-img-fade"></div>
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
            <!-- labelBottom=true → 标签在框内底部；否则在框外顶部 -->
            <div class="focus-label" :class="{'label-bottom': fbox.labelBottom}">{{fbox.label}}</div>
          </div>
        </transition>

        <!-- 字幕：底部偏左，不遮挡右侧 aa3(x≈76%) -->
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
  // isPerson:true  → 加边框+渐变遮罩处理白色背景
  // isPerson:false → 不处理（数据库等非人物图标）
  { id:'encryptor', icon:ICONS.encryptor, name:'加密者',     sub:'Encryptor', x:7,  y:26, color:'#ffd740', isPerson:true  },
  { id:'db',        icon:ICONS.db,        name:'数据库',     sub:'Database',  x:7,  y:70, color:'#90a4ae', isPerson:false, isDb:true   },
  { id:'ra',        icon:ICONS.ra,        name:'注册机构',   sub:'RA',        x:30, y:18, color:'#4fc3f7', isPerson:true  },
  { id:'user',      icon:ICONS.user,      name:'用 户',      sub:'User',      x:52, y:46, color:'#69f0ae', isPerson:true  },
  { id:'aa1',       icon:ICONS.aa,        name:'授权机构 1', sub:'AA₁',       x:76, y:18, color:'#ce93d8', isPerson:true  },
  { id:'aa2',       icon:ICONS.aa,        name:'授权机构 2', sub:'AA₂',       x:76, y:46, color:'#ce93d8', isPerson:true  },
  { id:'aa3',       icon:ICONS.aa,        name:'授权机构 3', sub:'AA₃',       x:76, y:77, color:'#ce93d8', isPerson:true  },
  { id:'ta',        icon:ICONS.ta,        name:'追踪机构',   sub:'TA',        x:93, y:32, color:'#ff6b6b', isPerson:true  },
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
      T(()=>act_focus_aa('各 AA 独立生成密钥对，互不知晓','#ce93d8'), 4800)
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
      T(()=>act_focus_db('密文与关键词 W、时间段 T 绑定','#90a4ae'), 6300)
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
      T(()=>act_focus_aa('AA 独立验证凭证合法性，签发 K_j','#ce93d8'), 4700)
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
      T(()=>act_focus_db('验证：T_E = T_U ✓（时间段匹配）','#90a4ae'), 3900)
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
  const pos  = ep('user')
  // K₁/K₂/K₃ 从三个AA的位置飞向user，避免起始点在AA图标下方
  const aa_srcs = [ep('aa1'), ep('aa2'), ep('aa3')]
  aa_srcs.forEach((src, i) => {
    const id = ++pid
    pkts.value.push({ id, x:src.x-76, y:src.y-28, icon:ICONS.pkt_key, label:`K${i+1}`, color:'#ce93d8', dur:1600, arrive:false })
    T(() => { const p = pkts.value.find(x => x.id===id); if(p){ p.x=pos.x-76; p.y=pos.y-28 } }, 90+i*220)
    T(() => { const p = pkts.value.find(x => x.id===id); if(p) p.arrive=true; T(() => { pkts.value=pkts.value.filter(x=>x.id!==id) }, 700) }, 1900+i*220)
  })
  // AK_U 出现在user正上方的空旷区域（不被AA遮挡）
  T(() => {
    const id2 = ++pid
    // 出现在user上方、偏左，远离AA区域
    pkts.value.push({ id:id2, x:pos.x-160, y:pos.y-130, icon:ICONS.pkt_akey, label:'AK_U 聚合密钥', color:'#ffd740', dur:200, arrive:false })
    T(() => { pkts.value = pkts.value.filter(x => x.id!==id2) }, 2800)
  }, 2800)
}

function act_focus(pa, pb, w, h, label, color) {
  let lx, ty, fw=w, fh=h
  if(pb){ lx=Math.min(pa.x,pb.x)-28; ty=Math.min(pa.y,pb.y)-35; fw=Math.abs(pb.x-pa.x)+160; fh=Math.abs(pb.y-pa.y)+170 }
  else  { lx=pa.x-w/2; ty=pa.y-h/2 }
  // 边界保护：不超出屏幕左/上/下边缘，留20px间距
  lx = Math.max(20, lx)
  ty = Math.max(20, ty)
  // 右边界：不超出舞台宽度
  if(lx + fw > SW.value - 20) lx = SW.value - fw - 20
  // 下边界：不超出舞台高度
  if(ty + fh > SH.value - 20) ty = SH.value - fh - 20
  fbox.value = { lx, ty, w:fw, h:fh, label, color }
}

// AA群区聚焦：覆盖aa1~aa3，label显示在框左侧（远离顶部，不遮icon）
function act_focus_aa(label, color) {
  const pa = ep('aa1'), pb = ep('aa3')
  const margin = 30
  const lx = Math.min(pa.x, pb.x) - margin
  // 顶部多留40px，避免label(-40px)超出step-bar
  const ty = Math.min(pa.y, pb.y) - margin + 40
  const fw = Math.abs(pb.x - pa.x) + margin*2 + 80
  const fh = Math.abs(pb.y - pa.y) + margin*2 - 30
  // 边界保护
  const safeLx = Math.max(10, Math.min(lx, SW.value - fw - 10))
  const safeTy = Math.max(10, Math.min(ty, SH.value - fh - 60))
  fbox.value = { lx:safeLx, ty:safeTy, w:fw, h:fh, label, color }
}

// DB专用聚焦：DB位于左侧x≈7%，聚焦框强制偏右显示，避免超出屏幕
function act_focus_db(label, color) {
  const pos = ep('db')
  // 框以DB图标为中心，包围图标，label在框底部内侧
  const fw = 210, fh = 240
  const lx = Math.max(8, pos.x - fw / 2)
  const ty = Math.max(8, pos.y - fh / 2)
  fbox.value = { lx, ty, w:fw, h:fh, label, color, labelBottom: true }
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
  const pts = Array.from({length:110}, () => ({
    x:Math.random()*W, y:Math.random()*H,
    vx:(Math.random()-.5)*.42, vy:(Math.random()-.5)*.42,
    r:Math.random()*2.2+.6,
    alpha:Math.random()*.5+.15,   // 更亮
    hue: Math.random() > .7 ? 200 : (Math.random() > .5 ? 180 : 160), // 蓝/青变化
  }))
  function draw() {
    ctx.clearRect(0,0,W,H)
    pts.forEach(p => {
      p.x=(p.x+p.vx+W)%W; p.y=(p.y+p.vy+H)%H
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
      ctx.fillStyle=`hsla(${p.hue},90%,75%,${p.alpha})`; ctx.fill()
    })
    for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
      const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, d=Math.sqrt(dx*dx+dy*dy)
      if(d<110){
        ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y)
        ctx.strokeStyle=`rgba(100,210,255,${(1-d/110)*.12})`; ctx.stroke()
      }
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
  /* 亮一级的深蓝底色，可见更多细节 */
  background:
    radial-gradient(ellipse at 20% 50%, #091d38 0%, transparent 55%),
    radial-gradient(ellipse at 80% 20%, #120828 0%, transparent 50%),
    radial-gradient(ellipse at 60% 80%, #041a14 0%, transparent 50%),
    #030c18;
  font-family:'PingFang SC','Microsoft YaHei',sans-serif;
  overflow:hidden; color:#fff;
}
.bg-cv { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; opacity:.9; }

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

.top-bar { display:flex; align-items:center; justify-content:space-between; padding:0 32px; height:60px; flex-shrink:0; background:rgba(3,13,26,.96); border-bottom:1px solid rgba(79,195,247,.2); z-index:10; }
.top-left { display:flex; align-items:center; gap:16px; }
.top-abbr { font-size:22px; font-weight:900; color:#4fc3f7; letter-spacing:5px; text-shadow:0 0 24px #4fc3f788; }
.top-sep  { color:rgba(255,255,255,.2); font-size:22px; }
.top-scene-name { font-size:18px; color:rgba(255,255,255,.7); font-weight:600; }
.top-controls { display:flex; gap:8px; }
.ctrl-btn { padding:9px 22px; border-radius:9px; background:rgba(79,195,247,.08); border:1px solid rgba(79,195,247,.22); color:rgba(255,255,255,.78); font-size:14px; cursor:pointer; transition:all .2s; letter-spacing:.3px; }
.ctrl-btn:hover { background:rgba(79,195,247,.2); color:#fff; }
.close-btn { border-color:rgba(255,107,107,.28); color:rgba(255,107,107,.75); }
.close-btn:hover { background:rgba(255,107,107,.16); color:#ff6b6b; }

/* 步骤条 */
.step-bar { position:relative; height:56px; flex-shrink:0; background:rgba(4,16,36,.85); border-bottom:1px solid rgba(79,195,247,.15); display:flex; align-items:center; padding:0 36px; overflow:hidden; gap:2px; }
.step-track-line { position:absolute; bottom:0; left:0; right:0; height:3px; background:rgba(255,255,255,.06); }
.step-track-fill { height:100%; background:linear-gradient(90deg,#4fc3f7,#69f0ae); transition:width .7s ease; box-shadow:0 0 14px #4fc3f7cc; }
.step-pill { display:flex; align-items:center; gap:8px; padding:6px 16px; border-radius:24px; cursor:pointer; transition:all .25s; flex-shrink:0; }
.step-pill:hover { background:rgba(79,195,247,.12); }
.pill-dot { width:11px; height:11px; border-radius:50%; background:rgba(255,255,255,.2); flex-shrink:0; transition:all .3s; border:1.5px solid rgba(255,255,255,.15); }
.step-pill.done   .pill-dot { background:#4fc3f7; border-color:#4fc3f7; box-shadow:0 0 6px #4fc3f788; }
.step-pill.active .pill-dot { background:#69f0ae; border-color:#69f0ae; box-shadow:0 0 10px #69f0ae; transform:scale(1.4); }
.pill-label { font-size:15px; color:rgba(255,255,255,.42); white-space:nowrap; letter-spacing:.4px; font-weight:500; }
.step-pill.done   .pill-label { color:rgba(79,195,247,.85); font-weight:600; }
.step-pill.active .pill-label { color:#69f0ae; font-weight:800; font-size:16px; letter-spacing:.5px; }

/* 舞台 */
.stage-wrap { flex:1; position:relative; overflow:hidden; }
.stage-grid {
  position:absolute; inset:0; pointer-events:none;
  background-image:
    /* 细网格 */
    linear-gradient(rgba(79,195,247,.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(79,195,247,.07) 1px, transparent 1px),
    /* 大网格（更稀疏） */
    linear-gradient(rgba(79,195,247,.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(79,195,247,.12) 1px, transparent 1px);
  background-size: 60px 60px, 60px 60px, 240px 240px, 240px 240px;
}
.link-svg   { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:2; }
/* ══ 精致背景系统 ══ */
.bg-orbs { position:absolute; inset:0; pointer-events:none; z-index:0; overflow:hidden; }
.orb { position:absolute; border-radius:50%; }

/* ── 区域光斑（对应各实体主题色） ── */
/* 左侧加密者区 — 金黄暖光 */
.orb1 {
  width:460px; height:460px;
  background:radial-gradient(circle at 40% 40%, rgba(180,110,0,.28) 0%, rgba(120,70,0,.12) 40%, transparent 70%);
  top:5%; left:-8%; filter:blur(60px);
  animation:orbFloat 20s ease-in-out infinite;
}
/* RA区 — 科技蓝 */
.orb2 {
  width:400px; height:400px;
  background:radial-gradient(circle at 50% 50%, rgba(20,90,180,.32) 0%, rgba(10,50,120,.14) 45%, transparent 70%);
  top:-10%; left:20%; filter:blur(55px);
  animation:orbFloat 25s ease-in-out infinite 3s;
}
/* 用户区 — 翠绿生机 */
.orb3 {
  width:500px; height:500px;
  background:radial-gradient(circle at 50% 50%, rgba(8,100,55,.3) 0%, rgba(4,60,30,.12) 45%, transparent 70%);
  top:22%; left:36%; filter:blur(65px);
  animation:orbFloat 28s ease-in-out infinite 7s;
}
/* AA群区 — 深紫权威 */
.orb4 {
  width:520px; height:700px;
  background:radial-gradient(ellipse at 50% 40%, rgba(80,20,140,.3) 0%, rgba(50,10,90,.14) 45%, transparent 70%);
  top:-8%; right:-6%; filter:blur(70px);
  animation:orbFloat 22s ease-in-out infinite 2s;
}
/* TA区 — 深红警示 */
.orb5 {
  width:340px; height:340px;
  background:radial-gradient(circle at 50% 50%, rgba(140,20,20,.32) 0%, rgba(90,10,10,.14) 45%, transparent 70%);
  top:12%; right:-4%; filter:blur(50px);
  animation:orbFloat 18s ease-in-out infinite 10s;
}
/* 底部氛围光 — 深蓝底色 */
.orb6 {
  width:800px; height:300px;
  background:radial-gradient(ellipse at 50% 50%, rgba(4,30,70,.5) 0%, rgba(2,15,40,.2) 50%, transparent 70%);
  bottom:-8%; left:10%; filter:blur(50px);
  animation:orbFloat 35s ease-in-out infinite 5s;
}

@keyframes orbFloat {
  0%,100% { transform:translate(0,0) scale(1); }
  25%     { transform:translate(20px,-15px) scale(1.04); }
  50%     { transform:translate(-12px,18px) scale(.97); }
  75%     { transform:translate(15px,10px) scale(1.02); }
}

/* ── 科技扫描线 ── */
.scan-line {
  position:absolute; left:0; right:0; height:2px; z-index:1; pointer-events:none;
  background:linear-gradient(90deg, transparent 0%, rgba(79,195,247,.35) 30%, rgba(105,240,174,.5) 50%, rgba(79,195,247,.35) 70%, transparent 100%);
  filter:blur(1px);
  animation:scanDown 12s linear infinite;
  opacity:.6;
}
@keyframes scanDown {
  0%   { top:-2px; opacity:0; }
  3%   { opacity:.6; }
  97%  { opacity:.4; }
  100% { top:100%; opacity:0; }
}

/* ── 实体节点 ── */
.ent-node {
  position:absolute; transform:translate(-50%,-50%);
  display:flex; flex-direction:column; align-items:center;
  z-index:5; pointer-events:none; --ec:#4fc3f7;
}
/* 光圈 */
.ent-ring { position:absolute; border-radius:50%; border:2px solid var(--ec); opacity:0; pointer-events:none; }
.r1 { width:162px; height:162px; top:42%; left:50%; transform:translate(-50%,-50%); }
.r2 { width:208px; height:208px; top:42%; left:50%; transform:translate(-50%,-50%); }
.ent-node.active   .r1 { animation:rp 2.4s ease-out infinite; }
.ent-node.active   .r2 { animation:rp 2.4s ease-out infinite .5s; }
@keyframes rp { 0%{opacity:.6;transform:translate(-50%,-50%) scale(.75)} 100%{opacity:0;transform:translate(-50%,-50%) scale(1.6)} }
.ent-node.receiving .r1,
.ent-node.receiving .r2 { animation:rf 1s ease-out; }
@keyframes rf { 0%{opacity:.95;transform:translate(-50%,-50%) scale(.65)} 50%{opacity:.55;transform:translate(-50%,-50%) scale(1.85)} 100%{opacity:0;transform:translate(-50%,-50%) scale(2.2)} }

/* 图片容器 */
.ent-img-wrap {
  position:relative; width:150px; height:174px;
  transition:transform .4s, filter .4s, box-shadow .4s;
  /* 默认圆角裁剪，配合背景色和边框 */
  border-radius:20px;
  overflow:hidden;
}
/* 人物类图标：加背景色 + 彩色边框，融合白色背景图片 */
.ent-img-wrap.is-person {
  background: rgba(8, 20, 40, 0.85);
  border: 2.5px solid rgba(255,255,255,0.15);
  box-shadow: 0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08);
}
/* 数据库：科技感六边形/矩形框，带角标装饰 */
.ent-img-wrap.is-db {
  background: rgba(6, 18, 36, 0.9);
  border: 1.5px solid rgba(144,164,174,0.35);
  border-radius: 14px;
  box-shadow:
    0 0 0 4px rgba(144,164,174,0.06),
    0 0 30px rgba(144,164,174,0.15),
    inset 0 0 20px rgba(79,195,247,0.05);
  /* 四角装饰用 outline */
  outline: 1px solid rgba(79,195,247,0.1);
  outline-offset: 6px;
}
/* 激活时DB框变亮 */
.ent-node.active .ent-img-wrap.is-db {
  border-color: rgba(144,164,174,0.7) !important;
  box-shadow:
    0 0 0 3px rgba(144,164,174,0.15),
    0 0 40px rgba(144,164,174,0.35),
    inset 0 0 20px rgba(79,195,247,0.1) !important;
  outline-color: rgba(79,195,247,0.3);
}
.ent-img {
  width:150px; height:174px;
  object-fit:contain;
  display:block;
}
/* 四边渐变遮罩：让白色背景图片和深色容器平滑过渡 */
.ent-img-fade {
  position:absolute; inset:0; border-radius:18px;
  pointer-events:none; z-index:2;
  /* 四边向内渐变为透明，使图片边缘融入容器背景 */
  background:
    linear-gradient(to bottom,  rgba(8,20,40,0.55) 0%, transparent 22%, transparent 75%, rgba(8,20,40,0.7) 100%),
    linear-gradient(to right,   rgba(8,20,40,0.45) 0%, transparent 18%, transparent 82%, rgba(8,20,40,0.45) 100%);
}
/* 底部光晕条（激活时出现） */
.ent-glow-bar {
  position:absolute; bottom:0; left:0; right:0; height:40px;
  background: linear-gradient(to top, var(--ec), transparent);
  opacity:0; z-index:3;
  transition:opacity .4s;
}
.ent-node.active .ent-img-wrap {
  transform:scale(1.08);
  border-color: var(--ec) !important;
  box-shadow: 0 0 0 2px var(--ec), 0 0 28px var(--ec)88, 0 6px 24px rgba(0,0,0,0.7) !important;
}
.ent-node.active .ent-glow-bar { opacity:.55; }

.ent-label { font-size:20px; font-weight:900; margin-top:14px; color:var(--ec); text-shadow:0 0 18px var(--ec); white-space:nowrap; letter-spacing:.8px; }
.ent-sub   { font-size:14px; color:rgba(255,255,255,.45); margin-top:4px; font-weight:500; }
.ent-badge {
  position:absolute;
  /* 放在图标和label之间：ent-img-wrap高174px，ent-label margin-top14px */
  bottom: -56px;   /* 图标底部下方，label上方区域 */
  left:50%; transform:translateX(-50%);
  background:var(--ec); color:#030d1a;
  font-size:13px; font-weight:800;
  padding:5px 14px; border-radius:14px;
  white-space:nowrap; z-index:6;
  box-shadow:0 2px 12px var(--ec)66;
}
.badge-pop-enter-active { animation:bp .35s cubic-bezier(.34,1.56,.64,1); }
.badge-pop-leave-active { animation:bp .25s reverse; }
@keyframes bp { from{transform:translateX(-50%) scale(0) translateY(-6px);opacity:0} to{transform:translateX(-50%) scale(1) translateY(0);opacity:1} }

/* ── 飞行数据包 ── */
.pkt-layer { position:absolute; inset:0; pointer-events:none; z-index:8; }
.data-pkt  { position:absolute; pointer-events:none; }
.pkt-body  {
  display:flex; align-items:center; gap:10px;
  background:rgba(3,13,26,.94);
  border:2px solid var(--pc,#4fc3f7); border-radius:36px;
  padding:10px 24px 10px 12px;
  box-shadow:0 0 24px var(--pc,#4fc3f7)55;
  white-space:nowrap; position:relative;
}
/* 消息包图片 */
.pkt-icon-wrap { width:52px; height:52px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
.pkt-img       { width:52px; height:52px; object-fit:contain; }
.pkt-name      { font-size:18px; font-weight:800; color:var(--pc,#4fc3f7); letter-spacing:.4px; }
.pkt-glow      { position:absolute; inset:-4px; border-radius:40px; background:var(--pc,#4fc3f7); opacity:0; filter:blur(14px); z-index:-1; transition:opacity .3s; }
.data-pkt.arrive .pkt-body { animation:pa .45s ease-out; box-shadow:0 0 44px var(--pc,#4fc3f7)bb; }
.data-pkt.arrive .pkt-glow { opacity:.28; animation:glowP .6s ease-out; }
@keyframes pa   { 0%{transform:scale(1.38)} 55%{transform:scale(.91)} 100%{transform:scale(1)} }
@keyframes glowP{ 0%{opacity:.6} 100%{opacity:0} }

/* ── 聚焦框 ── */
.focus-box { position:absolute; border:2.5px solid var(--fc,#4fc3f7); border-radius:20px; box-shadow:0 0 0 5px var(--fc,#4fc3f7)18, 0 0 60px var(--fc,#4fc3f7)30; pointer-events:none; z-index:6; }
.focus-label {
  /* 默认：框外顶部悬浮 */
  position:absolute; top:-40px; left:50%;
  transform:translateX(-50%);
  background:rgba(3,13,26,.92);
  border:1.5px solid var(--fc,#4fc3f7);
  color:var(--fc,#4fc3f7);
  font-size:15px; font-weight:800;
  padding:7px 22px; border-radius:12px;
  white-space:nowrap; z-index:10;
  backdrop-filter:blur(10px);
  box-shadow:0 0 20px var(--fc,#4fc3f7)55, 0 4px 12px rgba(0,0,0,.5);
}
/* DB专用：标签贴在框内底部 */
.focus-label.label-bottom {
  top:auto; bottom:10px;
  /* 字号略小，适配DB紧凑框 */
  font-size:13px; padding:5px 16px; border-radius:9px;
  /* 半透明背景，不完全遮挡icon */
  background:rgba(3,13,26,.82);
  max-width:90%; text-align:center;
  white-space:normal; line-height:1.4;
}
.focus-fade-enter-active,
.focus-fade-leave-active { transition:opacity .5s, transform .5s; }
.focus-fade-enter-from,
.focus-fade-leave-to     { opacity:0; transform:scale(.92); }

/* ── 字幕 ── */
/* 字幕：底部居中偏左，右边界不超过画面60%，不遮挡aa3(x≈76%) */
.sub-wrap {
  position:absolute;
  bottom:20px;
  /* left:50% + translateX(-70%) => 视觉中心在画面约 35%，右边界约 58% */
  left: 50%;
  transform: translateX(-70%);
  width: clamp(380px, 52vw, 700px);
  z-index:10;
}
.sub-box {
  background:rgba(4,16,36,.92); backdrop-filter:blur(24px);
  border:1px solid rgba(79,195,247,.22);
  border-radius:14px;
  padding:16px 22px;
  text-align:center;
}
.sub-step { font-size:13px; font-weight:800; color:#4fc3f7; letter-spacing:2.5px; text-transform:uppercase; margin-bottom:9px; }
.sub-text { font-size:18px; color:rgba(255,255,255,.93); line-height:1.82; min-height:0; }
.sub-adv  { display:inline-flex; align-items:center; gap:9px; margin-top:12px; background:rgba(105,240,174,.09); border:1px solid rgba(105,240,174,.28); border-radius:22px; padding:7px 18px; font-size:15px; font-weight:700; color:#69f0ae; }
.sub-fade-enter-active,
.sub-fade-leave-active { transition:opacity .4s, transform .4s; }
.sub-fade-enter-from   { opacity:0; transform:translateX(-70%) translateY(14px); }
.sub-fade-leave-to     { opacity:0; transform:translateX(-70%) translateY(-8px); }
.adv-fade-enter-active,
.adv-fade-leave-active { transition:opacity .5s; }
.adv-fade-enter-from,
.adv-fade-leave-to     { opacity:0; }
</style>
