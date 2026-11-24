# Franklin 的旅行地图

这是 Franklin 的个人主页。网站由 GitHub Pages 从 `main` 分支发布。

[打开个人主页](https://franklin3366.github.io/)

## 添加旅行记录

1. 登录 GitHub，打开 [旅行记录编辑页](https://github.com/franklin3366/franklin3366.github.io/edit/main/data/places.json)。
2. 把新地点加到方括号内。每条记录需要地点名、国家或地区、纬度和经度。到访日期和公开备注可以省略。
3. 点 **Commit changes…**，提交到 `main`。发布完成后，刷新主页就能看到新地点。

下面是填写示例。把地点和坐标替换成自己的旅行记录。有多条记录时，在相邻的 `}` 和 `{` 之间加逗号。

```json
[
  {
    "name": "京都",
    "country": "日本",
    "lat": 35.0116,
    "lng": 135.7681,
    "visited": "2025-04",
    "note": "沿着鸭川散步。"
  }
]
```

`visited` 支持 `YYYY-MM` 和 `YYYY-MM-DD`。`lat`、`lng` 填数字，可以用城市中心坐标。旅行地图和仓库文件都是公开内容。希望自己留存的行程、照片和备注可以放在单独的私有仓库里。

## 本地预览

在项目目录运行 `python3 -m http.server 8000`，再用浏览器打开 `http://localhost:8000/`。

底图使用 Natural Earth 的 1:110m 陆地数据。数据为公有领域。[数据来源及使用条款](https://www.naturalearthdata.com/about/terms-of-use/)
