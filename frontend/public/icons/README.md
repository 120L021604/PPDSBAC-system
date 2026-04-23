# PPDSBAC 动画图标替换说明

## 目录结构

```
frontend/public/icons/
├── ra.png           ← 注册机构 RA（警察/政府官员风格）
├── ta.png           ← 追踪机构 TA（军警/安全机构风格）
├── aa.png           ← 授权机构 AA（执法官员/警察风格，AA1/AA2/AA3共用）
├── user.png         ← 普通用户
├── encryptor.png    ← 加密者（服务加密方）
├── db.png           ← 数据库
│
├── pkt_zk.png       ← 消息包：零知识证明
├── pkt_cred.png     ← 消息包：匿名凭证 σ
├── pkt_id.png       ← 消息包：身份信息 (ID, PK)
├── pkt_ct.png       ← 消息包：密文 CT
├── pkt_req.png      ← 消息包：访问请求
├── pkt_key.png      ← 消息包：访问权限 K_j
├── pkt_akey.png     ← 消息包：聚合密钥 AK_U
├── pkt_data.png     ← 消息包：服务明文 M
├── pkt_pseudo.png   ← 消息包：伪名 PU
├── pkt_face.png     ← 消息包：追踪还原的真实身份
│
├── feat_link.png    ← 特性图标：不可链接
├── feat_sign.png    ← 特性图标：不可伪造
├── feat_agg.png     ← 特性图标：可聚合
├── feat_nosp.png    ← 特性图标：非交互
├── feat_trace.png   ← 特性图标：可追踪
└── feat_revoke.png  ← 特性图标：直接撤销
```

## 推荐图片规格

| 类型 | 建议尺寸 | 格式 | 说明 |
|------|---------|------|------|
| 实体图标（人物/机构） | 200×240px | PNG（透明背景） | 人物站立姿势，透明背景最佳 |
| 消息包图标 | 64×64px | PNG（透明背景） | 小图标，表示传输的数据类型 |
| 特性图标 | 80×80px | PNG（透明背景） | 开场介绍用，表示方案特性 |

## 如何替换

1. 准备好你的图片，尺寸参考上表
2. 将图片重命名为上面对应的文件名
3. 放入 `frontend/public/icons/` 目录，覆盖原有占位图
4. 刷新浏览器即可看到效果，**无需修改任何代码**

## 如果想为三个 AA 分别使用不同图片

打开 `frontend/src/views/AnimDemo.vue`，找到 `ICONS` 对象，修改：

```js
// 当前（共用同一图片）
aa: '/icons/aa.png',

// 修改为分别指定
aa1: '/icons/aa1.png',
aa2: '/icons/aa2.png',
aa3: '/icons/aa3.png',
```

然后在 `entities` 数组中将：
```js
{ id:'aa1', icon:ICONS.aa, ... }
```
改为：
```js
{ id:'aa1', icon:ICONS.aa1, ... }
```

## 推荐图片来源

- **Flaticon** https://www.flaticon.com — 搜索 police officer / government / user / database
- **Freepik** https://www.freepik.com — 搜索 flat character illustration
- **Icons8** https://icons8.com — 有大量免费扁平风格人物图标
- **Iconfont** https://www.iconfont.cn — 阿里巴巴图标库，适合论文风格

## 参考图风格建议

参考论文 Fig.1 的图标风格：
- 人物：扁平卡通风，有肤色填充，制服细节丰富
- 警察/官员类图标：制服 + 帽子 + 徽章
- 用户：普通人物，可以有职业特征（如使用电脑）
- 数据库：经典蓝色圆柱体图标
