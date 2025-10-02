这个项目的启动方式：
启动步骤

这是一个纯静态站点（index.html, about.html, food.html, exhibition.html 等搭配 models/ 下的 .fbx 模型），没有打包或构建配置，所以不需要安装依赖。
由于 Three.js 的 FBXLoader 通过 XHR 读取 models/*.fbx，直接用浏览器打开 file:// 会被同源策略拦截，必须用本地 HTTP 服务。
在仓库根目录 x:\projects\FOODICH\Food3Dweb 启一个静态服务器即可，例如安装了 Python 时运行 py -m http.server 8000；若有 Node.js，则可用 npx http-server 或 npx serve .。
启动后访问 http://127.0.0.1:8000/index.html（或对应端口）。确保网络可访问 CDN，否则 Three.js 依赖需要改为本地文件。




todo：

请修改下claypot页面的设计：1.返回按钮删除 2.需要与其他页面譬如about.html的视觉风格统一，a.背景颜色 b.把右上角的导航菜单按钮加上 3.文字框采用透明 毛玻璃风格

六个菜的文字与图片整理好，然后AI生成网页。（考虑如何编排 - 左边文字 右边图片视频即可）

https://qd9qc9jc3x.feishu.cn/wiki/VniqwyOFpiLYCZkxaglcWBTgnzc
https://www.figma.com/design/rWPYd93mkxmM5JmEvpLeML/Cook-Book?node-id=13-332&p=f&t=ye4KJfqaHevcmOyF-0


丢给文字，图片。
催钱 只给了8000hkd（7280rmb） 还差25000hkd（虽然invoice是36000 rmb 实际上开多了  谈的是33000hkd=30000rmb）




#煲仔飯 CLAYPOT RICE
煲仔飯的起源可以追溯到中國南方的農村地區。早在明清時期，廣東、福建等地的農民在勞動之餘，會將米、菜、肉等食材放入瓦煲中，用慢火燉煮，製作出美味的煲仔飯。這種烹調方式因簡單、便利、營養豐富而深受歡迎，逐漸流傳至香港。
我們邀請到了嚐囍煲仔小菜的康哥，分享了他對煲仔飯的見解以及如何使用AI進行記錄變化與創新的過程。




#客家酿豆腐、梅干菜肉
#蒜蓉虾、流汁汤包 浏阳蒸排骨





不要的：梅干菜肉煲仔飯是一道非常經典的廣東菜式，主要材料是梅干菜和肉，搭配煲仔飯烹煮而成。梅干菜具有酸甜、香脆的口感，肉則是鮮嫩多汁，搭配煲仔飯的香氣，讓整道菜色香味俱佳。





