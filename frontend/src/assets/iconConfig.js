/**
 * PPDSBAC 动画图标资源配置
 * ============================================================
 * 【如何替换图片】
 *   1. 将你的图片文件（PNG/SVG/WebP）放到 public/icons/ 目录下
 *   2. 修改下方对应条目的路径即可，无需修改动画代码
 *   3. 推荐图片尺寸：实体图标 200×240px，消息包图标 64×64px
 *   4. 支持 PNG / SVG / WebP / GIF（GIF可实现单图标动画）
 *   5. 也可以填写网络URL，如 'https://...'
 *
 * 【当前使用的占位图】
 *   来自 https://api.dicebear.com 的免费开源头像
 *   替换为正式图片后删除这些注释即可
 * ============================================================
 */

// ── 实体图标（站立人物/机构图标）──────────────────────────────
// 替换这里的路径为你的图片文件名（放在 public/icons/ 目录下）
export const ENTITY_ICONS = {
  // 注册机构 RA — 警察/政府官员风格
  ra: '/icons/ra.png',

  // 追踪机构 TA — 军警/安全机构风格
  ta: '/icons/ta.png',

  // 授权机构 AA — 执法官员/警察风格
  // 三个AA共用同一图片，也可以分别指定 aa1/aa2/aa3
  aa: '/icons/aa.png',

  // 普通用户
  user: '/icons/user.png',

  // 加密者（服务加密方）
  encryptor: '/icons/encryptor.png',

  // 数据库
  db: '/icons/db.png',
}

// ── 消息包图标（传输中的数据包）──────────────────────────────
export const PACKET_ICONS = {
  // 零知识证明
  zk:     '/icons/pkt_zk.png',
  // 匿名凭证 σ
  cred:   '/icons/pkt_cred.png',
  // 身份信息 (ID, PK)
  id:     '/icons/pkt_id.png',
  // 密文 CT
  ct:     '/icons/pkt_ct.png',
  // 访问请求
  req:    '/icons/pkt_req.png',
  // 访问权限 K_j（签名密钥）
  key:    '/icons/pkt_key.png',
  // 聚合密钥 AK_U
  akey:   '/icons/pkt_akey.png',
  // 服务明文 M
  data:   '/icons/pkt_data.png',
  // 伪名 PU
  pseudo: '/icons/pkt_pseudo.png',
  // 追踪还原的真实身份
  face:   '/icons/pkt_face.png',
}

// ── 开场介绍特性图标 ─────────────────────────────────────────
export const FEAT_ICONS = {
  link:   '/icons/feat_link.png',
  sign:   '/icons/feat_sign.png',
  agg:    '/icons/feat_agg.png',
  nosp:   '/icons/feat_nosp.png',
  trace:  '/icons/feat_trace.png',
  revoke: '/icons/feat_revoke.png',
}
